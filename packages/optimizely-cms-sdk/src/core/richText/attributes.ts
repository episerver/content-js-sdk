/**
 * Framework-neutral classification of rich-text element attributes.
 *
 * The CMS emits HTML-ish attributes on rich-text nodes, some of which are really
 * CSS declarations. Deciding which is which does not depend on the framework;
 * only the shape they are finally written in does, so each binding maps the
 * result onto its own prop names.
 *
 * @module
 */

import { appendToken } from '../../util/preview.js';
import { getContextData } from '../../context/config.js';
import {
  buildRenderTree,
  defaultElementTypeMap,
  defaultMarkTypeMap,
  resolveRichTextNodes,
  type ImageElement,
  type LinkElement,
  type RenderNode,
  type RichTextPropsBase,
} from '../../components/richText/renderer.js';

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

/** Properties that can be either HTML attributes or CSS properties depending on context */
const DUAL_PURPOSE_PROPERTIES = new Set(['border', 'width', 'height']);

/** Element types that should treat dual-purpose properties as HTML attributes */
const HTML_ATTRIBUTE_ELEMENTS = new Set(['table', 'img', 'input', 'canvas']);

const kebabToCamelCase = (str: string): string =>
  str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

const isHtmlAttributeContext = (key: string, elementType?: string): boolean =>
  DUAL_PURPOSE_PROPERTIES.has(key.toLowerCase()) &&
  !!elementType &&
  HTML_ATTRIBUTE_ELEMENTS.has(elementType);

// Also resolves old CMS shorthand keys missing the "text-" prefix ("decoration").
const resolveCssProperty = (key: string): string | undefined => {
  const lowerKey = key.toLowerCase();
  if (DUAL_PURPOSE_PROPERTIES.has(lowerKey) || CSS_PROPERTIES.has(lowerKey)) return lowerKey;
  if (CSS_PROPERTIES.has(`text-${lowerKey}`)) return `text-${lowerKey}`;
  return undefined;
};

const parseStyleString = (styleString: string): Record<string, string> =>
  styleString.split(';').reduce<Record<string, string>>((acc, declaration) => {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) return acc;

    const property = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();

    if (!property || !value) return acc;

    return { ...acc, [kebabToCamelCase(property)]: value };
  }, {});

export type SplitAttributes = {
  /** HTML attributes, under the names the CMS gave them. */
  attributes: Record<string, unknown>;
  /** CSS declarations, camelCased, including any parsed from a `style` string. */
  style: Record<string, string>;
};

/**
 * Separates a rich-text node's attributes into HTML attributes and CSS
 * declarations. `border`, `width` and `height` stay attributes on
 * `table`/`img`/`input`/`canvas` and become styles everywhere else.
 */
export function splitAttributes(
  attributes: Record<string, unknown>,
  elementType?: string,
): SplitAttributes {
  return Object.entries(attributes).reduce<SplitAttributes>(
    (acc, [key, value]) => {
      const cssKey = isHtmlAttributeContext(key, elementType) ? undefined : resolveCssProperty(key);

      if (cssKey)
        return { ...acc, style: { ...acc.style, [kebabToCamelCase(cssKey)]: String(value) } };
      if (key === 'style' && typeof value === 'string')
        return { ...acc, style: { ...acc.style, ...parseStyleString(value) } };
      return { ...acc, attributes: { ...acc.attributes, [key]: value } };
    },
    { attributes: {}, style: {} },
  );
}

/** The attributes a link element contributes, on top of its generic ones. */
export const getLinkAttributes = (element: LinkElement) => ({
  href: element.url,
  target: element.target,
  rel: element.rel,
  title: element.title,
});

// Throws when no context adapter is configured, a legitimate state for an app that never previews.
function readPreviewToken(): string | undefined {
  try {
    return getContextData('previewToken');
  } catch {
    return undefined;
  }
}

/** The attributes an image element contributes, with the preview token applied. */
export function getImageAttributes(element: ImageElement) {
  return {
    src: appendToken(element.url, readPreviewToken()),
    alt: element.alt,
    title: element.title,
    width: element.width,
    height: element.height,
    loading: element.loading,
  };
}

/** The render tree for rich-text content, given as the document object or its JSON string. */
export const getRichTextTree = (
  content: RichTextPropsBase['content'],
  { decodeHtmlEntities = true }: { decodeHtmlEntities?: boolean } = {},
): RenderNode[] => buildRenderTree(resolveRichTextNodes(content), { decodeHtmlEntities });

export type RichTextElement = SplitAttributes & {
  tag: string;
  /** Rendered without children, like `img` or `br`. */
  selfClosing: boolean;
};

/** The tag, attributes and styles for a rich-text element node, with the image preview token applied. */
export function getRichTextElement(node: RenderNode): RichTextElement {
  const elementType = node.elementType?.toLowerCase() ?? '';
  const { tag, config } = defaultElementTypeMap[elementType] ?? { tag: 'span' };
  const source = node.attributes ?? {};
  // `buildRenderTree` has already mapped the image `url` to `src`.
  const attributes =
    elementType === 'image' && source.src ?
      { ...source, src: appendToken(String(source.src), readPreviewToken()) }
    : source;

  return { tag, selfClosing: !!config?.selfClosing, ...splitAttributes(attributes, tag) };
}

/** The tag for a rich-text mark such as `bold`, or `span` when it is unknown. */
export const getMarkTag = (mark: string): string =>
  defaultMarkTypeMap[mark.toLowerCase()] ?? 'span';

const toKebabCase = (property: string) =>
  property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

/** Writes a camelCased style object as a CSS declaration string, or `undefined` when empty. */
export const toStyleString = (style: Record<string, string>): string | undefined =>
  Object.entries(style)
    .map(([property, value]) => `${toKebabCase(property)}: ${value}`)
    .join('; ') || undefined;
