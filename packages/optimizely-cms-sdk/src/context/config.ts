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
 * import { configureAdapter, ReactContextAdapter } from '@optimizely/cms-sdk/react/server';
 * configureAdapter(new ReactContextAdapter());
 *
 * // Future: Using Vue (hypothetical)
 * import { configureAdapter, VueContextAdapter } from '@optimizely/cms-sdk/vue';
 * configureAdapter(new VueContextAdapter());
 */
export function configureAdapter(adapter: ContextAdapter): void {
  storageAdapter = adapter;
}

/**
 * Get the current storage adapter.
 * Use this to access context data in your components.
 *
 * @throws {Error} If the adapter has not been configured
 *
 * @example
 * ```ts
 * import { getAdapter } from '@optimizely/cms-sdk/react/server';
 *
 * const adapter = getAdapter();
 * const previewToken = adapter.getData()?.preview_token;
 * const locale = adapter.getData()?.locale;
 * ```
 */
export function getAdapter(): ContextAdapter {
  if (!storageAdapter) {
    throw new Error(
      'Context adapter not configured. ' +
        'For React: import from "@optimizely/cms-sdk/react/server" to auto-configure the React adapter. ' +
        'For other frameworks: call configureAdapter() with your custom adapter before using context features.',
    );
  }
  return storageAdapter;
}

/**
 * Check if a context adapter is currently configured.
 *
 * @returns true if an adapter has been configured, false otherwise
 * @internal
 */
export function hasAdapter(): boolean {
  return !!storageAdapter;
}

/**
 * Initialize the request context using the configured adapter.
 * Clears any existing context data to start fresh for a new request.
 * Typically called by the withContext HOC in React applications.
 *
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
export const getContext = (): ContextData | undefined => {
  return getAdapter().getData();
};

/**
 * Update/merge context data for the current request.
 *
 * @param value - Partial context data to merge into the current context
 * @internal
 */
export const setContext = (value: Partial<ContextData>): void => {
  return getAdapter().setData(value);
};

/**
 * Set a specific piece of context data by key.
 *
 * @param key - The key to set in the context
 * @param value - The value to set for the specified key
 * @internal
 */
export const setContextData = <K extends keyof ContextData>(key: K, value: ContextData[K]): void => {
  return getAdapter().set(key, value);
};

/**
 * Get a specific piece of context data by key.
 *
 * @param key - The key to retrieve from the context
 * @returns The value for the specified key, or undefined if not found
 * @internal
 */
export const getContextData = <K extends keyof ContextData>(key: K): ContextData[K] | undefined => {
  return getAdapter().get(key);
};
