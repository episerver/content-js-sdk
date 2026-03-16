import { ContextData, ContextAdapter } from './baseContext.js';

/**
 * Global storage adapter instance.
 * Defaults to React adapter, but can be configured for other frameworks.
 */
let storageAdapter: ContextAdapter = null as unknown as ContextAdapter;

/**
 * Configure the storage adapter for the context system.
 *
 * @param adapter - The storage adapter instance to use
 *
 * @example
 * ```ts
 * // Using React (default)
 * import { configureAdapter, ReactContextAdapter } from '@optimizely/cms-sdk';
 * configureAdapter(new ReactContextAdapter());
 *
 * // Future: Using Vue
 * import { configureAdapter, VueContextAdapter } from '@optimizely/cms-sdk';
 * configureAdapter(new VueContextAdapter());
 * ```
 */
export function configureAdapter(adapter: ContextAdapter): void {
  storageAdapter = adapter;
}

/**
 * Get the current storage adapter.
 * Use this to access context data in your components.
 *
 * @example
 * ```ts
 * import { getAdapter } from '@optimizely/cms-sdk';
 *
 * const adapter = getAdapter();
 * const previewToken = adapter.getPreviewToken();
 * const locale = adapter.getLocale();
 * ```
 */
export function getAdapter(): ContextAdapter {
  return storageAdapter;
}

/**
 * Initialize request context (called by withContext HOC).
 *
 * @returns The generated request ID
 * @internal
 */
export const initializeRequestContext = (): void => {
  getAdapter().initializeContext();
};

/**
 * Retrieve current context data for this request.
 *
 * @returns Context data for the current request, or undefined if no context exists
 * @internal
 */
export const getContextData = () => {
  return getAdapter().getData();
};

/**
 * Update/merge context data for the current request.
 *
 * @param value - Partial context data to merge into the current context
 * @internal
 */
export const setContextData = (value: Partial<ContextData>): void => {
  return getAdapter().setData(value);
};
