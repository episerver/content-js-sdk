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
  type LinkElement,
  type ImageElement,
  type TableElement,
  type TableCellElement,
} from '../../components/richText/renderer.js';
import { getImageAttributes, getLinkAttributes, splitAttributes } from '../../core/richText/attributes.js';

/**
 * React-specific element renderer props (extends shared props with React children)
 */
export interface ElementRendererProps extends BaseElementRendererProps, PropsWithChildren {}

/**
 * React-specific props for link elements with type safety
 */
export interface LinkElementProps extends Omit<BaseElementRendererProps, 'element'>, PropsWithChildren {
  element: LinkElement;
}

/**
 * React-specific props for image elements with type safety
 */
export interface ImageElementProps extends Omit<BaseElementRendererProps, 'element'>, PropsWithChildren {
  element: ImageElement;
}

/**
 * React-specific props for table elements with type safety
 */
export interface TableElementProps extends Omit<BaseElementRendererProps, 'element'>, PropsWithChildren {
  element: TableElement;
}

/**
 * React-specific props for table cell elements with type safety
 */
export interface TableCellElementRendererProps extends Omit<BaseElementRendererProps, 'element'>, PropsWithChildren {
  element: TableCellElement;
}

/**
 * Prop type used for custom Element components
 */
export type ElementProps = ElementRendererProps;

/**
 * React-specific leaf renderer props (extends shared props with React children)
 */
export interface LeafRendererProps extends BaseLeafRendererProps, PropsWithChildren {}

/**
 * Prop type used for custom Leaf components
 */
export type LeafProps = LeafRendererProps;

/**
 * React component for rendering Slate elements
 */
export type ElementRenderer = React.ComponentType<ElementRendererProps>;

/**
 * React component for rendering link elements with type safety
 */
export type LinkElementRenderer = React.ComponentType<LinkElementProps>;

/**
 * React component for rendering image elements with type safety
 */
export type ImageElementRenderer = React.ComponentType<ImageElementProps>;

/**
 * React component for rendering table elements with type safety
 */
export type TableElementRenderer = React.ComponentType<TableElementProps>;

/**
 * React component for rendering table cell elements with type safety
 */
export type TableCellElementRenderer = React.ComponentType<TableCellElementRendererProps>;

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
  extends RichTextPropsBase<ElementRenderer, LeafRenderer>, Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {}

/**
 * Maps HTML attribute names to React JSX attribute names
 * Only includes attributes that actually need conversion (camelCase changes or reserved keywords)
 * Attributes that work as-is in React are omitted for better performance
 */
export const HTML_TO_REACT_ATTRS: Record<string, string> = {
  // Reserved keywords (must be mapped)
  class: 'className',
  for: 'htmlFor',

  // Table attributes that need camelCase conversion
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',

  // Common form/input attributes that need camelCase conversion
  tabindex: 'tabIndex',
  'tab-index': 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  contenteditable: 'contentEditable',
  'content-editable': 'contentEditable',
  spellcheck: 'spellCheck',
  novalidate: 'noValidate',

  // Media attributes commonly used in rich text
  crossorigin: 'crossOrigin',
  usemap: 'useMap',
  allowfullscreen: 'allowFullScreen',
  frameborder: 'frameBorder',
  playsinline: 'playsInline',
  srcset: 'srcSet',
  srcdoc: 'srcDoc',
  srclang: 'srcLang',

  // Meta attributes
  'accept-charset': 'acceptCharset',
  'http-equiv': 'httpEquiv',
  charset: 'charSet',
  datetime: 'dateTime',
  hreflang: 'hrefLang',

  // Form attributes
  formaction: 'formAction',
  formenctype: 'formEnctype',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  enctype: 'encType',

  // Other attributes that require camelCase conversion
  accesskey: 'accessKey',
  autocapitalize: 'autoCapitalize',
  referrerpolicy: 'referrerPolicy',
} as const;

/**
 * Converts framework-agnostic attributes to React props
 * Handles HTML attribute to React JSX attribute conversion and CSS properties
 */
export function toReactProps(attributes: Record<string, unknown>, elementType?: string): Record<string, unknown> {
  const { attributes: htmlAttributes, style } = splitAttributes(attributes, elementType);

  const reactProps = Object.entries(htmlAttributes).reduce<Record<string, unknown>>((acc, [key, value]) => {
    const reactKey = HTML_TO_REACT_ATTRS[key.toLowerCase()] || key;
    // `class` and `className` both land on className
    if (reactKey === 'className' && acc.className) return { ...acc, className: `${acc.className} ${value}` };
    return { ...acc, [reactKey]: value };
  }, {});

  if (Object.keys(style).length === 0) return reactProps;
  return { ...reactProps, style: { ...((reactProps.style as Record<string, string>) || {}), ...style } };
}

/**
 * Creates a React component that renders an HTML element
 */
