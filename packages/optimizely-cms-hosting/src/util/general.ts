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

type Tagged =
  | { $type: 'Buffer'; base64: string }
  | { $type: 'Map'; entries: [unknown, unknown][] };

// A function, not an arrow: `this[key]` is the value before Buffer's toJSON ran
function replacer(this: Record<string, unknown>, key: string, value: unknown) {
  const original = this[key];

  if (Buffer.isBuffer(original))
    return { $type: 'Buffer', base64: original.toString('base64') };
  if (original instanceof Map) return { $type: 'Map', entries: [...original] };
  return value;
}

const reviver = (_key: string, value: unknown) => {
  const tagged = value as Tagged | null;

  if (tagged?.$type === 'Buffer') return Buffer.from(tagged.base64, 'base64');
  if (tagged?.$type === 'Map') return new Map(tagged.entries);
  return value;
};

/** `JSON.stringify` that keeps Buffers and Maps, which Next.js puts in cached pages. */
export const serialize = (value: unknown) => JSON.stringify(value, replacer);

/** Parses the output of `serialize`, restoring Buffers and Maps. */
export const deserialize = <T>(raw: string) => JSON.parse(raw, reviver) as T;

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
