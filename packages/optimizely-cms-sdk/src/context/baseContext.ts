/**
 * Context data shape stored per request.
 * Used for preview mode, localization, and other request-specific data.
 */
export interface ContextData {
  version?: string;
  type?: string;
  currentContent?: unknown;
  preview_token?: string;
  ctx?: string;
  locale?: string;
  key?: string;
}

/**
 * Context Adapter interface defining the contract for framework-specific context storage.
 *
 * Different frameworks should implement this shape (typically as static methods) to provide
 * their own storage mechanisms:
 * - React: Uses React.cache() for direct request-scoped storage
 * - Vue: Can use Composition API or AsyncLocalStorage-based solution
 * - Svelte: Can use context API or other Svelte-specific mechanism
 */
export interface ContextAdapter {
  /**
   * Initialize a new request context.
   * Should generate a unique identifier for this request.
   *
   * @returns The generated request/context ID
   */
  initializeContext(): void;

  /**
   * Get context data for the current request.
   *
   * @returns Context data for the current request, or undefined if no context exists
   */
  getData(): ContextData | undefined;

  /**
   * Set/merge context data for the current request.
   * Should merge the provided data with existing context.
   *
   * @param value - Partial context data to merge into the current context
   */
  setData(value: Partial<ContextData>): void;

  /**
   * Set a specific piece of context data by key.
   *
   * @param key - The key to set in the context
   * @param value - The value to set for the specified key
   */
  set<K extends keyof ContextData>(key: K, value: ContextData[K]): void;

  /**
   * Get a specific piece of context data by key.
   *
   * @param key - The key to retrieve from the context
   * @returns The value for the specified key, or undefined if not found
   */
  get<K extends keyof ContextData>(key: K): ContextData[K] | undefined;

  /**
   * Clear context data for the current request.
   * Optional method for explicit cleanup.
   */
  clear?(): void;
}
