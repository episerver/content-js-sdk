import { ManagedIdentityCredential } from '@azure/identity';
import {
  DEFAULT_TOKEN_MANAGER_CONFIG,
  EntraIdCredentialsProviderFactory,
  REDIS_SCOPE_DEFAULT,
} from '@redis/entraid';
import { isIP } from 'node:net';
import { createCluster } from 'redis';
import { deserialize, log, serialize, withTimeout } from '../util/general.js';

type Cluster = ReturnType<typeof createAzureCluster>;
type MemoryEntry = { value: string; size: number; expiresAt: number };
type StoreState = {
  cluster: Cluster | null;
  connecting: Promise<Cluster | null> | null;
  retryAfter: number;
  reportedMissingUrl: boolean;
  memory: Map<string, MemoryEntry>;
  memoryBytes: number;
};

/** Cache owner, so Next.js pages, Astro pages and webhook data never share a key. */
export type CacheNamespace = 'nextjs' | 'astro' | 'webhook';

const DEFAULT_PORT = 10000;
const CONNECT_TIMEOUT_MS = 10_000;
const OPERATION_TIMEOUT_MS = 2_000;
const CLEAR_TIMEOUT_MS = 60_000;
const RETRY_AFTER_MS = 60_000;
const UNAVAILABLE = Symbol('unavailable');
// Next.js's default cacheMaxMemorySize, which apps using this store set to 0
const MEMORY_LIMIT_BYTES = 50 * 1024 * 1024;

const STATE_KEY = Symbol.for('@optimizely/cms-hosting/redis');

// Next.js loads the cache handler and bundles the webhook route separately, each with its own
// copy of this module; one state per process keeps them on the same connection and memory
const state: StoreState = ((globalThis as Record<symbol, StoreState>)[STATE_KEY] ??= {
  cluster: null,
  connecting: null,
  retryAfter: 0,
  reportedMissingUrl: false,
  memory: new Map(),
  memoryBytes: 0,
});
const { memory } = state;

// CONNECTION

const parseRedisUrl = (url: string) => {
  const [host, port] = url.replace(/^rediss?:\/\//, '').split(':');
  return { host, port: port ? Number(port) : DEFAULT_PORT };
};

const createAzureCluster = (host: string, port: number, clientId: string) =>
  createCluster({
    rootNodes: [{ url: `rediss://${host}:${port}` }],
    defaults: {
      credentialsProvider:
        EntraIdCredentialsProviderFactory.createForDefaultAzureCredential({
          credential: new ManagedIdentityCredential({ clientId }),
          scopes: REDIS_SCOPE_DEFAULT,
          tokenManagerConfig: DEFAULT_TOKEN_MANAGER_CONFIG,
        }),
      socket: { tls: true, connectTimeout: 5000 },
      // Fail at once while a node is down, so requests fall back to memory instead of queueing
      disableOfflineQueue: true,
    },
    // Azure advertises cluster nodes by internal IP, which the container cannot reach
    nodeAddressMap: (address: string) => {
      const [hostOrIp, nodePort] = address.split(':');
      return { host: isIP(hostOrIp) ? host : hostOrIp, port: Number(nodePort) };
    },
  });

const connect = async (url: string): Promise<Cluster | null> => {
  const { host, port } = parseRedisUrl(url);
  const clientId = process.env.AZURE_CLIENT_ID;
  let client: Cluster | undefined;

  try {
    if (!clientId) throw new Error('AZURE_CLIENT_ID is not set');

    client = createAzureCluster(host, port, clientId);
    client.on('error', (error: Error) => log.error('Redis error', error));
    client.on('node-error', (error: Error, node: { host: string; port: number }) =>
      log.error(`Redis node ${node.host}:${node.port} error`, error),
    );

    await withTimeout(client.connect(), CONNECT_TIMEOUT_MS, 'Redis connection');
    log.info(`Connected to Redis at ${host}:${port}`);
    return client;
  } catch (error) {
    client?.destroy();
    state.retryAfter = Date.now() + RETRY_AFTER_MS;
    log.warn('Redis unavailable, using the in-memory cache', error);
    return null;
  }
};

const getRedis = async () => {
  if (state.cluster) return state.cluster;

  const url = process.env.REDIS_URL;

  if (!url && !state.reportedMissingUrl) {
    state.reportedMissingUrl = true;
    log.warn('REDIS_URL is not set, using the in-memory cache');
  }
  if (!url || Date.now() < state.retryAfter) return null;

  state.connecting ??= connect(url)
    .then(client => (state.cluster = client))
    .finally(() => (state.connecting = null));
  // Only the first attempt is awaited; after a failure, requests use memory while it reconnects
  return state.retryAfter ? null : state.connecting;
};

const withRedis = async <T>(
  operation: (redis: Cluster) => Promise<T>,
  timeoutMs = OPERATION_TIMEOUT_MS,
) => {
  const redis = await getRedis();
  if (!redis) return UNAVAILABLE;

  try {
    return await withTimeout(operation(redis), timeoutMs, 'Redis operation');
  } catch (error) {
    log.error('Redis operation failed, using the in-memory cache', error);
    return UNAVAILABLE;
  }
};

// MEMORY FALLBACK

const removeMemory = (key: string) => {
  state.memoryBytes -= memory.get(key)?.size ?? 0;
  memory.delete(key);
};

const readMemory = (key: string) => {
  const entry = memory.get(key);

  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    removeMemory(key);
    return null;
  }

  // Move to the end: eviction in writeMemory removes the oldest-inserted key first
  memory.delete(key);
  memory.set(key, entry);
  return entry.value;
};

