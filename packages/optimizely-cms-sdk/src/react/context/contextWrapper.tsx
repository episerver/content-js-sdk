import React from 'react';
import { ContextData } from '../../context/baseContext.js';
import {
  configureAdapter,
  initializeRequestContext,
  setContextData,
} from '../../context/config.js';
import ReactContextAdapter from '../../context/reactContextAdapter.js';

// Configure the context system to use the React adapter by default
configureAdapter(new ReactContextAdapter());

/**
 * Helper function to extract a single string value from searchParams.
 * Handles both array and single value cases.
 */
function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Higher-Order Component that initializes context storage.
 *
 * This HOC is designed for React Server Components and uses the configured
 * context adapter (default: React.cache()) for request-scoped storage.
 * It automatically extracts and saves preview_token and locale from searchParams if available.
 *
 * Components can access context data by importing the adapter:
 *
 * @param Component - The React component to wrap
 * @param initialContext - Optional initial context data to set
 *
 * @example
 * ```tsx
 * import { getAdapter } from '@optimizely/cms-sdk';
 *
 * async function MyPage({ searchParams }) {
 *   // Context is automatically initialized from searchParams by withAppContext
 *   const adapter = getAdapter();
 *   const previewToken = adapter.getPreviewToken();
 *   return <div>...</div>;
 * }
 *
 * export default withAppContext(MyPage);
 * ```
 */
export function withAppContext<P extends object>(
  Component: React.ComponentType<P>,
  initialContext?: Partial<ContextData>,
) {
  return async function WrappedWithContext(props: P) {
    // Initialize context for this request
    initializeRequestContext();

    // Extract and await searchParams if available
    const propsWithSearchParams = props as P & {
      searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
    };

    const searchParams = propsWithSearchParams.searchParams
      ? await propsWithSearchParams.searchParams
      : undefined;

    // Build context data from searchParams
    const contextData: Partial<ContextData> = {
      preview_token: getSearchParam(searchParams?.preview_token),
      locale: getSearchParam(searchParams?.loc),
      key: getSearchParam(searchParams?.key),
      version: getSearchParam(searchParams?.ver),
      ...initialContext,
    };

    setContextData(contextData);

    return React.createElement(Component, props);
  };
}
