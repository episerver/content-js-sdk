import React from 'react';
import type { PropsWithChildren, JSX } from 'react';
import {
  defaultElementTypeMap,
  defaultMarkTypeMap,
} from '../../components/richText/renderer.js';
import type {
  Node,
  Text,
  Element,
  ElementType,
  MarkType,
} from '../../components/richText/renderer.js';

/**
 * Props for React element renderer components
 */
export interface ElementRendererProps extends PropsWithChildren {
  element: Element;
  attributes?: Record<string, unknown>;
  text?: string; // Enhanced API - direct text access (optional for backward compatibility)
}

/**
 * Better named alias for ElementRendererProps - more intuitive and developer-friendly
 * Use this for new code: ({ text, attributes, element }: ElementProps) => JSX.Element
 */
export type ElementProps = ElementRendererProps;

/**
 * Props for React leaf renderer components
 */
export interface LeafRendererProps extends PropsWithChildren {
  leaf: Text;
  attributes?: Record<string, unknown>;
  text?: string; // Enhanced API - direct text access (optional for backward compatibility)
}

/**
 * Better named alias for LeafRendererProps - more intuitive and developer-friendly
 * Use this for new code: ({ text, attributes, leaf }: LeafProps) => JSX.Element
 */
export type LeafProps = LeafRendererProps;

/**
 * React component for rendering Slate elements
 */
export type ElementRenderer = React.ComponentType<ElementRendererProps>;

/**
 * Better named alias for ElementRenderer - more intuitive and developer-friendly
 * Use this for new code: const MyComponent: ElementComponent = ({ text, attributes }) => JSX.Element
 */
export type ElementComponent = ElementRenderer;

/**
 * React component for rendering Slate text leaves
 */
export type LeafRenderer = React.ComponentType<LeafRendererProps>;

/**
 * Better named alias for LeafRenderer - more intuitive and developer-friendly
 * Use this for new code: const MyComponent: LeafComponent = ({ text, attributes }) => JSX.Element
 */
export type LeafComponent = LeafRenderer;

/**
 * Mapping from element types to React renderer components
 * Provides IntelliSense for known element types while allowing custom types
 */
export type ElementMap = {
  [K in ElementType]?: ElementRenderer;
} & {
  [key: string]: ElementRenderer;
};

/**
 * Mapping from leaf mark types to React renderer components
 * Provides IntelliSense for known mark types while allowing custom types
 */
export type LeafMap = {
  [K in MarkType]?: LeafRenderer;
} & {
  [key: string]: LeafRenderer;
};

/**
 * Props for the main React RichText component
 */
export interface RichTextProps {
  /**
   * Slate.js compatible JSON content to render
   */
  content?: {
    type: 'richText';
    children: Node[];
  };

  /**
   * Custom React components for rendering elements by type
   */
  elements?: ElementMap;

  /**
   * Custom React components for rendering text marks
   */
  leafs?: LeafMap;

  /**
   * Fallback element type when no custom renderer is found
   */
  elementFallback?: string;

  /**
   * Fallback leaf element type when no custom renderer is found
   */
  leafFallback?: string;

  /**
   * Whether to decode HTML entities in text content
   */
  decodeHtmlEntities?: boolean;
}

/**
 * Utility type for Slate.js content arrays
 */
export type Content = Node[];

/**
 * Configuration for HTML component creation
 */
export interface HtmlComponentConfig {
  /**
   * Whether the element is self-closing (like <img>, <br>)
   */
  selfClosing?: boolean;

  /**
   * Default CSS class to apply
   */
  className?: string;

  /**
   * Additional HTML attributes to apply
   */
  attributes?: Record<string, unknown>;
}

/**
 * Converts framework-agnostic attributes to React props
 */
function toReactProps(
  attributes: Record<string, unknown>
): Record<string, unknown> {
  const reactProps = { ...attributes };

  // Convert class to className for React
  if ('class' in reactProps) {
    reactProps.className = reactProps.class;
    delete reactProps.class;
  }

  return reactProps;
}

/**
 * Creates a React component that renders an HTML element
 */
export function createHtmlComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T,
  config: HtmlComponentConfig = {}
): ElementRenderer {
  const Component: ElementRenderer = ({ children, attributes }) => {
    // Convert to React props and merge with config
    const reactProps = toReactProps(attributes || {});
    const mergedProps = {
      ...reactProps,
      ...config.attributes,
      className:
        [reactProps.className, config.className].filter(Boolean).join(' ') ||
        undefined,
    };

    // We don't pass children to self-closing elements
    if (config.selfClosing) {
      return React.createElement(tag, mergedProps);
    }

    return React.createElement(tag, mergedProps, children);
  };

  Component.displayName = `HtmlComponent(${tag})`;
  return Component;
}

/**
 * Creates a React component that renders a text leaf with formatting
 */
export function createLeafComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T,
  config: HtmlComponentConfig = {}
): LeafRenderer {
  const Component: LeafRenderer = ({ children, attributes }) => {
    // Convert to React props and merge with config
    const reactProps = toReactProps(attributes || {});
    const mergedProps = {
      ...reactProps,
      ...config.attributes,
      className:
        [reactProps.className, config.className].filter(Boolean).join(' ') ||
        undefined,
    };

    return React.createElement(tag, mergedProps, children);
  };

  Component.displayName = `LeafComponent(${tag})`;
  return Component;
}

/**
 * Generate complete element map from core defaults
 */
export function generateDefaultElements(): ElementMap {
  const elementMap: ElementMap = {};

  Object.entries(defaultElementTypeMap).forEach(([type, config]) => {
    elementMap[type] = createHtmlComponent(
      config.tag as keyof JSX.IntrinsicElements,
      config.config
    );
  });

  return elementMap;
}

/**
 * Generate complete leaf map from core defaults
 */
export function generateDefaultLeafs(): LeafMap {
  const leafMap: LeafMap = {};

  Object.entries(defaultMarkTypeMap).forEach(([mark, tag]) => {
    leafMap[mark] = createLeafComponent(tag as keyof JSX.IntrinsicElements);
  });

  return leafMap;
}
