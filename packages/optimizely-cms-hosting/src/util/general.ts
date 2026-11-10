const LOG_PREFIX = '[cms-hosting]';

const write = (level: 'info' | 'warn' | 'error') => (message: string, error?: unknown) =>
  error === undefined ?
    console[level](`${LOG_PREFIX} ${message}`)
  : console[level](
      `${LOG_PREFIX} ${message}:`,
      error instanceof Error ? error.message : String(error),
    );

/** Package logger: prefixes each message and prints only the message of an optional error. */
export const log = { info: write('info'), warn: write('warn'), error: write('error') };

/**
 * Rejects with "`operation` timed out after Ns" when `promise` has not settled
 * within `ms`. Does not keep the process alive.
 */
export const withTimeout = <T>(promise: Promise<T>, ms: number, operation: string) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operation} timed out after ${ms / 1000}s`)),
        ms,
      ).unref(),
    ),
  ]);
