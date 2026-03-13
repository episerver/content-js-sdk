/**
 * FX-specific configuration
 * Extends base SDK config with Feature Experimentation settings
 */

import { getRequiredEnv, getOptionalEnv } from '@optimizely/cms-sdk/config';

/**
 * Get Optimizely Feature Experimentation SDK Key
 * Required for FX integration
 * @throws Error if OPTIMIZELY_FX_SDK_KEY is not set
 */
export function getFxSdkKey(): string {
  return getRequiredEnv('OPTIMIZELY_FX_SDK_KEY');
}

/**
 * Get Optimizely Feature Experimentation Access Token
 * Optional - used for authenticated datafile access
 * @returns Access token or undefined
 */
export function getFxAccessToken(): string | undefined {
  return getOptionalEnv('OPTIMIZELY_FX_ACCESS_TOKEN');
}
