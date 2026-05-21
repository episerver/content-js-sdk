# Observability with OpenTelemetry

The Optimizely CMS SDK includes built-in OpenTelemetry instrumentation for comprehensive observability in production applications.

## Overview

The SDK automatically instruments all major operations with distributed tracing using [OpenTelemetry](https://opentelemetry.io/), providing visibility into:

- **GraphQL query generation and execution** - Track fragment creation, query building, and API requests
- **Content retrieval** - Monitor cache hits, content type resolution, and fetch performance
- **Component resolution** - Observe React component lookups and rendering
- **Errors and warnings** - Capture exceptions and performance warnings with full context

All instrumentation uses **only** `@opentelemetry/api` (not the full SDK), ensuring:

- Zero performance overhead when OpenTelemetry is not configured
- Small bundle size impact (~20KB)
- Full control over telemetry backend and exporters

## Quick Start

### 1. Install OpenTelemetry SDK

```bash
npm install @opentelemetry/sdk-node @opentelemetry/api
```

### 2. Initialize OpenTelemetry

Create an `instrumentation.js` file and import it **before** any SDK imports:

```javascript
// instrumentation.js
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
});

sdk.start();
```

### 3. Use the SDK

```javascript
// app.js
import './instrumentation.js'; // MUST be first!
import { config, getClient } from '@optimizely/cms-sdk';

config({ apiKey: 'your-key' });
const client = getClient();

// All operations are automatically instrumented
await client.getContentByPath('/');
```

## Instrumented Operations

### Content Retrieval

**Span: `optimizely.content.get_by_path`**

- Fetches content by URL path
- Attributes:
  - `optimizely.content.path` - URL path being fetched
  - `optimizely.cache.enabled` - Whether caching is enabled
  - `optimizely.content_type` - Resolved content type name
  - `content.found` - Whether content was found

**Span: `optimizely.content.get`**

- Fetches content by GUID/key
- Attributes:
  - `optimizely.content.key` - Content GUID
  - `content.locale` - Content locale (or "default")
  - `content.version` - Content version (or "latest")
  - `optimizely.content_type` - Content type name
  - `content.found` - Whether content was found

**Span: `optimizely.content.get_preview`**

- Fetches preview content with preview token
- Attributes:
  - `optimizely.content.key` - Content GUID
  - `optimizely.preview.token` - Always `true`
  - `preview.mode` - Preview context mode
  - `preview.version` - Preview version
  - `preview.locale` - Preview locale
  - `optimizely.content_type` - Content type name

### Query Generation

**Span: `optimizely.query.create`**

- Generates GraphQL queries for single or multiple content items
- Attributes:
  - `optimizely.query.type` - "single" or "multiple"
  - `optimizely.content_type` - Content type being queried
  - `optimizely.dam.enabled` - Whether DAM assets are enabled

### Fragment Generation

**Span: `optimizely.fragment.create`**

- Generates GraphQL fragments for content types
- Attributes:
  - `optimizely.content_type` - Content type name
  - `optimizely.dam.enabled` - Whether DAM is enabled
  - `optimizely.fragment.threshold` - Max fragment threshold
  - `fragment.suffix` - Fragment name suffix
  - `optimizely.fragment.count` - Number of fragments generated

### HTTP Requests

**Span: `optimizely.graph.request`**

- GraphQL API requests to Optimizely Graph
- Attributes:
  - `http.method` - HTTP method (POST)
  - `http.url` - Graph API endpoint URL
  - `http.status_code` - Response status code
  - `http.user_agent` - User-Agent header value
  - `optimizely.cache.enabled` - Cache enabled/disabled
  - `optimizely.graph.slot` - Graph index slot ("Current" or "New")
  - `optimizely.preview.token` - Whether preview token was used

### Component Resolution

**Span: `optimizely.component.resolve`**

- Component lookup in ComponentRegistry
- Attributes:
  - `optimizely.component.type` - Content type name
  - `optimizely.component.tag` - Display template tag (if any)
  - `optimizely.component.found` - Whether component was found

**Span: `optimizely.react.render_component`**

- React component rendering with OptimizelyComponent
- Attributes:
  - `optimizely.component.type` - Content type being rendered
  - `component.has_tag` - Whether a tag/variant is used
  - `component.has_display_settings` - Whether display settings provided
  - `optimizely.component.found` - Whether component was found

## Metrics

The SDK automatically records OpenTelemetry metrics alongside spans for performance monitoring and operational dashboards. Metrics provide aggregatable data for analyzing operation durations, frequencies, and cache effectiveness over time.

### Metric Types

The SDK records two types of metrics:

- **Histograms** - Measure operation durations in milliseconds. Useful for analyzing latency distributions (p50, p95, p99).
- **Counters** - Count operation occurrences. Useful for tracking request rates, volumes, and cache hit rates.

### Duration Histograms

All duration histograms are measured in milliseconds and include relevant attributes for filtering and grouping.

#### `optimizely.fragment.generation.duration`

Time spent generating GraphQL fragments for content types.

**Attributes:**

- `optimizely.content_type` - Content type name
- `optimizely.dam.enabled` - Whether DAM is enabled
- `optimizely.fragment.threshold` - Fragment warning threshold

#### `optimizely.query.generation.duration`

Time spent generating complete GraphQL queries (single or multiple item queries).

**Attributes:**

- `optimizely.query.type` - "single" or "multiple"
- `optimizely.content_type` - Content type being queried
- `optimizely.dam.enabled` - Whether DAM is enabled

#### `optimizely.http.request.duration`

Duration of HTTP requests to the Optimizely Graph API.

**Attributes:**

- `http.method` - HTTP method (always "POST")
- `http.status_code` - Response status code
- `optimizely.cache.enabled` - Whether cache parameter was enabled
- `optimizely.graph.slot` - Graph index slot ("Current" or "New")
- `optimizely.preview.token` - Whether preview token was used
- `error` - true if request failed (only on errors)

#### `optimizely.content.fetch.duration`

Total time to fetch content from CMS (includes metadata lookup and content retrieval).

**Attributes:**

- `optimizely.content_type` - Content type name
- `optimizely.cache.enabled` - Whether cache is enabled
- `content.found` - Whether content was found
- `error` - true if fetch failed (only on errors)

#### `optimizely.component.resolve.duration`

Time to resolve components in the ComponentRegistry.

**Attributes:**

- `optimizely.component.type` - Component content type
- `optimizely.component.tag` - Display template tag (if present)
- `optimizely.component.found` - Whether component was found

### Operation Counters

Counters track the total number of operations and use the same attributes as their corresponding histograms.

#### `optimizely.fragment.generation.count`

Number of fragment generation operations.

#### `optimizely.query.generation.count`

Number of query generation operations. Track by query type to monitor single vs multiple item query usage.

#### `optimizely.http.requests`

Total number of HTTP requests to Graph API. Monitor by status code, cache enabled, and slot.

#### `optimizely.content.fetches`

Total number of content fetch operations.

#### `optimizely.component.lookups`

Total component resolution attempts.

### Using Metrics in Your Application

The SDK exports all metric instruments via the `metrics` namespace:

```typescript
import { metrics } from '@optimizely/cms-sdk/telemetry';

// Access instruments for custom recording
metrics.fragmentGenerationDuration.record(123.4, {
  'optimizely.content_type': 'BlogPost',
  'optimizely.dam.enabled': true,
});

metrics.httpRequestCount.add(1, {
  'http.method': 'POST',
  'http.status_code': 200,
});
```

## Troubleshooting

### No spans appearing?

1. Ensure `instrumentation.js` is imported **first** before any SDK imports
2. Check console for OTEL initialization messages
3. Verify the exporter is configured correctly

### Spans but no attributes?

- Attributes are set during operation - check that operations are completing successfully
- Some attributes are conditional (e.g., `content.found` only when content exists)

### Performance concerns?

- Verify you're using sampling in production
- Check that you're not creating excessive custom spans

## Learn More

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)
