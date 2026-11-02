// A simple function to check for the development environment.
export function isDev(): boolean {
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
}

/**
 * An environment variable, or nothing where there is no environment to read
 * from — a browser, or an edge runtime that does not expose one.
 */
export function env(name: string): string | undefined {
  return typeof process !== 'undefined' ? process.env?.[name] : undefined;
}
