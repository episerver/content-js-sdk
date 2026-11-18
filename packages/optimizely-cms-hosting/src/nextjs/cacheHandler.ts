import type {
  CacheHandlerValue,
  CacheHandler as NextCacheHandler,
} from 'next/dist/server/lib/incremental-cache/index.js';
import { createCacheStore } from '../shared/redis.js';
import { unique } from '../util/general.js';

type GetContext = Parameters<NextCacheHandler['get']>[1];
type SetContext = Parameters<NextCacheHandler['set']>[2];

// Pages and route handlers list their tags, including the implicit `_N_T_` path tags, in this header
const TAGS_HEADER = 'x-next-cache-tags';
const BUILD_FETCH_TTL_SECONDS = 60 * 60;
// Next.js's default expireTime; without a TTL, earlier deployments' keys would never expire
const DEFAULT_TTL_SECONDS = 365 * 24 * 60 * 60;

const store = createCacheStore('nextjs');

const tagKey = (tag: string) => `tags/${tag}`;

const headerTags = (value: CacheHandlerValue['value']) => {
  const header = value && 'headers' in value ? value.headers?.[TAGS_HEADER] : undefined;
  return typeof header === 'string' ? header.split(',') : [];
};

const contextTags = (ctx: GetContext) =>
  'tags' in ctx ? [...(ctx.tags ?? []), ...(ctx.softTags ?? [])] : [];

// Entry keys can change between Next.js versions, so invalidation stamps tags instead of deleting keys
const markRevalidated = (tags: string[]) => {
  const now = Date.now();
  return Promise.all(
    unique(tags).map(tag => store.setOrThrow(tagKey(tag), now, DEFAULT_TTL_SECONDS)),
  );
};

const lastRevalidated = async (tags: string[]) => {
  const stamps = await Promise.all(
    unique(tags).map(tag => store.get<number>(tagKey(tag))),
  );
  return Math.max(0, ...stamps.map(it => it ?? 0));
};

/** Marks the cached page of a path as out of date, on every instance. */
export const invalidatePage = (path: string) => markRevalidated([`_N_T_${path}`]);

/** Deletes every cached page of this deployment. */
export const clearPages = () => store.clear();

const ttlFor = (ctx: SetContext) => {
  // `expire` rather than `revalidate`, so stale pages stay available for stale-while-revalidate
  if (!ctx.fetchCache) return ctx.cacheControl?.expire ?? DEFAULT_TTL_SECONDS;
  // Shared between workers during `next build` but never read at runtime
  if (ctx.isImplicitBuildTimeCache) return BUILD_FETCH_TTL_SECONDS;
  return DEFAULT_TTL_SECONDS;
};

/**
 * Next.js `cacheHandler` that keeps ISR pages in the platform's Redis, so every
 * instance serves and revalidates the same entries.
 */
export default class CacheHandler implements NextCacheHandler {
  async get(key: string, ctx: GetContext) {
    const entry = await store.get<CacheHandlerValue>(key);
    if (!entry) return null;

    const tags = [...headerTags(entry.value), ...contextTags(ctx)];
    return (await lastRevalidated(tags)) > entry.lastModified ? null : entry;
  }

  async set(key: string, value: CacheHandlerValue['value'], ctx: SetContext) {
    await store.set(key, { value, lastModified: Date.now() }, ttlFor(ctx));
  }

  // Expires at once, also for revalidateTag(tag, profile), where Next.js would serve stale first
  async revalidateTag(tags: string | string[]) {
    await markRevalidated([tags].flat());
  }

  resetRequestCache() {}
}
