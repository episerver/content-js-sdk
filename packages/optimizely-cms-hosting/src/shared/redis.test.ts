import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cluster = vi.hoisted(() => ({
  connect: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  masters: [{ id: 'm1' }, { id: 'm2' }],
  nodeClient: vi.fn(),
}));

vi.mock('redis', () => ({ createCluster: vi.fn(() => cluster) }));
vi.mock('@azure/identity', () => ({ ManagedIdentityCredential: vi.fn() }));
vi.mock('@redis/entraid', () => ({
  DEFAULT_TOKEN_MANAGER_CONFIG: {},
  REDIS_SCOPE_DEFAULT: 'https://redis.azure.com/.default',
  EntraIdCredentialsProviderFactory: { createForDefaultAzureCredential: vi.fn() },
}));

const STORE_STATE = Symbol.for('@optimizely/cms-hosting/redis');

const loadStore = async () => {
  const { createCacheStore } = await import('./redis.js');
  const { createCluster } = await import('redis');
  const { ManagedIdentityCredential } = await import('@azure/identity');
  return {
    createCacheStore,
    createCluster: vi.mocked(createCluster),
    ManagedIdentityCredential,
  };
};

beforeEach(() => {
  vi.resetModules();
  // The store keeps its state on globalThis, which resetModules does not reset
  delete (globalThis as Record<symbol, unknown>)[STORE_STATE];
  vi.resetAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubEnv('REDIS_URL', undefined);
  vi.stubEnv('AZURE_CLIENT_ID', undefined);
  vi.stubEnv('OPTIMIZELY_DXP_DEPLOYMENT_ID', 'slot1');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('createCacheStore without Redis', () => {
  it('stores and reads JSON values in memory', async () => {
    const { createCacheStore, createCluster } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/en', { value: 1 });

    expect(await store.get('/en')).toEqual({ value: 1 });
    expect(await store.get('/missing')).toBeNull();
    expect(createCluster).not.toHaveBeenCalled();
  });

  it('can share entries across deployment slots', async () => {
    const { createCacheStore } = await loadStore();
    const options = { sharedAcrossDeployments: true };
    const shared = createCacheStore('webhook', options);
    vi.stubEnv('OPTIMIZELY_DXP_DEPLOYMENT_ID', 'slot2');
    const sharedInOtherSlot = createCacheStore('webhook', options);

    await shared.set('docs/abc_en', ['/en']);

    expect(await sharedInOtherSlot.get('docs/abc_en')).toEqual(['/en']);
  });

  it('warns once that REDIS_URL is not set', async () => {
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/a', 1);
    await store.get('/a');

    expect(console.warn).toHaveBeenCalledOnce();
    expect(console.warn).toHaveBeenCalledWith(
      '[cms-hosting] REDIS_URL is not set, using the in-memory cache',
    );
  });

  it('keeps frameworks and deployment slots apart', async () => {
    const { createCacheStore } = await loadStore();
    const nextjs = createCacheStore('nextjs');
    const astro = createCacheStore('astro');
    vi.stubEnv('OPTIMIZELY_DXP_DEPLOYMENT_ID', 'slot2');
    const otherSlot = createCacheStore('nextjs');

    await nextjs.set('/en', 'nextjs');

    expect(await astro.get('/en')).toBeNull();
    expect(await otherSlot.get('/en')).toBeNull();
  });

  it('expires entries after their TTL', async () => {
    vi.useFakeTimers();
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/en', 'value', 10);
    vi.advanceTimersByTime(9_000);
    expect(await store.get('/en')).toBe('value');

    vi.advanceTimersByTime(2_000);
    expect(await store.get('/en')).toBeNull();
  });

  it('evicts the least recently used entries beyond 50 MB', async () => {
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');
    const twentyMegabytes = 'x'.repeat(20 * 1024 * 1024);

    await store.set('/a', twentyMegabytes);
    await store.set('/b', twentyMegabytes);
    await store.get('/a');
    await store.set('/c', twentyMegabytes);

    expect(await store.get('/b')).toBeNull();
    expect(await store.get('/a')).toBe(twentyMegabytes);
    expect(await store.get('/c')).toBe(twentyMegabytes);
  });

  it('skips an entry larger than 50 MB without evicting the others', async () => {
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/small', 'value');
    await store.set('/huge', 'old');
    await store.set('/huge', 'x'.repeat(51 * 1024 * 1024));

    expect(await store.get('/huge')).toBeNull();
    expect(await store.get('/small')).toBe('value');
  });

  it('clears only the entries of its namespace and slot', async () => {
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');
    const astro = createCacheStore('astro');

    await store.set('/a', 1);
    await store.set('/b', 2);
    await astro.set('/a', 3);
    await store.clear();

    expect(await store.get('/a')).toBeNull();
    expect(await store.get('/b')).toBeNull();
    expect(await astro.get('/a')).toBe(3);
  });

  it('shares entries between copies of the module, as Next.js bundles create', async () => {
    const first = (await loadStore()).createCacheStore('nextjs');
    vi.resetModules();
    const second = (await loadStore()).createCacheStore('nextjs');

    await first.set('/en', 'value');
    expect(await second.get('/en')).toBe('value');

    await second.clear();
    expect(await first.get('/en')).toBeNull();
  });

  it('deletes entries', async () => {
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('astro');

    await store.set('/a', 1);
    await store.set('/b', 2);
    await store.delete(['/a']);

    expect(await store.get('/a')).toBeNull();
    expect(await store.get('/b')).toBe(2);
  });

  it('keeps required writes in memory', async () => {
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.setOrThrow('tags/a', 1);

    expect(await store.get('tags/a')).toBe(1);
  });
});

describe('createCacheStore with Redis', () => {
  beforeEach(() => {
    vi.stubEnv('REDIS_URL', 'myredis.redis.azure.net:10000');
    vi.stubEnv('AZURE_CLIENT_ID', 'client-id');
    cluster.connect.mockResolvedValue(cluster);
  });

  it.each([
    ['myredis.redis.azure.net:10001', 'rediss://myredis.redis.azure.net:10001'],
    ['rediss://myredis.redis.azure.net', 'rediss://myredis.redis.azure.net:10000'],
    ['redis://myredis.redis.azure.net:6380', 'rediss://myredis.redis.azure.net:6380'],
  ])('connects to %s over TLS as %s', async (redisUrl, expected) => {
    vi.stubEnv('REDIS_URL', redisUrl);
    const { createCacheStore, createCluster, ManagedIdentityCredential } =
      await loadStore();

    await createCacheStore('nextjs').get('/en');

    expect(createCluster).toHaveBeenCalledWith(
      expect.objectContaining({
        rootNodes: [{ url: expected }],
        defaults: expect.objectContaining({
          socket: expect.objectContaining({ tls: true }),
        }),
      }),
    );
    expect(ManagedIdentityCredential).toHaveBeenCalledWith({ clientId: 'client-id' });
  });

  it('logs the connection', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { createCacheStore } = await loadStore();

    await createCacheStore('nextjs').get('/en');

    expect(info).toHaveBeenCalledWith(
      '[cms-hosting] Connected to Redis at myredis.redis.azure.net:10000',
    );
  });

  it('maps advertised node IPs back to the Redis host', async () => {
    const { createCacheStore, createCluster } = await loadStore();
    await createCacheStore('nextjs').get('/en');

    const { nodeAddressMap } = createCluster.mock.calls[0][0] as {
      nodeAddressMap: (address: string) => { host: string; port: number };
    };

    expect(nodeAddressMap('10.0.0.4:15000')).toEqual({
      host: 'myredis.redis.azure.net',
      port: 15000,
    });
    expect(nodeAddressMap('node1.example.net:15001')).toEqual({
      host: 'node1.example.net',
      port: 15001,
    });
  });

  it('reads and writes namespaced keys with a TTL', async () => {
    cluster.get.mockResolvedValue('{"value":1}');
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/en', { value: 1 }, 60);
    await store.set('/sv', { value: 2 });

    expect(cluster.set).toHaveBeenCalledWith('nextjs:slot1:/en', '{"value":1}', {
      EX: 60,
    });
    expect(cluster.set).toHaveBeenCalledWith(
      'nextjs:slot1:/sv',
      '{"value":2}',
      undefined,
    );
    expect(await store.get('/en')).toEqual({ value: 1 });
    expect(cluster.get).toHaveBeenCalledWith('nextjs:slot1:/en');
  });

  it('keeps Buffers and Maps through Redis', async () => {
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');
    const value = { rscData: Buffer.from('rsc'), segmentData: new Map([['/a', 1]]) };

    await store.set('/en', value);
    cluster.get.mockResolvedValue(cluster.set.mock.calls[0][1]);

    expect(await store.get('/en')).toEqual(value);
  });

  it('deletes each key with its own DEL', async () => {
    const { createCacheStore } = await loadStore();

    await createCacheStore('astro').delete(['/a', '/b']);

    expect(cluster.del).toHaveBeenCalledTimes(2);
    expect(cluster.del).toHaveBeenCalledWith('astro:slot1:/a');
    expect(cluster.del).toHaveBeenCalledWith('astro:slot1:/b');
  });

  it('clears the slot by scanning every master', async () => {
    vi.stubEnv('OPTIMIZELY_DXP_DEPLOYMENT_ID', 'slot[1]');
    const scanned = {
      m1: [['astro:slot[1]:/a', 'astro:slot[1]:/b'], ['astro:slot[1]:/c']],
      m2: [['astro:slot[1]:/d']],
    };
    const scanIterator = vi.fn();
    cluster.nodeClient.mockImplementation(async ({ id }: { id: 'm1' | 'm2' }) => ({
      scanIterator: (options: unknown) => {
        scanIterator(id, options);
        return (async function* () {
          yield* scanned[id];
        })();
      },
    }));
    const { createCacheStore } = await loadStore();

    await createCacheStore('astro').clear();

    expect(scanIterator).toHaveBeenCalledWith('m1', {
      MATCH: 'astro:slot\\[1\\]:*',
      COUNT: 500,
    });
    expect(scanIterator).toHaveBeenCalledWith('m2', {
      MATCH: 'astro:slot\\[1\\]:*',
      COUNT: 500,
    });
    expect(cluster.del.mock.calls.flat().sort()).toEqual([
      'astro:slot[1]:/a',
      'astro:slot[1]:/b',
      'astro:slot[1]:/c',
      'astro:slot[1]:/d',
    ]);
  });

  it('shares one connection between copies of the module', async () => {
    const first = await loadStore();
    await first.createCacheStore('nextjs').get('/en');
    vi.resetModules();
    const second = await loadStore();
    await second.createCacheStore('nextjs').get('/en');

    // Each distinct mock once: vitest may keep the same `redis` mock across resetModules
    const mocks = new Set([first.createCluster, second.createCluster]);
    const connections = [...mocks].reduce((sum, mock) => sum + mock.mock.calls.length, 0);

    expect(connections).toBe(1);
  });

  it('connects once for concurrent requests', async () => {
    const { createCacheStore, createCluster } = await loadStore();
    const store = createCacheStore('nextjs');

    await Promise.all([store.get('/a'), store.get('/b'), store.get('/c')]);

    expect(createCluster).toHaveBeenCalledTimes(1);
  });

  it('uses memory when AZURE_CLIENT_ID is missing', async () => {
    vi.stubEnv('AZURE_CLIENT_ID', undefined);
    const { createCacheStore, createCluster } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/en', 'value');

    expect(await store.get('/en')).toBe('value');
    expect(createCluster).not.toHaveBeenCalled();
  });

  it('uses memory after a failed connection and retries after a minute', async () => {
    vi.useFakeTimers();
    cluster.connect.mockRejectedValueOnce(new Error('refused'));
    const { createCacheStore, createCluster } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/en', 'value');
    expect(await store.get('/en')).toBe('value');
    expect(cluster.destroy).toHaveBeenCalled();
    expect(createCluster).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(61_000);
    await store.get('/en');
    expect(createCluster).toHaveBeenCalledTimes(2);
  });

  it('reconnects in the background, without holding up requests', async () => {
    vi.useFakeTimers();
    cluster.connect
      .mockRejectedValueOnce(new Error('refused'))
      .mockReturnValueOnce(new Promise(() => {}));
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/en', 'value');
    vi.advanceTimersByTime(61_000);

    // The reconnect never finishes here, yet the request is answered from memory
    expect(await store.get('/en')).toBe('value');
  });

  it('gives up on a connection that takes longer than 10 seconds', async () => {
    vi.useFakeTimers();
    cluster.connect.mockReturnValue(new Promise(() => {}));
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    const pending = store.get('/en');
    await vi.advanceTimersByTimeAsync(10_000);

    expect(await pending).toBeNull();
    expect(cluster.destroy).toHaveBeenCalled();
  });

  it('uses memory when a Redis operation fails', async () => {
    cluster.set.mockRejectedValueOnce(new Error('MOVED'));
    cluster.get.mockRejectedValueOnce(new Error('MOVED'));
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/en', 'value');

    expect(await store.get('/en')).toBe('value');
  });

  it('clears memory entries on delete even when Redis is up', async () => {
    cluster.set.mockRejectedValueOnce(new Error('MOVED'));
    cluster.get.mockRejectedValue(new Error('MOVED'));
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/en', 'value');
    await store.delete(['/en']);

    expect(cluster.del).toHaveBeenCalledWith('nextjs:slot1:/en');
    expect(await store.get('/en')).toBeNull();
  });

  it('throws when Redis is up but the delete fails, after clearing memory', async () => {
    cluster.set.mockRejectedValueOnce(new Error('MOVED'));
    cluster.get.mockRejectedValue(new Error('MOVED'));
    cluster.del.mockRejectedValue(new Error('CLUSTERDOWN'));
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    await store.set('/en', 'value');

    await expect(store.delete(['/en'])).rejects.toThrow('CLUSTERDOWN');
    expect(await store.get('/en')).toBeNull();
  });

  it('throws when Redis is up but a required write fails, after writing memory', async () => {
    cluster.set.mockRejectedValue(new Error('CLUSTERDOWN'));
    cluster.get.mockRejectedValue(new Error('MOVED'));
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');

    await expect(store.setOrThrow('tags/a', 1, 60)).rejects.toThrow('CLUSTERDOWN');
    expect(cluster.set).toHaveBeenCalledWith('nextjs:slot1:tags/a', '1', { EX: 60 });
    expect(await store.get('tags/a')).toBe(1);
  });

  it('fails fast while a node is down instead of queueing commands', async () => {
    const { createCacheStore, createCluster } = await loadStore();

    await createCacheStore('nextjs').get('/en');

    expect(createCluster).toHaveBeenCalledWith(
      expect.objectContaining({
        defaults: expect.objectContaining({ disableOfflineQueue: true }),
      }),
    );
  });

  it('uses memory when a Redis operation takes longer than 2 seconds', async () => {
    vi.useFakeTimers();
    cluster.set.mockRejectedValueOnce(new Error('MOVED'));
    cluster.get.mockReturnValue(new Promise(() => {}));
    const { createCacheStore } = await loadStore();
    const store = createCacheStore('nextjs');
    await store.set('/en', 'value');

    const pending = store.get('/en');
    await vi.advanceTimersByTimeAsync(2_000);

    expect(await pending).toBe('value');
  });
});
