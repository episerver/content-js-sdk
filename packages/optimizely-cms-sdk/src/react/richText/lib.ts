import React from 'react';
import type { PropsWithChildren, JSX } from 'react';
import {
  defaultElementTypeMap,
  defaultMarkTypeMap,
  type BaseElementRendererProps,
  type BaseLeafRendererProps,
  type BaseElementMap,
  type BaseLeafMap,
  type HtmlComponentConfig,
  type RichTextPropsBase,
} from '../../components/richText/renderer.js';

/**
 * React-specific element renderer props (extends shared props with React children)
 */
export interface ElementRendererProps
  extends BaseElementRendererProps,
    PropsWithChildren {}

/**
 * Prop type used for custom Element components
 */
export type ElementProps = ElementRendererProps;

/**
 * React-specific leaf renderer props (extends shared props with React children)
 */
export interface LeafRendererProps
  extends BaseLeafRendererProps,
    PropsWithChildren {}

/**
 * Prop type used for custom Leaf components
 */
export type LeafProps = LeafRendererProps;

/**
 * React component for rendering Slate elements
 */
export type ElementRenderer = React.ComponentType<ElementRendererProps>;

/**
 * React component for rendering Slate text leaves
 */
export type LeafRenderer = React.ComponentType<LeafRendererProps>;

/**
 * React-specific mapping types (specializes generic types with React components)
 */
export type ElementMap = BaseElementMap<ElementRenderer>;

/**
 * React-specific mapping types (specializes generic types with React components)
 */
export type LeafMap = BaseLeafMap<LeafRenderer>;

/**
 * React-specific RichText props
 */
export interface RichTextProps
  extends RichTextPropsBase<ElementRenderer, LeafRenderer> {}

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
