import { SDK_VERSION } from '../generated/version.js';

/**
 * Default Optimizely Graph API URL for production environment.
 */
export const DEFAULT_GRAPH_URL = 'https://cg.optimizely.com/content/v2';

/**
 * Default User-Agent string for HTTP requests to Graph API.
 */
export const DEFAULT_USER_AGENT = `OptimizelySDK/${SDK_VERSION} (JS)`;

/**
 * Default maximum number of fragments allowed before logging performance warnings.
 * Helps prevent excessive GraphQL query complexity from unrestricted content types.
 */
export const DEFAULT_MAX_FRAGMENT_THRESHOLD = 100;

/**
 * Default setting for contract expansion.
 * When true, contracts are expanded to include all implementing types.
 * When false, only the contract itself is included without expansion.
 */
export const DEFAULT_EXPAND_CONTRACTS = false;
