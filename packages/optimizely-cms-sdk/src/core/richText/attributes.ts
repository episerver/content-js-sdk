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
import type { ImageElement, LinkElement } from '../../components/richText/renderer.js';

/**
 * CSS properties that should be moved to the style object
 * These are properties that are primarily CSS styling properties and not valid HTML attributes
 */
export const CSS_PROPERTIES = new Set([
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
export function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** Properties that can be either HTML attributes or CSS properties depending on context */
export const DUAL_PURPOSE_PROPERTIES = new Set(['border', 'width', 'height']);

/** Element types that should treat dual-purpose properties as HTML attributes */
export const HTML_ATTRIBUTE_ELEMENTS = new Set(['table', 'img', 'input', 'canvas']);

/** True when a dual-purpose key is an HTML attribute on this element rather than a style. */
export const isHtmlAttributeContext = (key: string, elementType?: string): boolean =>
  DUAL_PURPOSE_PROPERTIES.has(key.toLowerCase()) &&
  !!elementType &&
  HTML_ATTRIBUTE_ELEMENTS.has(elementType);

/**
 * Resolves a key to the CSS property it names, or `undefined` if it names none.
 *
 * Also resolves old CMS shorthand keys missing the "text-" prefix
 * (e.g. "decoration" -> "text-decoration").
 */
export function resolveCssProperty(key: string): string | undefined {
  const lowerKey = key.toLowerCase();

  return (
    CSS_PROPERTIES.has(lowerKey) ? lowerKey
    : CSS_PROPERTIES.has(`text-${lowerKey}`) ? `text-${lowerKey}`
    : undefined
  );
}

/**
 * Parses an inline style string into camelCased declarations
 * e.g., "font-size: 14px; color: red" -> { fontSize: '14px', color: 'red' }
 */
export function parseStyleString(styleString: string): Record<string, string> {
  if (!styleString || typeof styleString !== 'string') return {};

  return styleString.split(';').reduce<Record<string, string>>((acc, declaration) => {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) return acc;

    const property = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();

    if (!property || !value) return acc;

    return { ...acc, [kebabToCamelCase(property)]: value };
  }, {});
}

/** The attributes a link element contributes, on top of its generic ones. */
export const getLinkAttributes = (element: LinkElement) => ({
  href: element.url,
  target: element.target,
  rel: element.rel,
  title: element.title,
});

/**
 * The attributes an image element contributes, with the preview token applied.
 *
 * Reading the token throws when no context adapter is configured, which is a
 * legitimate state for an application that never previews.
 */
export function getImageAttributes(element: ImageElement) {
  let previewToken: string | undefined;

  try {
    previewToken = getContextData('previewToken');
  } catch {
    previewToken = undefined;
  }

  return {
    src: appendToken(element.url, previewToken),
    alt: element.alt,
    title: element.title,
    width: element.width,
    height: element.height,
    loading: element.loading,
  };
}
