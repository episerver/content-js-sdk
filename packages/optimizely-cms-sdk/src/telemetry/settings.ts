/** Telemetry settings passed to `config()` */
export type TelemetryOptions = {
  /**
   * Record the `optimizely.component.*` metrics on every component lookup.
   *
   * Turn this off when using Next.js `cacheComponents`: the OpenTelemetry metrics SDK reads
   * `Date.now()` on every measurement, which aborts the prerender of the static shell.
   * The `optimizely.component.resolve` span is still emitted.
   *
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
