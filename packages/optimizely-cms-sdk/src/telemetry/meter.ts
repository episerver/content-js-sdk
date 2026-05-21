import { metrics, Meter } from '@opentelemetry/api';
import { SDK_VERSION } from '../generated/version.js';

// SDK instrumentation identity
export const METER_NAME = '@optimizely/cms-sdk';
export const METER_VERSION = SDK_VERSION;

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
    meter = metrics.getMeter(METER_NAME, METER_VERSION);
  }
  return meter;
};
