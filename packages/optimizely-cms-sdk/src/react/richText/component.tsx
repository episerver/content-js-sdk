import React from 'react';
import {
  renderContent,
  generateDefaultElements,
  generateDefaultLeafs,
  type RichTextProps,
} from './lib.js';

/**
 * React component for rendering RichText JSON content
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

RichText.displayName = 'RichText';
