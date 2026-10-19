/**
 * Stand-in content for a content type, shaped like what Graph returns.
 *
 * A component catalog wants to show every component the application registers,
 * including the ones no editor has created content for yet. This fills each
 * property with a plausible value of the right shape, so a component can be
 * rendered without a CMS round trip.
 *
 * @module
 */

import { getContentType } from '../model/contentTypeRegistry.js';
import { isContentType } from '../model/index.js';
import type { AnyContentType, PermittedTypes } from '../model/contentTypes.js';
import type { AnyProperty } from '../model/properties.js';
import { isBaseMediaType } from '../util/baseTypeUtil.js';

/** How deep nested components and content references are followed. */
const MAX_DEPTH = 3;

/** Fixed so that a preview of the same component is byte-identical each time. */
const MOCK_DATE = '2024-01-01T12:00:00Z';

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod ' +
  'tempor incididunt ut labore et dolore magna aliqua.';

/** The label an editor would see, falling back to the property name. */
const labelOf = (name: string, property: AnyProperty) =>
  property.displayName ?? name;

function contentUrl(path: string) {
  return {
    type: 'simple',
    default: path,
    hierarchical: path,
    internal: path,
    graph: path,
    base: 'https://example.com',
  };
}

/**
 * A self-describing grey placeholder, inline so a preview needs no network and
 * no files to be hosted anywhere.
 */
function placeholderImage(label: string) {
  const safeLabel = label.replace(/[^\w .-]/g, '').slice(0, 40);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">` +
    `<rect width="100%" height="100%" fill="#d8d6dc"/>` +
    `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="sans-serif" font-size="48" fill="#6b6375">${safeLabel}</text>` +
    `</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const keyOf = (type: PermittedTypes | AnyContentType): string =>
  typeof type === 'string' ? type
  : typeof type === 'object' && type && 'key' in type ? (type as { key: string }).key
  : '';

/** The types a `content` or `contentReference` property accepts, as keys. */
function allowedKeys(property: AnyProperty): string[] {
  const p = property as {
    contentType?: PermittedTypes | AnyContentType;
    allowedTypes?: (PermittedTypes | AnyContentType)[];
  };

  const types = p.allowedTypes ?? (p.contentType ? [p.contentType] : []);
  return types.map(keyOf).filter(Boolean);
}

function mockRichText(label: string) {
  return {
    json: [
      {
        type: 'paragraph',
        children: [{ text: `${label}. ${LOREM}` }],
      },
    ],
    html: `<p>${label}. ${LOREM}</p>`,
  };
}

/**
 * A content reference. Media references point at a placeholder image, so an
 * `<img src={ref.url.default}>` renders something visible.
 */
function mockReference(label: string, property: AnyProperty) {
  const isMedia = allowedKeys(property).some(
    key => isBaseMediaType(key) || isBaseMediaType(baseTypeOf(key) ?? ''),
  );

  return {
    key: `mock-${label.toLowerCase().replace(/\W+/g, '-')}`,
    url: contentUrl(isMedia ? placeholderImage(label) : '/example'),
    item: null,
  };
}

function baseTypeOf(key: string): string | undefined {
  const type = getContentType(key);
  return type && 'baseType' in type ? (type.baseType as string) : undefined;
}

function mockProperty(
  name: string,
  property: AnyProperty,
  depth: number,
): unknown {
  const label = labelOf(name, property);
  const enumValues = (property as { enum?: { value: unknown }[] }).enum;

  if (enumValues?.length) return enumValues[0].value;

  switch (property.type) {
    case 'string': {
      // A long field reads as body copy; a short one is more useful naming itself.
      const long = (property.maxLength ?? 0) > 120;
      return long ? `${label}. ${LOREM}` : label;
    }
    case 'boolean':
      return true;
    case 'integer':
    case 'float':
      return property.minimum ?? 1;
    case 'dateTime':
      return MOCK_DATE;
    case 'json':
      return {};
    case 'binary':
      return null;
    case 'url':
      return contentUrl('/example');
    case 'link':
      return {
        text: label,
        title: label,
        target: '_self',
        url: contentUrl('/example'),
      };
    case 'richText':
      return mockRichText(label);
    case 'contentReference':
      return mockReference(label, property);
    case 'content': {
      const nested = allowedKeys(property).map(getContentType).find(isContentType);
      return nested && depth < MAX_DEPTH ? build(nested, depth + 1) : null;
    }
    case 'component': {
      const nested = (property as { contentType?: AnyContentType }).contentType;
      return nested && depth < MAX_DEPTH ? build(nested, depth + 1) : null;
    }
    case 'array': {
      const items = (property as { items: AnyProperty }).items;
      const count = Math.max(property.minItems ?? 0, 2);
      // One level of nesting per item would multiply, so arrays of components
      // are filled at the depth of the array itself.
      return Array.from({ length: count }, () => mockProperty(name, items, depth));
    }
    default:
      return null;
  }
}

/**
 * An empty composition.
 *
 * ponytail: a section or experience is a container, and which components an
 * editor would drop into it is a guess. Rendering the container empty shows
 * its own chrome without inventing content; fill it from a real content item
 * (`?key=`) when the arrangement is what you need to see.
 */
function emptyComposition(key: string) {
  return {
    __typename: 'CompositionStructureNode',
    type: null,
    key: `mock-${key}-composition`,
    nodeType: 'section',
    layoutType: null,
    displayName: key,
    displayTemplateKey: null,
    displaySettings: null,
    nodes: [],
  };
}

/** True when Graph gives the type a composition of its own. */
function holdsComposition(contentType: AnyContentType, baseType: string | undefined) {
  if (baseType === '_section') return true;

  const behaviors = (contentType as { compositionBehaviors?: string[] })
    .compositionBehaviors;
  return Array.isArray(behaviors) && behaviors.includes('sectionEnabled');
}

function build(contentType: AnyContentType, depth: number): Record<string, unknown> {
  const { key, displayName, properties } = contentType as AnyContentType & {
    properties?: Record<string, AnyProperty>;
  };
  const baseType = 'baseType' in contentType ? (contentType.baseType as string) : undefined;

  const values = Object.fromEntries(
    Object.entries(properties ?? {}).map(([name, property]) => [
      name,
      mockProperty(name, property, depth),
    ]),
  );

  return {
    __typename: key,
    ...values,
    // A section reads its composition from `nodes`, lifted out of `composition`
    // when the content is fetched; an experience keeps the field itself.
    ...(holdsComposition(contentType, baseType) ? { nodes: [] } : {}),
    ...(baseType === '_experience' ? { composition: emptyComposition(key) } : {}),
    _metadata: {
      key: `mock-${key}`,
      displayName: displayName ?? key,
      types: [key, ...(baseType ? [baseType] : [])],
      locale: 'en',
      version: '1',
      status: 'Published',
      published: MOCK_DATE,
      created: MOCK_DATE,
      lastModified: MOCK_DATE,
      url: contentUrl(`/preview/${key}`),
    },
  };
}

/**
 * Builds stand-in content for one content type, shaped the way Graph returns it,
 * so {@linkcode OptimizelyComponent} can render the component without a CMS.
 *
 * Values are derived from the property definitions and are the same on every
 * call, so a preview does not change between reloads.
 *
 * @example
 * ```ts
 * const content = generateMockContent(getContentType('HeroSection'));
 * ```
 */
export function generateMockContent(contentType: AnyContentType) {
  return build(contentType, 0);
}
