/**
 * Checks whether the code is running in a real browser.
 */
export const isBrowser = (): boolean =>
  typeof window !== 'undefined' && !globalThis.process?.versions?.node;
