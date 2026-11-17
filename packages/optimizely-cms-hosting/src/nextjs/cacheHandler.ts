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
// Next.js's default expireTime; without a TTL, earlier deployments' keys would never expire
const DEFAULT_TTL_SECONDS = 365 * 24 * 60 * 60;

const store = createCacheStore('nextjs');

// Next.js stores the root page under '/index'
const toPageKey = (path: string) => (path === '/' ? '/index' : path);

// revalidatePath(path, type) appends the type, but a page can also be called "page" or "layout"
const toPagePaths = (pathTag: string) => {
  const path = pathTag.slice(PATH_TAG_PREFIX.length);
  const typed = path.match(/^(.*)\/(page|layout)$/);

  return typed ? [path, typed[1] || '/'] : [path];
};

/** Deletes the cached page of a path. */
export const invalidatePage = (path: string) => store.delete([toPageKey(path)]);

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
    const layoutTags = pathTags.filter(tag => tag.endsWith('/layout'));

    if (customTags.length)
      log.warn(`Ignoring unsupported tags: ${customTags.join(', ')}`);
    if (layoutTags.length)
      log.warn(`Refreshing only the page itself for ${layoutTags.join(', ')}`);
    await store.delete(pathTags.flatMap(toPagePaths).map(toPageKey));
  }

  resetRequestCache() {}
}
