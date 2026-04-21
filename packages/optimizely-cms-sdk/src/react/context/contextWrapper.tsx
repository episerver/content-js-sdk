import React from 'react';
import { configureAdapter, hasAdapter, initializeRequestContext } from '../../context/config.js';
import ReactContextAdapter from '../../context/reactContextAdapter.js';

// Configure the React adapter only if no custom adapter has been set
// This allows users to configure their own adapter before importing from react/server
if (!hasAdapter()) {
  configureAdapter(new ReactContextAdapter());
}

/**
 * Higher-Order Component that initializes context storage.
 *
 * This HOC is designed for React Server Components and uses the configured
 * context adapter (default: React.cache()) for request-scoped storage.
 *
 * NOTE: `getPreviewContent` automatically populates context with preview data.
 * You may not need this HOC if you're only using that method.
 *
 * The HOC is useful for:
 * - Initializing context before any content fetching
 * - Ensuring context is available throughout the component tree
 * - Using context for non-preview data
 *
 * Components can access context data using `getContext()`:
 *
 * @param Component - The React component to wrap
 *
 * @example
 * ```tsx
 * import { getContext, setContext } from '@optimizely/cms-sdk/react/server';
 *
 * async function MyPage({ params }) {
 *   // Context is initialized by withAppContext
 *   // You can manually set data if needed
 *   setContext({ locale: 'en-US' });
 *
 *   const context = getContext();
 *   return <div>Locale: {context?.locale}</div>;
 * }
 *
 * export default withAppContext(MyPage);
 * ```
 */
export function withAppContext<P extends object>(Component: React.ComponentType<P>) {
  return async function WrappedWithContext(props: P) {
    // Initialize context for this request
    initializeRequestContext();

    return React.createElement(Component, props);
  };
}
