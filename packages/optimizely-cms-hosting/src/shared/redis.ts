import { ManagedIdentityCredential } from '@azure/identity';
import {
  DEFAULT_TOKEN_MANAGER_CONFIG,
  EntraIdCredentialsProviderFactory,
  REDIS_SCOPE_DEFAULT,
} from '@redis/entraid';
import { isIP } from 'node:net';
import { createCluster } from 'redis';
import { log, withTimeout } from '../util/general.js';

type Cluster = ReturnType<typeof createAzureCluster>;
type MemoryEntry = { value: string; size: number; expiresAt: number };

/** Cache owner, so Next.js and Astro entries never share a key. */
export type CacheNamespace = 'nextjs' | 'astro';

const DEFAULT_PORT = 10000;
const CONNECT_TIMEOUT_MS = 10_000;
const RETRY_AFTER_MS = 60_000;
const UNAVAILABLE = Symbol('unavailable');
// Next.js's default cacheMaxMemorySize, which apps using this store set to 0
const MEMORY_LIMIT_BYTES = 50 * 1024 * 1024;

const memory = new Map<string, MemoryEntry>();
let memoryBytes = 0;

let cluster: Cluster | null = null;
let connecting: Promise<Cluster | null> | null = null;
let retryAfter = 0;

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
    return client;
  } catch (error) {
    client?.destroy();
    retryAfter = Date.now() + RETRY_AFTER_MS;
    log.warn('Redis unavailable, using the in-memory cache', error);
    return null;
  }
};

const getRedis = async () => {
  if (cluster) return cluster;

  const url = process.env.REDIS_URL;
  if (!url || Date.now() < retryAfter) return null;

  connecting ??= connect(url)
    .then(client => (cluster = client))
    .finally(() => (connecting = null));
  return connecting;
};

const withRedis = async <T>(operation: (redis: Cluster) => Promise<T>) => {
  const redis = await getRedis();
  if (!redis) return UNAVAILABLE;

  try {
    return await operation(redis);
  } catch (error) {
    log.error('Redis operation failed, using the in-memory cache', error);
    return UNAVAILABLE;
  }
};

// MEMORY FALLBACK

const removeMemory = (key: string) => {
  memoryBytes -= memory.get(key)?.size ?? 0;
  memory.delete(key);
};

const readMemory = (key: string) => {
  const entry = memory.get(key);

  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    removeMemory(key);
    return null;
  }

  // Move to the end: eviction in writeMemory removes the Map's first (oldest-inserted) key
  memory.delete(key);
  memory.set(key, entry);
  return entry.value;
};

const writeMemory = (key: string, value: string, ttlSeconds?: number) => {
  const size = Buffer.byteLength(value);

  removeMemory(key);
  if (size > MEMORY_LIMIT_BYTES) return;

  memory.set(key, {
    value,
    size,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity,
  });
  memoryBytes += size;

  while (memoryBytes > MEMORY_LIMIT_BYTES) removeMemory(memory.keys().next().value!);
};

// STORE

/**
 * Creates a JSON cache store on the platform's Redis cluster, with keys
 * namespaced by framework and deployment slot. Falls back to process memory
 * when Redis is not configured or not reachable.
 */
export function createCacheStore(namespace: CacheNamespace) {
  const deploymentId = process.env.OPTIMIZELY_DXP_DEPLOYMENT_ID ?? 'default';
  const toKey = (path: string) => `${namespace}:${deploymentId}:${path}`;

  return {
    async get<T>(path: string): Promise<T | null> {
      const key = toKey(path);
      const stored = await withRedis(redis => redis.get(key));
      const raw = stored === UNAVAILABLE ? readMemory(key) : stored;

      return raw ? (JSON.parse(raw) as T) : null;
    },

    async set(path: string, value: unknown, ttlSeconds?: number) {
      const key = toKey(path);
      const serialized = JSON.stringify(value);
      const written = await withRedis(redis =>
        redis.set(key, serialized, ttlSeconds ? { EX: ttlSeconds } : undefined),
      );

      if (written === UNAVAILABLE) writeMemory(key, serialized, ttlSeconds);
    },

    async delete(paths: string[]) {
      const keys = paths.map(toKey);
      // One DEL per key: a multi-key DEL fails when the keys hash to different cluster slots
      await withRedis(redis => Promise.all(keys.map(key => redis.del(key))));
      // Also when Redis is up, so entries written during an earlier outage cannot resurface
      keys.forEach(removeMemory);
    },
  };
}
