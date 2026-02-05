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

/**
 * React-specific element renderer props (extends shared props with React children)
 */
export interface ElementRendererProps
  extends BaseElementRendererProps,
    PropsWithChildren {}

/**
 * React-specific props for link elements with type safety
 */
export interface LinkElementProps
  extends Omit<BaseElementRendererProps, 'element'>,
    PropsWithChildren {
  element: LinkElement;
}

/**
 * React-specific props for image elements with type safety
 */
export interface ImageElementProps
  extends Omit<BaseElementRendererProps, 'element'>,
    PropsWithChildren {
  element: ImageElement;
}

/**
 * React-specific props for table elements with type safety
 */
export interface TableElementProps
  extends Omit<BaseElementRendererProps, 'element'>,
    PropsWithChildren {
  element: TableElement;
}

/**
 * React-specific props for table cell elements with type safety
 */
export interface TableCellElementRendererProps
  extends Omit<BaseElementRendererProps, 'element'>,
    PropsWithChildren {
  element: TableCellElement;
}

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
export type TableCellElementRenderer =
  React.ComponentType<TableCellElementRendererProps>;

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
  extends RichTextPropsBase<ElementRenderer, LeafRenderer>,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {}

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
 * CSS properties that should be moved to the style object
 * These are properties that are primarily CSS styling properties and not valid HTML attributes
 */
const CSS_PROPERTIES = new Set([
  // Layout & Sizing (excluding width/height which can be HTML attributes)
  'min-width',
  'max-width',
  'min-height',
  'max-height',

  // Spacing
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',

  // Typography
  'font',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-align',
  'text-decoration',
  'text-transform',
  'text-indent',
  'text-shadow',
  'vertical-align',

  // Colors & Backgrounds
  'color',
  'background',
  'background-color',
  'background-image',
  'background-repeat',
  'background-position',
  'background-size',
  'background-attachment',
  'background-clip',
  'background-origin',

  // Borders (CSS-specific border properties, including 'border' for general use)
  'border',
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',

  // Outline
  'outline',
  'outline-width',
  'outline-style',
  'outline-color',
  'outline-offset',

  // Positioning
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
  'float',
  'clear',

  // Display & Visibility
  'display',
  'visibility',
  'opacity',
  'overflow',
  'overflow-x',
  'overflow-y',
  'clip',
  'clip-path',

  // Flexbox
  'flex',
  'flex-direction',
  'flex-wrap',
  'flex-flow',
  'justify-content',
  'align-items',
  'align-content',
  'align-self',
  'flex-grow',
  'flex-shrink',
  'flex-basis',

  // Grid
  'grid',
  'grid-template',
  'grid-template-rows',
  'grid-template-columns',
  'grid-template-areas',
  'grid-area',
  'grid-row',
  'grid-column',
  'grid-gap',
  'gap',
  'row-gap',
  'column-gap',

  // Text Layout
  'white-space',
  'word-wrap',
  'word-break',
  'overflow-wrap',
  'hyphens',
  'text-overflow',
  'direction',
  'unicode-bidi',
  'writing-mode',

  // Visual Effects
  'box-shadow',
  'text-shadow',
  'filter',
  'backdrop-filter',
  'transform',
  'transform-origin',
  'perspective',
  'perspective-origin',

  // Animation & Transitions
  'transition',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
  'animation',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'animation-iteration-count',
  'animation-direction',
  'animation-fill-mode',
  'animation-play-state',

  // Interaction
  'cursor',
  'pointer-events',
  'user-select',
  'resize',
  'scroll-behavior',

  // Tables (CSS-specific table properties, excluding cellpadding/cellspacing which are HTML attributes)
  'table-layout',
  'border-collapse',
  'border-spacing',
  'caption-side',
  'empty-cells',

  // Lists
  'list-style',
  'list-style-type',
  'list-style-position',
  'list-style-image',

  // Modern CSS
  'aspect-ratio',
  'object-fit',
  'object-position',
  'overscroll-behavior',
  'scroll-snap-type',
  'scroll-snap-align',
  'scroll-margin',
  'scroll-padding',

  // Content & Counters
  'content',
  'quotes',
  'counter-reset',
  'counter-increment',
]);

/**
 * Converts kebab-case to camelCase
 * e.g., 'font-size' -> 'fontSize', 'background-color' -> 'backgroundColor'
 */
function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Properties that can be either HTML attributes or CSS properties depending on context
 */
const DUAL_PURPOSE_PROPERTIES = new Set(['border', 'width', 'height']);

/**
 * Element types that should treat dual-purpose properties as HTML attributes
 */
const HTML_ATTRIBUTE_ELEMENTS = new Set(['table', 'img', 'input', 'canvas']);

/**
 * Converts framework-agnostic attributes to React props
 * Handles HTML attribute to React JSX attribute conversion and CSS properties
 */
