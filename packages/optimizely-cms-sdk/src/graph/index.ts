import {
  GraphContentResponseError,
  GraphHttpResponseError,
  OptimizelyGraphError,
} from './error.js';
import { logError, logWarning, SemanticAttributes } from '../telemetry/index.js';
import { withRequestSpan } from '../telemetry/spans.js';
import { DEFAULT_GRAPH_URL, DEFAULT_USER_AGENT } from './constants.js';
import { isBrowser } from './environment.js';
import {
  type GraphAuthContext,
  type GraphAuthHeaders,
  type GraphAuthResolver,
  type GraphGetContentOptions,
  type GraphGetItemOptions,
  type GraphGetLinksOptions,
  type GraphOptions,
  type GraphQueryOptions,
  type GraphReference,
  type GraphSlot,
  type PreviewParams,
  type ResolvedFragmentOptions,
  type ResolvedQueryOptions,
  DEFAULT_FRAGMENT_OPTIONS,
  defaultQueryOptions,
  normalizeGraphUrl,
  withDefaults,
} from './options.js';
import * as operations from './operations.js';

// PUBLIC TYPES

export { GraphVariationInput } from './filters.js';
export {
  GraphGetContentOptions,
  GraphGetItemOptions,
  GraphGetLinksOptions,
  GraphOptions,
  GraphQueryOptions,
  GraphReference,
  GraphSlot,
  PreviewParams,
} from './options.js';
export type {
  DamMode,
  GraphAuthContext,
  GraphAuthHeaders,
  GraphAuthResolver,
  GraphFragmentOptions,
} from './options.js';

// AUTHENTICATION

/** The auth headers for one request, empty when the single key is used. */
async function resolveAuthHeaders(
  auth: GraphAuthResolver | undefined,
  previewToken: string | undefined,
  request: GraphAuthContext,
): Promise<GraphAuthHeaders> {
  // A preview token is itself a credential, so it replaces the resolver.
  if (previewToken || !auth) return {};

  if (isBrowser())
    throw new OptimizelyGraphError(
      'The `auth` resolver ran in a browser. Graph credentials other than the single key must never reach client code. ' +
        'Fetch from a server component, route handler or API route instead.',
    );

  // `Promise.resolve().then` so a resolver that throws synchronously is caught too.
  const headers = await Promise.resolve()
    .then(() => auth(request))
    .catch(err => {
      const optiErr = new OptimizelyGraphError('The `auth` resolver threw.');
      optiErr.cause = err;
      throw optiErr;
    });

  if (!headers || typeof headers !== 'object' || Array.isArray(headers))
    throw new OptimizelyGraphError(
      'The `auth` resolver must return an object mapping header names to string values.',
    );

  return headers;
}

// GRAPH CLIENT

export class GraphClient {
  apiKey: string;
  graphUrl: string;
  userAgent: string;

  /** Supplies the auth headers per request. Unset means the single key is used. */
  readonly auth?: GraphAuthResolver;

  /**
   * Every setting the query builders read that comes from configuration,
   * assembled once so a call site cannot forget one.
   */
  readonly fragmentDefaults: ResolvedFragmentOptions;

  /** The resolved `query` group: what every request uses unless it overrides it. */
  readonly queryDefaults: ResolvedQueryOptions;

  // The key is required, other options have defaults or can be set globally
  constructor(apiKey: string, options: Omit<GraphOptions, 'apiKey'> = {}) {
    this.apiKey = apiKey;
    this.graphUrl = normalizeGraphUrl(options.graphUrl || DEFAULT_GRAPH_URL);
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.auth = options.auth;

    this.fragmentDefaults = withDefaults(DEFAULT_FRAGMENT_OPTIONS, options.fragment);
    this.queryDefaults = withDefaults(defaultQueryOptions(options.auth), options.query);
  }

  // TRANSPORT

  /** Perform a GraphQL query with variables */
  async request(
    query: string,
    variables: any,
    previewToken?: string,
    cache: boolean = true,
    slot?: GraphSlot,
    stored: boolean = false,
  ): Promise<any> {
    return withRequestSpan(
      this.graphUrl,
      this.userAgent,
      cache,
      slot || 'Current',
      !!previewToken,
      previewToken ? 'preview'
      : this.auth ? 'custom'
      : 'single',
      async span => {
        const url = new URL(this.graphUrl);

        // Append cache parameter to control caching behavior
        url.searchParams.append('cache', cache.toString());

        if (stored) {
          url.searchParams.append('stored', 'true');
        }

        // Serialized up front rather than inline in `fetch`: an HMAC signature
        // covers a hash of the body, so the resolver has to see the same bytes.
        const body = JSON.stringify({ query, variables });

        const authHeaders = await resolveAuthHeaders(this.auth, previewToken, {
          url: url.toString(),
          method: 'POST',
          body,
        });

        // Order is the precedence: a resolver overrides the single key, a preview
        // token overrides both.
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent,
          Authorization: `epi-single ${this.apiKey}`,
          ...authHeaders,
          ...(previewToken ? { Authorization: `Bearer ${previewToken}` } : {}),
        };

        if (stored) {
          headers['cg-stored-query'] = 'template';
        }

        if (slot === 'New') {
          headers['cg-query-new'] = 'true';
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body,
        }).catch(err => {
          if (err instanceof TypeError) {
            const optiErr = new OptimizelyGraphError(
              'Error when calling `fetch`. Ensure the Graph URL is correct or try again later.',
            );
            optiErr.cause = err;
            // Exception is automatically recorded by createSpan wrapper
            throw optiErr;
          }
          throw err;
        });

        // Record HTTP status code
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, response.status);

