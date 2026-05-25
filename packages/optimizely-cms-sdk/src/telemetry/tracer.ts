import { trace, Tracer, Span, SpanStatusCode, type Context } from '@opentelemetry/api';
import { SDK_VERSION } from '../generated/version.js';

// SDK instrumentation identity
const INSTRUMENTATION_NAME = '@optimizely/cms-sdk';

// Singleton tracer instance
let tracer: Tracer | null = null;

/**
 * Get the OpenTelemetry Tracer instance for the Optimizely SDK.
 *
 * The tracer uses the global OTEL provider. If no provider is configured,
 * all spans will be no-ops.
 *
 * @example
 * ```typescript
 * import { getTracer } from '@optimizely/cms-sdk';
 *
 * const tracer = getTracer();
 * const span = tracer.startSpan('my.custom.operation');
 * try {
 *   // your code here
 *   span.setStatus({ code: SpanStatusCode.OK });
 * } catch (error) {
 *   span.recordException(error);
 *   span.setStatus({ code: SpanStatusCode.ERROR });
 * } finally {
 *   span.end();
 * }
 * ```
 *
 * @returns The SDK's tracer instance
 */
export const getTracer = (): Tracer => {
  if (!tracer) {
    tracer = trace.getTracer(INSTRUMENTATION_NAME, SDK_VERSION);
  }
  return tracer;
};

/**
 * Options for creating a span.
 */
export type SpanOptions = {
  /** Optional attributes to add to the span when it starts */
  attributes?: Record<string, string | number | boolean>;
  /** Optional parent context for creating child spans */
  parentContext?: Context;
};

/**
 * Wraps an async operation in an OTEL span with automatic error handling.
 *
 * This utility function:
 * 1. Starts an active span (makes it current in context)
 * 2. Executes the provided function with the span as a parameter
 * 3. Sets span status to OK on success
 * 4. Records exceptions and sets ERROR status on failure
 * 5. Always ends the span (even on error)
 * 6. Re-throws any exceptions (preserves error propagation)
 *
 * The span is "active" which means nested SDK calls will automatically
 * become children of this span in the trace hierarchy.
 *
 * @param name - Span name (use namespace format: "optimizely.operation.name")
 * @param fn - Async function to execute within the span
 * @param options - Optional span attributes and parent context
 * @returns The result of the function
 * @throws Re-throws any exception from the function after recording it
 *
 * @example
 * ```typescript
 * const result = await createSpan(
 *   'myapp.process.data',
 *   async (span) => {
 *     span.setAttribute('record.count', records.length);
 *     return processRecords(records);
 *   },
 *   { attributes: { 'data.source': 'api' } }
 * );
 * ```
 */
export const createSpan = async <T>(
  name: string,
  fn: (span: Span) => Promise<T> | T,
  options?: SpanOptions,
): Promise<T> => {
  const tracer = getTracer();

  // startActiveSpan makes this span current in the context
  // Any nested operations will see this as their parent
  return tracer.startActiveSpan(name, options || {}, async span => {
    try {
      // Execute the wrapped function
      const result = await fn(span);

      // Mark span as successful
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      // Record the exception with full stack trace
      // This logs the exception even if it's caught/handled by caller
      span.recordException(error as Error);

      // Mark span as failed with error message
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });

      // Re-throw to preserve error propagation
      throw error;
    } finally {
      // Always end the span (required for proper trace completion)
      span.end();
    }
  });
};
