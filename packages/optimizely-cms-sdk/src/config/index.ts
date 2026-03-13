/**
 * Configuration helpers for Optimizely CMS SDK
 * Provides utilities for accessing environment variables with validation
 */

/**
 * Get a required environment variable
 * @param key - Environment variable name
 * @returns Environment variable value
 * @throws Error if the environment variable is not set
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `${key} environment variable is required but not set. Please add it to your .env file.`
    );
  }
  return value;
}

/**
 * Get an optional environment variable
 * @param key - Environment variable name
 * @returns Environment variable value or undefined
 */
export function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Get Optimizely Graph Single Key from environment
 * @throws Error if OPTIMIZELY_GRAPH_SINGLE_KEY is not set
 */
export function getGraphSingleKey(): string {
  return getRequiredEnv('OPTIMIZELY_GRAPH_SINGLE_KEY');
}

/**
 * Get Optimizely Graph Gateway URL from environment
 * @returns Graph gateway URL or undefined (SDK will use default)
 */
export function getGraphGatewayUrl(): string | undefined {
  return getOptionalEnv('OPTIMIZELY_GRAPH_GATEWAY');
}

/**
 * Get Optimizely CMS URL from environment
 * Used for preview mode communication scripts
 * @returns CMS URL or undefined
 */
export function getCmsUrl(): string | undefined {
  return getOptionalEnv('OPTIMIZELY_CMS_URL');
}

/**
 * Get application host URL from environment
 * Used for filtering content in multi-site scenarios
 * @returns Application host URL or undefined
 */
export function getApplicationHost(): string | undefined {
  return getOptionalEnv('APPLICATION_HOST');
}

/**
 * Get complete Graph client configuration from environment variables
 * Convenience method for creating GraphClient instances
 *
 * @example
 * ```typescript
 * import { GraphClient } from '@optimizely/cms-sdk';
 * import { getGraphConfig } from '@optimizely/cms-sdk/config';
 *
 * const client = new GraphClient(getGraphConfig());
 * ```
 */
export function getGraphConfig() {
  return {
    singleKey: getGraphSingleKey(),
    graphUrl: getGraphGatewayUrl(),
  };
}
