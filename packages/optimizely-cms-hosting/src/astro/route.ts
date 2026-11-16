import type { APIRoute } from 'astro';
import { handleGraphWebhook, type WebhookOptions } from '../shared/handleWebhook.js';
import { createCacheStore } from '../shared/redis.js';

export {
  homePagePaths,
  type ContentChange,
  type WebhookOptions,
} from '../shared/handleWebhook.js';

const store = createCacheStore('astro');

/**
 * Creates the endpoint for Optimizely Graph webhooks, for example to refresh
 * more pages on each publish. Export it as `POST`.
 */
export const createWebhookRoute =
  (options: WebhookOptions = {}): APIRoute =>
  ({ request, cache }) =>
    handleGraphWebhook(
      request,
      { invalidate: path => cache.invalidate({ path }), clear: () => store.clear() },
      options,
    );

/**
 * Endpoint for Optimizely Graph webhooks. Re-export it as `POST` from
 * `src/pages/hooks/graph.ts`.
 */
export const POST = createWebhookRoute();
