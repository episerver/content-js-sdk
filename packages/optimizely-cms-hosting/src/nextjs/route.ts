import { revalidatePath } from 'next/cache.js';
import {
  handleGraphWebhook,
  type OriginCache,
  type WebhookOptions,
} from '../shared/handleWebhook.js';
import { createCacheStore } from '../shared/redis.js';
import CacheHandler from './cacheHandler.js';

export {
  homePagePaths,
  type ContentChange,
  type WebhookOptions,
} from '../shared/handleWebhook.js';

const cacheHandler = new CacheHandler();
const store = createCacheStore('nextjs');

const originCache: OriginCache = {
  async invalidate(path) {
    revalidatePath(path);
    // revalidatePath applies after the response, too late for the CDN purge that follows
    await cacheHandler.revalidateTag(`_N_T_${path}`);
  },
  clear: () => store.clear(),
};

/**
 * Creates the route handler for Optimizely Graph webhooks, for example to
 * refresh more pages on each publish. Export it as `POST`.
 */
export const createWebhookRoute =
  (options: WebhookOptions = {}) =>
  (request: Request) =>
    handleGraphWebhook(request, originCache, options);

/**
 * Route handler for Optimizely Graph webhooks. Re-export it as `POST` from
 * `src/app/hooks/graph/route.ts`.
 */
export const POST = createWebhookRoute();
