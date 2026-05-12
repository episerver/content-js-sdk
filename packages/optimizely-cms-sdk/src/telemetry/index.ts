// Export tracer utilities for creating custom spans
export { getTracer, createSpan } from './tracer.js';
export type { SpanOptions } from './tracer.js';

// Export logging utilities (internal use, but exposed for advanced scenarios)
export { logError, logWarning } from './logger.js';

// Export semantic attributes for custom instrumentation
export { SemanticAttributes } from './attributes.js';

// Export metrics instruments
export * as metrics from './metrics.js';
