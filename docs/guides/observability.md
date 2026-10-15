# Monitor the SDK with OpenTelemetry

When a page is slow or a component doesn't render, you need to know whether the time went
on building the query, waiting for Graph or resolving components. The SDK emits
[OpenTelemetry](https://opentelemetry.io/) traces and metrics for these operations, so
they show up next to the rest of your application in any OpenTelemetry backend.

> **You will learn**
>
> - What the SDK instruments
> - How to collect its traces and metrics
> - When to turn off component metrics in Next.js
> - Why some spans only appear on a cache miss
> - How to add your own spans and metrics
> - Which spans, attributes and metrics the SDK emits

## What the SDK instruments

- **Content fetching**: each `getContent`, `getContentByPath` and `getPreviewContent`
  call, and every HTTP request it makes to Graph.
- **Query generation**: building the GraphQL fragments and query for a content type.
- **Component resolution**: looking up a component in the registry, and rendering it with
  `OptimizelyComponent`.
- **Warnings and errors**: recorded as events on the active span.

The instrumentation uses only `@opentelemetry/api`, which the SDK depends on. Until you
register an OpenTelemetry SDK in your application, every call is a no-op, so you pay
nothing for instrumentation you don't collect. You choose the exporter and the backend.

## Collect traces and metrics

Install the OpenTelemetry Node SDK, with the trace and metric packages the example uses:

```sh
npm install @opentelemetry/sdk-node @opentelemetry/sdk-trace-node @opentelemetry/sdk-metrics
```

Create an instrumentation file that starts the SDK. This example prints spans and metrics
to the console:

```js
// instrumentation.mjs
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
});

sdk.start();
```

Import it before anything else, so the SDK is registered before `@optimizely/cms-sdk`
loads:

```js
// app.mjs
import './instrumentation.mjs';
import { config, getClient } from '@optimizely/cms-sdk';

config({ apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY });

await getClient().getContentByPath('/');
```

Every SDK operation from here on is traced. Swap the console exporters for your backend's
exporter in production.

> [!NOTE]
>
> In Next.js, start the OpenTelemetry SDK from the `register()` function in
> `instrumentation.ts` instead of importing it yourself. See
> [OpenTelemetry in Next.js](https://nextjs.org/docs/app/guides/open-telemetry).

## Turn off component metrics for Next.js Cache Components

With
[`cacheComponents`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
on, Next.js aborts the prerender of a page's static shell when anything reads the current
time. The OpenTelemetry metrics SDK reads `Date.now()` for every measurement, and the SDK
records the `optimizely.component.*` metrics each time `OptimizelyComponent` looks up a
component. When that happens in the static shell, the page returns a 500.

Turn the component metrics off in `config()`:

```ts
// src/app/layout.tsx
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  telemetry: { componentMetrics: false },
});
```

The `optimizely.component.resolve` span is still emitted with the same attributes, so the
lookups stay visible in your traces. Spans aren't affected because Next.js starts them
outside the prerender, and the fragment and query metrics aren't affected because the SDK
records them only after it has sent a request to Graph.

You need this only when `OptimizelyComponent` renders in the static shell: with content
fetched in a `'use cache'` function and no request-time API, such as `cookies()`,
`headers()` or `connection()`, called before it.

## Why some spans only appear on a cache miss

The SDK caches generated queries. When it reuses a cached query, it emits no
`optimizely.query.create` or `optimizely.fragment.create` span, and doesn't increment the
matching counters. Those spans and metrics appear only when the SDK actually builds a
query, so they measure real work rather than cache lookups.

This keeps telemetry volume down, with two side effects:

- The trace for a request looks different on a cache miss than on a cache hit.
- You can't calculate a cache hit rate from these spans or counters.

If you need either, add your own spans around the calls you care about, at the route or
API level, so they appear whether or not the query was cached.

## Add your own spans and metrics

`@optimizely/cms-sdk/telemetry` exports the SDK's own helpers, so your spans can use the
same tracer and attribute names:

```ts
import { createSpan, SemanticAttributes } from '@optimizely/cms-sdk/telemetry';
import { getClient } from '@optimizely/cms-sdk';

const pages = await createSpan('myapp.page.load', async span => {
  span.setAttribute(SemanticAttributes.OPTI_CONTENT_PATH, '/news');
  return getClient().getContentByPath('/news');
});
```

`createSpan` makes the span active, so the SDK's own spans for the fetch become its
children. It sets the status to OK on success, and records the exception and sets ERROR
status if the function throws.

The module also exports:

- `getTracer()` and `getMeter()`: the SDK's tracer and meter, named `@optimizely/cms-sdk`.
- `METER_NAME` and `METER_VERSION`: the meter's identity, for configuring views.
- `MetricNames`: the names of every metric below.
- `metrics`: the metric instruments themselves, for example
  `metrics.fragmentGenerationDuration`.

## Reference

### Spans

<details>
<summary><b>Content fetching spans</b></summary>

**`optimizely.content.get_by_path`**: one `getContentByPath` call.

| Attribute                  | Value                                 |
| -------------------------- | ------------------------------------- |
| `optimizely.content.path`  | The path being fetched                |
| `optimizely.cache.enabled` | Whether Graph caching is on           |
| `optimizely.content_type`  | The resolved content type, when found |
| `optimizely.content.found` | `false` when no content matched       |

**`optimizely.content.get`**: one `getContent` call.

| Attribute                    | Value                                 |
| ---------------------------- | ------------------------------------- |
| `optimizely.content.key`     | The content key                       |
| `optimizely.content.locale`  | The locale, or `default`              |
| `optimizely.content.version` | The version, or `latest`              |
| `optimizely.content_type`    | The resolved content type, when found |
| `optimizely.content.found`   | `false` when no content matched       |

**`optimizely.content.get_preview`**: one `getPreviewContent` call.

| Attribute                    | Value                     |
| ---------------------------- | ------------------------- |
| `optimizely.content.key`     | The content key           |
| `optimizely.preview.token`   | Always `true`             |
| `optimizely.preview.mode`    | The preview context mode  |
| `optimizely.preview.version` | The previewed version     |
| `optimizely.preview.locale`  | The previewed locale      |
| `optimizely.content_type`    | The resolved content type |

**`optimizely.graph.request`**: one HTTP request to Graph.

| Attribute                  | Value                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `http.method`              | Always `POST`                                                                                       |
| `http.url`                 | The Graph endpoint                                                                                  |
| `http.status_code`         | The response status                                                                                 |
| `http.user_agent`          | The `User-Agent` header                                                                             |
| `optimizely.cache.enabled` | Whether Graph caching is on                                                                         |
| `optimizely.graph.slot`    | The Graph index slot, `Current` or `New`                                                            |
| `optimizely.preview.token` | Whether the request carried a preview token                                                         |
| `optimizely.auth.mode`     | The credential used: `single`, `preview`, `custom`, `hmac` or `bearer`. Never the credential itself |

</details>

<details>
<summary><b>Query generation spans</b></summary>

These appear only when the SDK builds a query rather than reusing a cached one. See
[Why some spans only appear on a cache miss](#why-some-spans-only-appear-on-a-cache-miss).

**`optimizely.query.create`**: building the query for one content type.

| Attribute                  | Value                                           |
| -------------------------- | ----------------------------------------------- |
| `optimizely.query.type`    | `single` or `multiple`                          |
| `optimizely.content_type`  | The content type being queried                  |
| `optimizely.dam.enabled`   | Whether DAM asset fragments are included        |
| `optimizely.forms.enabled` | Whether Optimizely Forms fragments are included |

**`optimizely.fragment.create`**: building the fragments for one content type and the
types it references.

| Attribute                       | Value                                    |
| ------------------------------- | ---------------------------------------- |
| `optimizely.content_type`       | The content type                         |
| `optimizely.dam.enabled`        | Whether DAM asset fragments are included |
| `optimizely.fragment.threshold` | The maximum fragment threshold           |
| `optimizely.fragment.suffix`    | The fragment name suffix                 |
| `optimizely.fragment.count`     | How many fragments were generated        |

</details>

<details>
<summary><b>Component spans</b></summary>

**`optimizely.component.resolve`**: looking up a component in the registry.

| Attribute                    | Value                            |
| ---------------------------- | -------------------------------- |
| `optimizely.component.type`  | The content type                 |
| `optimizely.component.tag`   | The display template tag, if any |
| `optimizely.component.found` | Whether a component was found    |

**`optimizely.react.render_component`**: rendering content with `OptimizelyComponent`.
Bindings for other frameworks emit `optimizely.<framework>.render_component`; see
[Framework-agnostic core](./framework-agnostic-core.md).

| Attribute                                   | Value                                |
| ------------------------------------------- | ------------------------------------ |
| `optimizely.component.type`                 | The content type being rendered      |
| `optimizely.component.has_tag`              | Whether a tag was used               |
| `optimizely.component.has_display_settings` | Whether display settings were passed |
| `optimizely.component.found`                | Whether a component was found        |

</details>

Warnings and errors the SDK logs inside a span are added to it as `warning` and `error`
events, with the message in `warning.message` or `error.message`. Outside a span they go
to the console instead.

### Metrics

The SDK records a duration histogram, in milliseconds, and a counter for each operation.
Each counter carries the same attributes as its histogram.

| Histogram                                 | Counter                                | Attributes                                                                                       |
| ----------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `optimizely.fragment.generation.duration` | `optimizely.fragment.generation.count` | `optimizely.content_type`, `optimizely.dam.enabled`, `optimizely.fragment.threshold`             |
| `optimizely.query.generation.duration`    | `optimizely.query.generation.count`    | `optimizely.query.type`, `optimizely.content_type`, `optimizely.dam.enabled`                     |
| `optimizely.component.resolve.duration`   | `optimizely.component.lookups`         | `optimizely.component.type`, `optimizely.component.found`, `optimizely.component.tag` (when set) |

The fragment and query metrics are recorded only when a query is built, not when a cached
one is reused. The component metrics are not recorded when `telemetry.componentMetrics` is
`false`. See
[Turn off component metrics for Next.js Cache Components](#turn-off-component-metrics-for-nextjs-cache-components).

> [!NOTE]
>
> `MetricNames` and `metrics` also define `optimizely.http.request.duration`,
> `optimizely.http.requests`, `optimizely.content.fetch.duration` and
> `optimizely.content.fetches`, but the SDK doesn't record them. Use the
> `optimizely.graph.request` and `optimizely.content.*` spans for request and fetch
> timings, or record these instruments yourself.

## Troubleshooting

### No spans appear

- Make sure the instrumentation file runs before anything imports `@optimizely/cms-sdk`.
- Check that the OpenTelemetry SDK starts without errors.
- Check the exporter configuration.

### Query or fragment spans are missing

That is expected when the query was cached. See
[Why some spans only appear on a cache miss](#why-some-spans-only-appear-on-a-cache-miss).

### Spans have fewer attributes than listed

Some attributes are set partway through the operation. For example,
`optimizely.content_type` is set only once the content is found, and
`optimizely.content.found` only when it isn't. An operation that throws early has fewer
attributes.

### Pages return 500 with Next.js `cacheComponents`

If the log shows `Next.js encountered the unstable value Date.now() while prerendering`,
followed by `NEXT_STATIC_GEN_BAILOUT`, turn off the component metrics. See
[Turn off component metrics for Next.js Cache Components](#turn-off-component-metrics-for-nextjs-cache-components).

### Telemetry is too expensive

Configure sampling in your OpenTelemetry SDK, and avoid wrapping hot code paths in custom
spans.

## Recap

- The SDK emits OpenTelemetry spans and metrics for fetching, query generation and
  component resolution. Without an OpenTelemetry SDK they are no-ops.
- Register your OpenTelemetry SDK before `@optimizely/cms-sdk` loads.
- With Next.js `cacheComponents`, set `telemetry: { componentMetrics: false }` in
  `config()`.
- Query and fragment spans appear only when a query is built, not on a cache hit.
- `@optimizely/cms-sdk/telemetry` exports the tracer, meter and attribute names for your
  own instrumentation.

## Related

- [Fetch content](../learn/fetch-content.md)
- [Framework-agnostic core](./framework-agnostic-core.md)
- [Troubleshooting](../reference/troubleshooting.md)
- [OpenTelemetry for JavaScript](https://opentelemetry.io/docs/languages/js/)