export function createHtmlComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T,
  config: HtmlComponentConfig = {},
): ElementRenderer {
  const Component: ElementRenderer = ({ children, attributes, element }) => {
    // Convert to React props and merge with config, passing element type for context
    const reactProps = toReactProps(attributes || {}, tag as string);
    const mergedProps = {
      ...reactProps,
      ...config.attributes,
      className: [reactProps.className, config.className].filter(Boolean).join(' ') || undefined,
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
 * Creates a type-safe React component for link elements
 */
export function createLinkComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T = 'a' as T,
  config: HtmlComponentConfig = {},
): LinkElementRenderer {
  const Component: LinkElementRenderer = ({ children, attributes, element }) => {
    // Convert to React props and merge with config
    const reactProps = toReactProps(attributes || {}, tag as string);

    const linkProps = getLinkAttributes(element);

    const mergedProps = {
      ...reactProps,
      ...linkProps,
      ...config.attributes,
      className: [reactProps.className, config.className].filter(Boolean).join(' ') || undefined,
    };

    return React.createElement(tag, mergedProps, children);
  };

  Component.displayName = `LinkComponent(${tag})`;
  return Component;
}

/**
 * Creates a type-safe React component for image elements
 */
export function createImageComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T = 'img' as T,
  config: HtmlComponentConfig = {},
): ImageElementRenderer {
  const Component: ImageElementRenderer = ({ children, attributes, element }) => {
    // Convert to React props and merge with config
    const reactProps = toReactProps(attributes || {}, tag as string);

    // Reads the preview token from context, which React.cache keeps per request.
    const imageProps = getImageAttributes(element);

    const mergedProps = {
      ...reactProps,
      ...imageProps,
      ...config.attributes,
      className: [reactProps.className, config.className].filter(Boolean).join(' ') || undefined,
    };

    // Image elements are self-closing and cannot have children
    return React.createElement(tag, mergedProps);
  };

  Component.displayName = `ImageComponent(${tag})`;
  return Component;
}

/**
 * Creates a type-safe React component for table elements
 */
export function createTableComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T = 'table' as T,
  config: HtmlComponentConfig = {},
): TableElementRenderer {
  const Component: TableElementRenderer = ({ children, attributes, element }) => {
    // Convert to React props and merge with config
    const reactProps = toReactProps(attributes || {}, tag as string);

    const mergedProps = {
      ...reactProps,
      ...config.attributes,
      className: [reactProps.className, config.className].filter(Boolean).join(' ') || undefined,
    };

    return React.createElement(tag, mergedProps, children);
  };

  Component.displayName = `TableComponent(${tag})`;
  return Component;
}

/**
 * Creates a type-safe React component for table cell elements
 */
export function createTableCellComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T,
  config: HtmlComponentConfig = {},
): TableCellElementRenderer {
  const Component: TableCellElementRenderer = ({ children, attributes, element }) => {
    // Convert to React props and merge with config
    const reactProps = toReactProps(attributes || {});

    const mergedProps = {
      ...reactProps,
      ...config.attributes,
      className: [reactProps.className, config.className].filter(Boolean).join(' ') || undefined,
    };

    return React.createElement(tag, mergedProps, children);
  };

  Component.displayName = `TableCellComponent(${tag})`;
  return Component;
}

/**
 * Creates a React component that renders a text leaf with formatting
 */
export function createLeafComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T,
  config: HtmlComponentConfig = {},
): LeafRenderer {
  const Component: LeafRenderer = ({ children, attributes }) => {
    // Convert to React props and merge with config
    const reactProps = toReactProps(attributes || {});
    const mergedProps = {
      ...reactProps,
      ...config.attributes,
      className: [reactProps.className, config.className].filter(Boolean).join(' ') || undefined,
    };

    return React.createElement(tag, mergedProps, children);
  };

  Component.displayName = `LeafComponent(${tag})`;
  return Component;
}

/**
 * Generate complete element map from core defaults with type-safe specialized components
 */
export function generateDefaultElements(): ElementMap {
  const elementMap: ElementMap = {};

  Object.entries(defaultElementTypeMap).forEach(([type, config]) => {
    // Use specialized components for specific element types
    switch (type) {
      case 'link':
        elementMap[type] = createLinkComponent('a', config.config) as ElementRenderer;
        break;
      case 'image':
        elementMap[type] = createImageComponent('img', config.config) as ElementRenderer;
        break;
      case 'table':
        elementMap[type] = createTableComponent('table', config.config) as ElementRenderer;
        break;
      case 'td':
        elementMap[type] = createTableCellComponent('td', config.config) as ElementRenderer;
        break;
      case 'th':
        elementMap[type] = createTableCellComponent('th', config.config) as ElementRenderer;
        break;
      default:
        elementMap[type] = createHtmlComponent(config.tag as keyof JSX.IntrinsicElements, config.config);
        break;
    }
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
