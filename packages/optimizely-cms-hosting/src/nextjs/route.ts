import { revalidatePath } from 'next/cache.js';
import { handleGraphWebhook } from '../shared/handleWebhook.js';
import { createCacheStore } from '../shared/redis.js';
import CacheHandler from './cacheHandler.js';

const cacheHandler = new CacheHandler();
const store = createCacheStore('nextjs');

/**
 * Route handler for Optimizely Graph webhooks. Re-export it as `POST` from
 * `src/app/hooks/graph/route.ts`.
 */
export const POST = (request: Request) =>
  handleGraphWebhook(request, {
    async invalidate(path) {
      revalidatePath(path);
      // revalidatePath applies after the response, too late for the CDN purge that follows
      await cacheHandler.revalidateTag(`_N_T_${path}`);
    },
    clear: () => store.clear(),
  });
