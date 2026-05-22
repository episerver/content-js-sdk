/**
 * Semantic attributes for OpenTelemetry instrumentation.
 *
 * This module defines attribute keys following OpenTelemetry semantic conventions
 * with Optimizely-specific extensions. Attributes provide context for spans and logs,
 * making it easier to filter, search, and analyze telemetry data.
 *
 * Standard OTEL attributes follow the http.* namespace for HTTP operations.
 * Custom Optimizely attributes use the optimizely.* namespace.
 */

export const SemanticAttributes = {
  // Standard HTTP attributes (OpenTelemetry semantic conventions)
  HTTP_METHOD: 'http.method', // HTTP method (GET, POST, etc.)
  HTTP_URL: 'http.url', // Full HTTP URL
  HTTP_STATUS_CODE: 'http.status_code', // HTTP response status code (200, 404, etc.)
  HTTP_USER_AGENT: 'http.user_agent', // User-Agent header value

  // Optimizely Graph API attributes
  OPTI_GRAPH_URL: 'optimizely.graph.url', // Graph API endpoint URL
  OPTI_CONTENT_TYPE: 'optimizely.content_type', // CMS content type name (e.g., "ArticlePage")
  OPTI_CONTENT_KEY: 'optimizely.content.key', // Content GUID/key identifier
  OPTI_CONTENT_PATH: 'optimizely.content.path', // Content URL path
  OPTI_PREVIEW_TOKEN: 'optimizely.preview.token', // Whether preview token was used (boolean)
  OPTI_CACHE_ENABLED: 'optimizely.cache.enabled', // Whether server-side caching is enabled (boolean)
  OPTI_SLOT: 'optimizely.graph.slot', // Graph index slot ('Current' or 'New')
  OPTI_DAM_ENABLED: 'optimizely.dam.enabled', // Whether DAM assets are enabled (boolean)

  // Fragment generation attributes
  OPTI_FRAGMENT_COUNT: 'optimizely.fragment.count', // Number of GraphQL fragments generated
  OPTI_FRAGMENT_THRESHOLD: 'optimizely.fragment.threshold', // Max fragment threshold before warnings
  FRAGMENT_SUFFIX: 'fragment.suffix', // Fragment name suffix

  // Query generation attributes
  OPTI_QUERY_TYPE: 'optimizely.query.type', // Type of query: 'single', 'multiple', or 'metadata'

  // Component resolution attributes
  OPTI_COMPONENT_TYPE: 'optimizely.component.type', // Component content type
  OPTI_COMPONENT_TAG: 'optimizely.component.tag', // Component display tag/variant
  OPTI_COMPONENT_FOUND: 'optimizely.component.found', // Whether component was found (boolean)

  // Preview mode attributes
  PREVIEW_MODE: 'preview.mode', // Preview context mode
  PREVIEW_VERSION: 'preview.version', // Preview version identifier
  PREVIEW_LOCALE: 'preview.locale', // Preview locale

  // Content retrieval attributes
  CONTENT_LOCALE: 'content.locale', // Content locale/language
  CONTENT_VERSION: 'content.version', // Content version
  CONTENT_FOUND: 'content.found', // Whether content was found (boolean)
} as const;
