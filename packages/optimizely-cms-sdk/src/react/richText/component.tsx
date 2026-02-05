import React from 'react';
import {
  generateDefaultElements,
  generateDefaultLeafs,
  type RichTextProps,
} from './lib.js';
import { createReactRenderer } from './renderer.js';

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
  decodeHtmlEntities = true,
  ...htmlAttributes
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
    elements,
    leafs,
  };

  // Create renderer instance and render content
  const renderer = createReactRenderer(renderConfig);
  const renderedElements = renderer.render(nodes);

  // If HTML attributes are provided (e.g., from pa()), wrap in div
  if (Object.keys(htmlAttributes).length > 0) {
    return <div {...htmlAttributes}>{renderedElements}</div>;
  }

  return <>{renderedElements}</>;
};

// Set display name for easier debugging in React DevTools
RichText.displayName = 'RichText';