export function toReactProps(
  attributes: Record<string, unknown>,
  elementType?: string
): Record<string, unknown> {
  const reactProps: Record<string, unknown> = {};
  const styleProps: Record<string, string> = {};

  for (const [key, value] of Object.entries(attributes)) {
    // Handle dual-purpose properties based on element context
    if (DUAL_PURPOSE_PROPERTIES.has(key.toLowerCase())) {
      if (elementType && HTML_ATTRIBUTE_ELEMENTS.has(elementType)) {
        // Treat as HTML attribute for specific elements
        const reactKey = HTML_TO_REACT_ATTRS[key.toLowerCase()] || key;
        reactProps[reactKey] = value;
        continue;
      } else {
        // Treat as CSS property for other elements
        const camelKey = kebabToCamelCase(key);
        styleProps[camelKey] = String(value);
        continue;
      }
    }

    // Handle other CSS properties - move them to style object
    if (CSS_PROPERTIES.has(key.toLowerCase())) {
      const camelKey = kebabToCamelCase(key);
      styleProps[camelKey] = String(value);
      continue;
    }

    // Convert HTML attribute names to React prop names
    const reactKey = HTML_TO_REACT_ATTRS[key.toLowerCase()] || key;

    // Special handling for existing style attribute (if it's a string, parse it to object)
    if (reactKey === 'style' && typeof value === 'string') {
      const parsedStyle = parseStyleString(value);
      Object.assign(styleProps, parsedStyle);
    } else if (reactKey === 'className' && reactProps.className) {
      // Merge multiple class/className attributes
      reactProps.className = `${reactProps.className} ${value}`;
    } else {
      reactProps[reactKey] = value;
    }
  }

  // Add style object if we have CSS properties
  if (Object.keys(styleProps).length > 0) {
    reactProps.style = {
      ...((reactProps.style as Record<string, string>) || {}),
      ...styleProps,
    };
  }

  return reactProps;
}

/**
 * Parses inline style string to React style object
 * e.g., "font-size: 14px; color: red" -> { fontSize: '14px', color: 'red' }
 */
function parseStyleString(styleString: string): Record<string, string> {
  const styleObj: Record<string, string> = {};

  if (!styleString || typeof styleString !== 'string') {
    return styleObj;
  }

  styleString.split(';').forEach((declaration) => {
    const colonIndex = declaration.indexOf(':');

    if (colonIndex === -1) return;

    const property = declaration.slice(0, colonIndex).trim();

    const value = declaration.slice(colonIndex + 1).trim();

    if (property && value) {
      // Convert kebab-case to camelCase for CSS properties
      const camelProperty = kebabToCamelCase(property);
      styleObj[camelProperty] = value;
    }
  });

  return styleObj;
}

/**
 * Creates a React component that renders an HTML element
 */
export function createHtmlComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T,
  config: HtmlComponentConfig = {}
): ElementRenderer {
  const Component: ElementRenderer = ({ children, attributes, element }) => {
    // Convert to React props and merge with config, passing element type for context
    const reactProps = toReactProps(attributes || {}, tag as string);
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
 * Creates a type-safe React component for link elements
 */
export function createLinkComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T = 'a' as T,
  config: HtmlComponentConfig = {}
): LinkElementRenderer {
  const Component: LinkElementRenderer = ({
    children,
    attributes,
    element,
  }) => {
    // Convert to React props and merge with config
    const reactProps = toReactProps(attributes || {}, tag as string);

    // Type-safe access to link properties
    const linkProps = {
      href: element.url,
      target: element.target,
      rel: element.rel,
      title: element.title,
    };

    const mergedProps = {
      ...reactProps,
      ...linkProps,
      ...config.attributes,
      className:
        [reactProps.className, config.className].filter(Boolean).join(' ') ||
        undefined,
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
  config: HtmlComponentConfig = {}
): ImageElementRenderer {
  const Component: ImageElementRenderer = ({
    children,
    attributes,
    element,
  }) => {
    // Convert to React props and merge with config
    const reactProps = toReactProps(attributes || {}, tag as string);

    // Type-safe access to image properties
    const imageProps = {
      src: element.url,
      alt: element.alt,
      title: element.title,
      width: element.width,
      height: element.height,
      loading: element.loading,
    };

    const mergedProps = {
      ...reactProps,
      ...imageProps,
      ...config.attributes,
      className:
        [reactProps.className, config.className].filter(Boolean).join(' ') ||
        undefined,
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
  config: HtmlComponentConfig = {}
): TableElementRenderer {
  const Component: TableElementRenderer = ({
    children,
    attributes,
    element,
  }) => {
    // Convert to React props and merge with config
    const reactProps = toReactProps(attributes || {}, tag as string);

    const mergedProps = {
      ...reactProps,
      ...config.attributes,
      className:
        [reactProps.className, config.className].filter(Boolean).join(' ') ||
        undefined,
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
  config: HtmlComponentConfig = {}
): TableCellElementRenderer {
  const Component: TableCellElementRenderer = ({
    children,
    attributes,
    element,
  }) => {
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

  Component.displayName = `TableCellComponent(${tag})`;
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
 * Generate complete element map from core defaults with type-safe specialized components
 */
export function generateDefaultElements(): ElementMap {
  const elementMap: ElementMap = {};

  Object.entries(defaultElementTypeMap).forEach(([type, config]) => {
    // Use specialized components for specific element types
    switch (type) {
      case 'link':
        elementMap[type] = createLinkComponent(
          'a',
          config.config
        ) as ElementRenderer;
        break;
      case 'image':
        elementMap[type] = createImageComponent(
          'img',
          config.config
        ) as ElementRenderer;
        break;
      case 'table':
        elementMap[type] = createTableComponent(
          'table',
          config.config
        ) as ElementRenderer;
        break;
      case 'td':
        elementMap[type] = createTableCellComponent(
          'td',
          config.config
        ) as ElementRenderer;
        break;
      case 'th':
        elementMap[type] = createTableCellComponent(
          'th',
          config.config
        ) as ElementRenderer;
        break;
      default:
        elementMap[type] = createHtmlComponent(
          config.tag as keyof JSX.IntrinsicElements,
          config.config
        );
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
