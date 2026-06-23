// Export tracer utilities for creating custom spans
export { getTracer, createSpan } from './tracer.js';
export type { SpanOptions } from './tracer.js';

// Export meter utilities for creating custom metrics
export { getMeter } from './meter.js';

// Export logging utilities (internal use, but exposed for advanced scenarios)
export { logError, logWarning } from './logger.js';

// Export semantic attributes for custom instrumentation
export { SemanticAttributes } from './attributes.js';

// Export meter instrumentation identity for OTEL configuration
export { METER_NAME, METER_VERSION } from './meter.js';

// Export metric names for OTEL views and configuration
export { MetricNames } from './metrics.js';

// Export metrics instruments
export * as metrics from './metrics.js';
