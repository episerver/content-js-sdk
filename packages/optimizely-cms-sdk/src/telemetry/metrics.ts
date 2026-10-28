import { Histogram, Counter, Attributes } from '@opentelemetry/api';
import { getMeter } from './meter.js';
import { isComponentMetricsEnabled } from './settings.js';

const meter = getMeter();

export const QueryType = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
} as const;

/**
 * Metric instrument names for OpenTelemetry configuration.
 */
export const MetricNames = {
  // Histogram
  FRAGMENT_GENERATION_DURATION: 'optimizely.fragment.generation.duration',
  QUERY_GENERATION_DURATION: 'optimizely.query.generation.duration',
  HTTP_REQUEST_DURATION: 'optimizely.http.request.duration',
  CONTENT_FETCH_DURATION: 'optimizely.content.fetch.duration',
  COMPONENT_RESOLVE_DURATION: 'optimizely.component.resolve.duration',

  // Counter
  FRAGMENT_GENERATION_COUNT: 'optimizely.fragment.generation.count',
  QUERY_GENERATION_COUNT: 'optimizely.query.generation.count',
  HTTP_REQUEST_COUNT: 'optimizely.http.requests',
  CONTENT_FETCH_COUNT: 'optimizely.content.fetches',
  COMPONENT_LOOKUP_COUNT: 'optimizely.component.lookups',
} as const;

// Histograms

export const fragmentGenerationDuration: Histogram = meter.createHistogram(
  'optimizely.fragment.generation.duration',
  {
    description: 'Time to generate GraphQL fragments',
    unit: 'ms',
  },
);

export const queryGenerationDuration: Histogram = meter.createHistogram(
  'optimizely.query.generation.duration',
  {
    description: 'Time to generate GraphQL queries',
    unit: 'ms',
  },
);

export const httpRequestDuration: Histogram = meter.createHistogram(
  'optimizely.http.request.duration',
  {
    description: 'Duration of HTTP requests to Graph API',
    unit: 'ms',
  },
);

export const contentFetchDuration: Histogram = meter.createHistogram(
  'optimizely.content.fetch.duration',
  {
    description: 'Time to fetch content from CMS',
    unit: 'ms',
  },
);

const componentResolveHistogram = meter.createHistogram(
  'optimizely.component.resolve.duration',
  {
    description: 'Time to resolve components in ComponentRegistry',
    unit: 'ms',
  },
);

// Recording reads Date.now(), which aborts a Next.js cacheComponents prerender, so render-path
// measurements are buffered and replayed by the metric reader during collection
const MAX_PENDING_DURATIONS = 10_000;
const pendingResolveDurations: { value: number; attributes?: Attributes }[] = [];
const lookupTotals = new Map<string, { value: number; attributes?: Attributes }>();

// No-op while `componentMetrics` is off; checked per call because config() runs after this module loads
export const componentResolveDuration: Histogram = {
  record: (value, attributes) => {
    if (!isComponentMetricsEnabled()) return;
    if (pendingResolveDurations.length < MAX_PENDING_DURATIONS)
      pendingResolveDurations.push({ value, attributes });
  },
};

// Counters

export const fragmentGenerationCount: Counter = meter.createCounter(
  'optimizely.fragment.generation.count',
  {
    description: 'Number of fragment generation operations',
  },
);

export const queryGenerationCount: Counter = meter.createCounter(
  'optimizely.query.generation.count',
  {
    description: 'Number of query generation operations',
  },
);

export const httpRequestCount: Counter = meter.createCounter('optimizely.http.requests', {
  description: 'Total number of HTTP requests to Graph API',
});

export const contentFetchCount: Counter = meter.createCounter(
  'optimizely.content.fetches',
  {
    description: 'Total number of content fetch operations',
  },
);

meter
  .createObservableCounter('optimizely.component.lookups', {
    description: 'Total component resolution attempts',
  })
  .addCallback((observer) => {
    pendingResolveDurations
      .splice(0)
      .forEach((it) => componentResolveHistogram.record(it.value, it.attributes));
    lookupTotals.forEach((it) => observer.observe(it.value, it.attributes));
  });

// No-op while `componentMetrics` is off, like componentResolveDuration
export const componentLookupCount: Counter = {
  add: (value, attributes) => {
    if (!isComponentMetricsEnabled()) return;
    const key = JSON.stringify(attributes ?? {});
    const total = lookupTotals.get(key)?.value ?? 0;
    lookupTotals.set(key, { value: total + value, attributes });
  },
};

export const recordMetrics = (
  histogram: Histogram,
  counter: Counter,
  startTime: number,
  attributes: Record<string, any>,
): void => {
  const duration = performance.now() - startTime;
  histogram.record(duration, attributes);
  counter.add(1, attributes);
};
