/**
 * Webhook-specific configuration
 * Extends base SDK config with webhook security settings
 */

import { getRequiredEnv } from '@optimizely/cms-sdk/config';

/**
 * Get Webhook ID
 * Used for validating incoming webhook requests
 * @throws Error if WEBHOOK_ID is not set
 */
export function getWebhookId(): string {
  return getRequiredEnv('WEBHOOK_ID');
}
