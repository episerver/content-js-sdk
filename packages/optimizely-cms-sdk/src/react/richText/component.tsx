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
  elements = {},
  leafs = {},
  elementFallback,
  leafFallback,
  decodeHtmlEntities = true,
  safeInlineFallback = true,
}) => {
  const nodes = Array.isArray(content?.children) ? content.children : [];

  const renderConfig = {
    decodeHtmlEntities,
    elementFallback,
    leafFallback,
    safeInlineFallback,
    elements,
    leafs,
  };

  // Create renderer instance and render content
  const renderer = createReactRenderer(renderConfig);
  const renderedElements = renderer.render(nodes);

  return <>{renderedElements}</>;
};

// Set display name for easier debugging in React DevTools
RichText.displayName = 'RichText';
