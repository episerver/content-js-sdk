/** Telemetry settings passed to `config()` */
export type TelemetryOptions = {
  /**
   * Record the `optimizely.component.*` metrics. Turn off with Next.js `cacheComponents`,
   * where they abort the prerender. See `docs/guides/observability.md`.
   * @default true
   */
  componentMetrics?: boolean;
};

let telemetryOptions: TelemetryOptions = {};

/**
 * Replaces the telemetry settings.
 * @internal Called by `config()`
 */
export const setTelemetryOptions = (options: TelemetryOptions = {}): void => {
  telemetryOptions = options;
};

/**
 * Whether the component lookup metrics are recorded.
 * @internal
 */
export const isComponentMetricsEnabled = (): boolean =>
  telemetryOptions.componentMetrics ?? true;
