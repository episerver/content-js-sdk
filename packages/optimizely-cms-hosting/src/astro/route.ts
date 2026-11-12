import type { APIRoute } from 'astro';
import { handleGraphWebhook } from '../shared/handleWebhook.js';
import { createCacheStore } from '../shared/redis.js';

const store = createCacheStore('astro');

/**
 * Endpoint for Optimizely Graph webhooks. Re-export it as `POST` from
 * `src/pages/hooks/graph.ts`.
 */
export const POST: APIRoute = ({ request, cache }) =>
  handleGraphWebhook(request, {
    invalidate: path => cache.invalidate({ path }),
    clear: () => store.clear(),
  });
