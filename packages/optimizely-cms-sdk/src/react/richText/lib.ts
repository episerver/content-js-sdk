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
  extends RichTextPropsBase<ElementRenderer, LeafRenderer> {}

/**
 * Converts kebab-case to camelCase
 * e.g., 'font-size' -> 'fontSize', 'background-color' -> 'backgroundColor'
 */
function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
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

  // Convert specific known HTML attributes to React camelCase
  const attributeMapping: Record<string, string> = {
    // Table attributes
    cellpadding: 'cellPadding',
    cellspacing: 'cellSpacing',
    rowspan: 'rowSpan',
    colspan: 'colSpan',
    // Form attributes
    maxlength: 'maxLength',
    minlength: 'minLength',
    readonly: 'readOnly',
    tabindex: 'tabIndex',
    // Media attributes
    autoplay: 'autoPlay',
    crossorigin: 'crossOrigin',
    // Other common attributes
    contenteditable: 'contentEditable',
    spellcheck: 'spellCheck',
    datetime: 'dateTime',
    acceptcharset: 'acceptCharset',
    accesskey: 'accessKey',
    allowfullscreen: 'allowFullScreen',
    autofocus: 'autoFocus',
    autocomplete: 'autoComplete',
    enctype: 'encType',
    formaction: 'formAction',
    formenctype: 'formEncType',
    formmethod: 'formMethod',
    formnovalidate: 'formNoValidate',
    formtarget: 'formTarget',
    frameborder: 'frameBorder',
    marginheight: 'marginHeight',
    marginwidth: 'marginWidth',
    novalidate: 'noValidate',
    usemap: 'useMap',
  };

  // Apply known attribute mappings
  Object.keys(reactProps).forEach((key) => {
    if (attributeMapping[key]) {
      reactProps[attributeMapping[key]] = reactProps[key];
      delete reactProps[key];
    }
  });

  // Convert kebab-case attributes to camelCase using regex
  // BUT only for known HTML attributes, not CSS properties
  // Preserve data-* and aria-* attributes as-is (React expects these in kebab-case)
  const validHtmlKebabAttributes = new Set([
    'accept-charset',
    'access-key',
    'allow-full-screen',
    'auto-complete',
    'auto-focus',
    'auto-play',
    'cell-padding',
    'cell-spacing',
    'content-editable',
    'cross-origin',
    'date-time',
    'enc-type',
    'form-action',
    'form-enc-type',
    'form-method',
    'form-no-validate',
    'form-target',
    'frame-border',
    'margin-height',
    'margin-width',
    'max-length',
    'min-length',
    'no-validate',
    'read-only',
    'spell-check',
    'tab-index',
    'use-map',
    'font-size',
    'background-color',
  ]);

  Object.keys(reactProps).forEach((key) => {
    if (
      key.includes('-') &&
      /^[a-z][a-z0-9]*(-[a-z][a-z0-9]*)*$/.test(key) &&
      !key.startsWith('data-') &&
      !key.startsWith('aria-') &&
      validHtmlKebabAttributes.has(key)
    ) {
      const camelCaseKey = kebabToCamelCase(key);
      if (camelCaseKey !== key) {
        reactProps[camelCaseKey] = reactProps[key];
        delete reactProps[key];
      }
    }
  });

  return reactProps;
}

/**
 * Creates a React component that renders an HTML element
 */
export function createHtmlComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T,
  config: HtmlComponentConfig = {}
): ElementRenderer {
  const Component: ElementRenderer = ({ children, attributes, element }) => {
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
    const reactProps = toReactProps(attributes || {});

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
    const reactProps = toReactProps(attributes || {});

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
