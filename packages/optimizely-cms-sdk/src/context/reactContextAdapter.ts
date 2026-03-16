import { cache } from 'react';
import { ContextData, ContextAdapter } from './baseContext.js';

// Module-level cache - React.cache() ensures this is request-scoped in server components
// All calls within the same request share this cached data
const getContextData = cache((): ContextData => ({}));

/**
 * React Context Adapter using React.cache() for request-scoped storage.
 *
 * This adapter is designed for React Server Components and provides
 * automatic request isolation through React's cache mechanism.
 * All static methods operate on the same cached data within a request.
 */
export class ReactContextAdapter implements ContextAdapter {
  /**
   * Initialize context (clears existing data)
   */
  initializeContext() {
    const data = getContextData();
    Object.keys(data).forEach((key) => delete data[key as keyof ContextData]);
  }

  /**
   * Get all context data
   */
  getData(): ContextData | undefined {
    return getContextData();
  }

  /**
   * Set/merge context data
   */
  setData(value: Partial<ContextData>): void {
    Object.assign(getContextData(), value);
  }

  /**
   * Clear all context data
   */
  clear(): void {
    const data = getContextData();
    Object.keys(data).forEach((key) => delete data[key as keyof ContextData]);
  }
}

export default ReactContextAdapter;
