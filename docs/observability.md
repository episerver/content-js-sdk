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

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter()
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

## Creating Custom Spans

Use `getTracer()` to create custom spans for your application logic:

```javascript
import { getTracer } from '@optimizely/cms-sdk';

const tracer = getTracer();

const span = tracer.startSpan('myapp.process_content');
span.setAttribute('content.count', 10);

try {
  // Your application code
  span.setStatus({ code: 1 }); // OK
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: 2, message: error.message }); // ERROR
} finally {
  span.end();
}
```

Or use the `createSpan` helper for automatic error handling:

```javascript
import { createSpan } from '@optimizely/cms-sdk';

await createSpan('myapp.process_content', async (span) => {
  span.setAttribute('content.count', 10);
  // Your code - span automatically ends and records errors
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

### TypeScript errors?

- Ensure `@opentelemetry/api` is installed
- The SDK re-exports types: `import type { SpanOptions } from '@optimizely/cms-sdk'`

## Learn More

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)