const oldestKey = () => memory.keys().next().value!;

const writeMemory = (key: string, value: string, ttlSeconds?: number) => {
  const size = Buffer.byteLength(value);

  removeMemory(key);
  if (size > MEMORY_LIMIT_BYTES) return;

  memory.set(key, {
    value,
    size,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity,
  });
  state.memoryBytes += size;

  while (state.memoryBytes > MEMORY_LIMIT_BYTES) removeMemory(oldestKey());
};

// STORE

const escapeGlob = (text: string) => text.replace(/[*?[\]\\]/g, '\\$&');

/**
 * Creates a JSON cache store on the platform's Redis cluster, with keys
 * namespaced by owner and, unless `sharedAcrossDeployments`, by deployment slot.
 * Falls back to process memory when Redis is not configured or not reachable.
 */
export function createCacheStore(
  namespace: CacheNamespace,
  { sharedAcrossDeployments = false } = {},
) {
  const deploymentId = process.env.OPTIMIZELY_DXP_DEPLOYMENT_ID ?? 'default';
  const prefix = `${namespace}:${sharedAcrossDeployments ? 'shared' : deploymentId}:`;
  const toKey = (path: string) => `${prefix}${path}`;

  return {
    async get<T>(path: string): Promise<T | null> {
      const key = toKey(path);
      const stored = await withRedis(redis => redis.get(key));
      const raw = stored === UNAVAILABLE ? readMemory(key) : stored;

      return raw ? deserialize<T>(raw) : null;
    },

    async set(path: string, value: unknown, ttlSeconds?: number) {
      const key = toKey(path);
      const serialized = serialize(value);
      const written = await withRedis(redis =>
        redis.set(key, serialized, ttlSeconds ? { EX: ttlSeconds } : undefined),
      );

      if (written === UNAVAILABLE) writeMemory(key, serialized, ttlSeconds);
    },

    /** Like `set`, but throws when Redis is up and the write fails, as other instances would miss it. */
    async setOrThrow(path: string, value: unknown, ttlSeconds?: number) {
      const key = toKey(path);
      const serialized = serialize(value);
      const redis = await getRedis();

      // Also when Redis is up, so the value still applies during a later outage
      writeMemory(key, serialized, ttlSeconds);
      if (!redis) return;

      const write = redis.set(
        key,
        serialized,
        ttlSeconds ? { EX: ttlSeconds } : undefined,
      );
      await withTimeout(write, OPERATION_TIMEOUT_MS, 'Redis write');
    },

    /** Throws when Redis is up but the delete fails, since Redis would still serve the entries. */
    async delete(paths: string[]) {
      const keys = paths.map(toKey);
      const redis = await getRedis();

      // Also when Redis is up, so entries written during an earlier outage cannot resurface
      keys.forEach(removeMemory);
      if (!redis) return;

      // One DEL per key: a multi-key DEL fails when the keys hash to different cluster slots
      const deletes = Promise.all(keys.map(key => redis.del(key)));
      await withTimeout(deletes, OPERATION_TIMEOUT_MS, 'Redis delete');
    },

    /** Deletes every entry of this namespace and deployment slot. */
    async clear() {
      const scanOptions = { MATCH: `${escapeGlob(prefix)}*`, COUNT: 500 };

      // SCAN only sees the keys of the node it runs on, so it runs on every master
      await withRedis(
        redis =>
          Promise.all(
            redis.masters.map(async master => {
              const client = await redis.nodeClient(master);

              for await (const keys of client.scanIterator(scanOptions))
                await Promise.all(keys.map(key => redis.del(key)));
            }),
          ),
        CLEAR_TIMEOUT_MS,
      );
      [...memory.keys()].filter(key => key.startsWith(prefix)).forEach(removeMemory);
    },
  };
}