        if (!response.ok) {
          const text = await response.text().catch(err => {
            logError('Error reading response text', err as Error, {
              [SemanticAttributes.HTTP_STATUS_CODE]: response.status,
            });
            return response.statusText;
          });

          let json;
          try {
            json = JSON.parse(text);
          } catch (err) {
            // When the response is not JSON
            throw new GraphHttpResponseError(text, {
              status: response.status,
              request: { query, variables },
            });
          }

          if (json.errors) {
            throw new GraphContentResponseError(json.errors, {
              status: response.status,
              request: { query, variables },
            });
          } else {
            throw new GraphHttpResponseError(response.statusText, {
              status: response.status,
              request: { query, variables },
            });
          }
        }

        const json = (await response.json()) as any;

        // Graph reports authentication and permission failures as a 200 carrying an
        // `errors` array, so returning `json.data` regardless reads as "content not found".
        if (json.errors?.length) {
          if (!json.data)
            throw new GraphContentResponseError(json.errors, {
              status: response.status,
              request: { query, variables },
            });

          // Partial data is still usable, so this stays a warning rather than a throw.
          logWarning('Graph returned errors alongside partial data', {
            [SemanticAttributes.HTTP_STATUS_CODE]: response.status,
            'graph.errors': json.errors
              .map((error: { message: string }) => error.message)
              .join('; '),
          });
        }

        return json.data;
      },
    );
  }

  // CONTENT FETCHING

  /**
   * Fetches content from the CMS based on the provided path or options.
   *
   * If a string is provided, it is treated as a content path. If an object is provided,
   * it may include both a path and a variation to filter the content.
   *
   * @param path - A string representing the content path
   * @param options - Options to include or exclude variations
   *
   * @param contentType - A string representing the content type. If omitted, the method
   *   will try to get the content type name from the CMS.
   *
   * @returns An array of all items matching the path and options. Returns an empty array if no content is found.
   */
  async getContentByPath<T = any>(path: string, options?: GraphGetContentOptions) {
    return operations.getContentByPath<T>(this, path, options);
  }

  async getPreviewContent(params: PreviewParams, options?: GraphQueryOptions) {
    return operations.getPreviewContent(this, params, options);
  }

  /**
   * Unified content fetching method using GraphReference.
   * Fetches content by key with optional locale and version parameters.
   *
   * Supports both object and string formats:
   * - Object: `{ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en', version: '123' }`
   * - String: `graph://source/type/key?loc=en&ver=123`
   *
   * **Priority rules:**
   * - If `version` is specified, it takes priority (ignores locale-based filtering)
   * - If only `locale` is specified, fetches latest published version in that locale
   * - If neither specified, fetches latest published version
   *
   * **Note:** This method always returns published content. To fetch draft content,
   * use `getPreviewContent()` with a preview token instead.
   * @param reference - GraphReference object or string in graph:// format
   * @param previewToken - Optional preview token for preview mode
   * @returns The requested content item, or null if not found
   *
   * @example
   * ```typescript
   * // Fetch latest published content by key
   * const content = await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e' });
   *
   * // Fetch latest published content in specific locale
   * const content = await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' });
   *
   * // Fetch specific version (version has priority over locale)
   * const content = await client.getContent({
   *   key: '880777d5a2824399b07e93e3ca70668e',
   *   version: '123',
   *   locale: 'en' // This will be ignored when version is specified
   * });
   *
   * // Using string format
   * const content = await client.getContent('graph://cms/Page/880777d5a2824399b07e93e3ca70668e?loc=en&ver=123');
   *
   * // With preview token
   * const content = await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e', version: '123' }, { previewToken: 'token' });
   * ```
   */
  async getContent(reference: string | GraphReference, options?: GraphGetItemOptions) {
    return operations.getContent(this, reference, options);
  }

  // NAVIGATION

  /**
   * Given the path or reference of a page, return its "path" (i.e. a list of ancestor pages).
   *
   * Supports both URL path (string) and GraphReference formats:
   * - String: URL path like `/blog/post-1`
   * - GraphReference: Object like `{ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' }`
   * - String format: `graph://cms/Page/880777d5a2824399b07e93e3ca70668e?loc=en`
   *
   * @param input - URL path string or GraphReference object/string
   * @param options - Optional host and locales filters
   * @returns A list with the metadata information of all ancestors sorted from top-most to current
   *
   * @example
   * ```typescript
   * // Using path
   * const path = await client.getPath('/blog/post-1');
   *
   * // Using GraphReference
   * const path = await client.getPath({ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' });
   *
   * // Using string format
   * const path = await client.getPath('graph://Page/880777d5a2824399b07e93e3ca70668e?loc=en');
   * ```
   */
  async getPath(reference: string | GraphReference, options?: GraphGetLinksOptions) {
    return operations.getPath(this, reference, options);
  }

  /**
   * Given the path or reference of a page, get its "items" (i.e. the children pages)
   *
   * Supports both URL path (string) and GraphReference formats:
   * - String: URL path like `/blog`
   * - GraphReference: Object like `{ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' }`
   * - String format: `graph://Page/880777d5a2824399b07e93e3ca70668e?loc=en`
   *
   * @param input - URL path string or GraphReference object/string
   * @param options - Optional host and locales filters
   * @returns A list with the metadata information of all child/descendant pages
   *
   * @example
   * ```typescript
   * // Using path
   * const items = await client.getItems('/blog');
   *
   * // Using GraphReference
   * const items = await client.getItems({ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' });
   *
   * // Using string format
   * const items = await client.getItems('graph://Page/880777d5a2824399b07e93e3ca70668e?loc=en');
   * ```
   */
  async getItems(reference: string | GraphReference, options?: GraphGetLinksOptions) {
    return operations.getItems(this, reference, options);
  }
}

