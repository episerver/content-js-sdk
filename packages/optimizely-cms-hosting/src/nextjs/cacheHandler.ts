import type {
  CacheHandlerValue,
  CacheHandler as NextCacheHandler,
} from 'next/dist/server/lib/incremental-cache/index.js';
import { createCacheStore } from '../shared/redis.js';
import { log } from '../util/general.js';

type SetContext = Parameters<NextCacheHandler['set']>[2];

const PATH_TAG_PREFIX = '_N_T_';
// Next.js sends this with every revalidatePath call as a side effect
const LAYOUT_TAG = `${PATH_TAG_PREFIX}/layout`;
const BUILD_FETCH_TTL_SECONDS = 60 * 60;

const store = createCacheStore('nextjs');

// Next.js stores the root page under '/index'
const toPageKey = (pathTag: string) => {
  const path = pathTag.slice(PATH_TAG_PREFIX.length);
  return path === '/' ? '/index' : path;
};

const ttlFor = (ctx: SetContext) => {
  // `expire` rather than `revalidate`, so stale pages stay available for stale-while-revalidate
  if (!ctx.fetchCache) return ctx.cacheControl?.expire;
  // Shared between workers during `next build` but never read at runtime
  if (ctx.isImplicitBuildTimeCache) return BUILD_FETCH_TTL_SECONDS;
  return undefined;
};

/**
 * Next.js `cacheHandler` that keeps ISR pages in the platform's Redis, so every
 * instance serves and revalidates the same entries. Invalidates by path only.
 */
export default class CacheHandler implements NextCacheHandler {
  async get(key: string) {
    return store.get<CacheHandlerValue>(key);
  }

  async set(key: string, value: CacheHandlerValue['value'], ctx: SetContext) {
    await store.set(key, { value, lastModified: Date.now() }, ttlFor(ctx));
  }

  async revalidateTag(tags: string | string[]) {
    const tagList = [tags].flat();
    const pathTags = tagList.filter(
      tag => tag.startsWith(PATH_TAG_PREFIX) && tag !== LAYOUT_TAG,
    );
    const customTags = tagList.filter(tag => !tag.startsWith(PATH_TAG_PREFIX));

    if (customTags.length)
      log.warn(`Ignoring unsupported tags: ${customTags.join(', ')}`);
    await store.delete(pathTags.map(toPageKey));
  }

  resetRequestCache() {}
}
