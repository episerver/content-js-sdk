import { registerWebhook } from '../shared/webhooks.js';

/**
 * Next.js instrumentation hook that registers the Graph webhook. Re-export it
 * from `src/instrumentation.ts`. Does not delay server startup.
 */
export function register() {
  // Next.js also runs instrumentation for the Edge runtime, which does not need the webhook
  if (process.env.NEXT_RUNTIME === 'nodejs') void registerWebhook();
}