// GLOBAL CONFIGURATION

// Global configuration for client factory
let globalGraphConfig: GraphOptions | null = null;

/**
 * Sets the global graph configuration to be used by getClient()
 * @internal This is called automatically when config is called
 */
function setGraphConfig(config: GraphOptions | undefined) {
  if (config) {
    globalGraphConfig = config;
  }
}

/**
 * Gets the global graph configuration
 * @internal
 */
export function getGraphConfig(): GraphOptions | null {
  return globalGraphConfig;
}

/**
 * Configure the Optimizely Graph client with your settings.
 *
 * Call this function once at the start of your application.
 * After configuration, you can use getClient() anywhere in your app.
 *
 * @param config - The graph configuration object with your API key and optional settings
 *
 * @example
 * ```tsx
 * // In your root layout or app entry point
 * import { config } from '@optimizely/cms-sdk';
 *
 * config({
 *   apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
 *   graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY, // optional
 *   fragment: { richTextFormat: 'json' }, // optional
 *   query: { cache: true, host: 'example.com' }, // optional
 * });
 *
 * export default function RootLayout({ children }) {
 *   return <html><body>{children}</body></html>;
 * }
 * ```
 */
export function config(options: GraphOptions) {
  if (
    !options.apiKey ||
    typeof options.apiKey !== 'string' ||
    options.apiKey.trim().length === 0
  ) {
    throw new OptimizelyGraphError(
      'Invalid Optimizely Graph API key: key must be a non-empty string. ' +
        'Check that your environment variable is set correctly (e.g., process.env.OPTIMIZELY_GRAPH_SINGLE_KEY).',
    );
  }
  setGraphConfig(options);
}

const mergeGraphOptions = (
  base: GraphOptions,
  override: Partial<GraphOptions> = {},
): GraphOptions => ({
  ...base,
  ...override,
  fragment: { ...base.fragment, ...override.fragment },
  query: { ...base.query, ...override.query },
});

/**
 * Creates and returns a GraphClient instance using the global configuration.
 *
 * The graph configuration must be set first using config().
 *
 * @param overrideOptions - Optional GraphOptions to override the global configuration
 * @returns A configured GraphClient instance
 * @throws Error if graph configuration is not set
 *
 * @example
 * ```ts
 * // In your root layout (e.g., layout.tsx)
 * import { config } from '@optimizely/cms-sdk';
 *
 * config({
 *   apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
 *   graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY, // optional
 *   query: { host: 'example.com' }, // optional
 * });
 *
 * // In your components
 * import { getClient } from '@optimizely/cms-sdk';
 *
 * const client = getClient();
 * const content = await client.getContentByPath('/my-page/');
 *
 * // Or override config for specific use cases
 * const customClient = getClient({ query: { host: 'custom.example.com' } });
 * const jsonOnly = getClient({ fragment: { richTextFormat: 'json' } });
 * ```
 */
export function getClient(overrideOptions?: Partial<GraphOptions>): GraphClient {
  if (!globalGraphConfig) {
    throw new OptimizelyGraphError(
      'The Graph client is not configured. Call config() in the application entry point.',
    );
  }

  const options = mergeGraphOptions(globalGraphConfig, overrideOptions);

  return new GraphClient(options.apiKey, options);
}
