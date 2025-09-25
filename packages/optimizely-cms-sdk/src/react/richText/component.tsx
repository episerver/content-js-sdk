import React from 'react';
import {
  renderContent,
  generateDefaultElements,
  generateDefaultLeafs,
  type RichTextProps,
} from './lib.js';

/**
 * React component for rendering Optimizely CMS RichText content.
 *
 * Transforms structured JSON content into React elements with support for
 * custom element and leaf component overrides, HTML entity decoding, and
 * fallback rendering strategies.
 *
 * @example
 * ```tsx
 * <RichText
 *   content={richTextData}
 *   elements={{ 'heading-one': CustomHeading }}
 *   leafs={{ 'bold': CustomBold }}
 * />
 * ```
 */
export const RichText: React.FC<RichTextProps> = ({
  content,
  elements: customElements = {},
  leafs: customLeafs = {},
  elementFallback,
  leafFallback,
  decodeHtmlEntities = true,
}) => {
  const nodes = Array.isArray(content?.children) ? content.children : [];

  // Merge default components with user overrides
  const elements = {
    ...generateDefaultElements(),
    ...customElements,
  };

  // Merge default leafs with user overrides
  const leafs = {
    ...generateDefaultLeafs(),
    ...customLeafs,
  };

  const renderConfig = {
    decodeHtmlEntities,
    elementFallback,
    leafFallback,
    elements,
    leafs,
  };

  // Render content using React utilities
  const renderedElements = renderContent(nodes, renderConfig);

  return <>{renderedElements}</>;
};

// Set display name for easier debugging in React DevTools
RichText.displayName = 'RichText';
