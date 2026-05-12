import { metrics, Meter } from '@opentelemetry/api';
import { SDK_VERSION } from '../generated/version.js';

// SDK instrumentation identity
const INSTRUMENTATION_NAME = '@optimizely/cms-sdk';
const INSTRUMENTATION_VERSION = SDK_VERSION;

// Singleton meter instance
let meter: Meter | null = null;

/**
 * Get the OpenTelemetry Meter instance for the Optimizely SDK.
 *
 * The meter uses the global OTEL provider. If no provider is configured,
 * all metrics will be no-ops.
 *
 * @returns The SDK's meter instance
 */
export const getMeter = (): Meter => {
  if (!meter) {
    meter = metrics.getMeter(INSTRUMENTATION_NAME, INSTRUMENTATION_VERSION);
  }
  return meter;
};
