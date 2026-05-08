import { trace } from '@opentelemetry/api';

/**
 * Log an error using OpenTelemetry span events.
 *
 * When an Error object is provided, exception details (message, type, stack trace)
 * are automatically added as event attributes for easier debugging.
 *
 * If called outside a traced context, falls back to console.error.
 *
 * @param message - Error message
 * @param error - Optional Error object (if this is an exception)
 * @param attributes - Optional custom attributes
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (err) {
 *   logError('Failed to fetch data', err, {
 *     'operation': 'fetch',
 *     'retry.count': 3
 *   });
 * }
 * ```
 */
export const logError = (message: string, error?: Error, attributes?: Record<string, any>): void => {
  const span = getCurrentSpan();

  if (span) {
    span.addEvent('error', {
      ...attributes,
      'error.message': message,
      ...(error && {
        'exception.message': error.message,
        'exception.type': error.name,
        'exception.stacktrace': error.stack,
      }),
    });
  } else {
    if (error) console.error(message, error, attributes);
    else console.error(message, attributes);
  }
};

/**
 * Log a warning using OpenTelemetry span events.
 *
 * If called outside a traced context, falls back to console.warn.
 *
 * @param message - Warning message
 * @param attributes - Optional custom attributes
 *
 * @example
 * ```typescript
 * logWarning('Fragment count exceeds threshold', {
 *   'fragment.count': 150,
 *   'fragment.threshold': 100,
 *   'content.type': 'ArticlePage'
 * });
 * ```
 */
export const logWarning = (message: string, attributes?: Record<string, any>): void => {
  const span = getCurrentSpan();

  if (span) {
    span.addEvent('warning', {
      ...attributes,
      'warning.message': message,
    });
  } else {
    console.warn(message, attributes);
  }
};

const getCurrentSpan = () => {
  return trace.getActiveSpan();
};
