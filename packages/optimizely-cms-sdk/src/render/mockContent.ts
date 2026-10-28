/**
 * Stand-in content for a content type, shaped like what Graph returns, so a
 * component can be rendered before anyone has authored content for it.
 *
 * @module
 */

import { getContentType } from '../model/contentTypeRegistry.js';
import { isContentType } from '../model/index.js';
import type { AnyContentType, PermittedTypes } from '../model/contentTypes.js';
import type { AnyProperty } from '../model/properties.js';
import { isBaseMediaType } from '../util/baseTypeUtil.js';

/**
 * A text source, shaped like the part of a faker-style library this uses.
 * Matched by shape, not identity, so any store with these methods works.
 * Without one, each property names itself.
 */
export type FakerLike = {
  seed(value: number): unknown;
  lorem: { words(count?: number): string; paragraph(): string };
  person: { fullName(): string };
  internet: { email(): string; url(): string };
  commerce: { productName(): string; price(): string };
  number: { int(options: { min: number; max: number }): number };
  /** `refDate` is always passed, so an implementation never has to read the
   *  clock: measuring from the current time would render a different date on
   *  every reload. */
  date: { past(options: { refDate: string }): Date };
};

/** Values pinned per content type, merged over the generated ones. */
export type MockDataOverrides = Record<string, Record<string, unknown>>;

/** Full control: receives what the schema produced, returns what to use. */
export type MockDataFactory = (
  contentType: AnyContentType,
  generated: Record<string, unknown>,
) => Record<string, unknown> | undefined;

/**
 * One place stand-in content can come from. Any of:
 *
 * - a {@linkcode FakerLike} text source, to fill text from each property's name
 * - a {@linkcode MockDataFactory}, for content built however the app likes
 * - {@linkcode MockDataOverrides}, to pin fields per content type
 */
export type MockDataSource = FakerLike | MockDataFactory | MockDataOverrides;

/**
 * Where stand-in content comes from. A list is applied left to right, so a
 * text source and specific values compose:
 *
 * ```ts
 * mockData: [faker, { Heading: { heading: 'Shop the winter range' } }]
 * ```
 *
 * Passed alone, a source behaves as it always has.
 */
export type MockData = MockDataSource | MockDataSource[];

/**
 * What one component contributes about itself, found through
 * {@linkcode MockContentOptions.mockFor} rather than passed in.
 */
export type ComponentMock =
  | Record<string, unknown>
  | ((ctx: {
      faker?: FakerLike;
      generated: Record<string, unknown>;
    }) => Record<string, unknown>);

export type MockContentOptions = {
  mockData?: MockData;
  /**
   * The mock a component declares about itself, by content type key.
   *
   * Asked for every type the walk meets, so a component's own stand-in
   * content fills it when nested as well as when previewed directly. The
   * core has no idea where these come from; the React binding answers from
   * its component registry.
   */
  mockFor?: (contentTypeKey: string) => ComponentMock | undefined;
  /**
   * The locale the content claims to be in, written to `_metadata.locale`.
   *
   * Components read it for date and number formatting, so a preview asked
   * for one locale must not report another. Defaults to `en`.
   */
  locale?: string;
};

/** Carried through the walk, so nothing reads module state. */
type MockContext = {
  faker?: FakerLike;
  locale: string;
  sources: MockDataSource[];
  mockFor?: (contentTypeKey: string) => ComponentMock | undefined;
  depth: number;
};

/** How deep nested components and content references are followed. */
const MAX_DEPTH = 3;

/** What `_metadata.locale` says when the caller does not care. */
const DEFAULT_LOCALE = 'en';

/** Fixed so that a preview of the same component is byte-identical each time. */
const MOCK_DATE = '2025-01-23T12:00:00Z';

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

/** True for a field long enough that an editor would write sentences in it. */
const isLongText = (property: AnyProperty) =>
  ('maxLength' in property ? (property.maxLength ?? 0) : 0) > 120;

/**
 * What a property is called, matched against the kinds of copy a source can
 * produce. The name is the only signal a content type gives about meaning:
 * the schema says `string`, the name says whether it is an email or a heading.
 */
function fakeText(name: string, property: AnyProperty, faker: FakerLike): string {
  // The label an editor sees is often the clearer signal: a property named
  // `text` says nothing, while its display name "Button Text" does.
  const field = `${name} ${property.displayName ?? ''}`.toLowerCase();
  const long = isLongText(property);

  if (/mail/.test(field)) return faker.internet.email();
  if (/url|href|link|slug|website|domain/.test(field)) return faker.internet.url();
  if (/price|amount|cost|total/.test(field)) return faker.commerce.price();
  if (/author|person|customer|\bname\b/.test(field)) return faker.person.fullName();
  // `text` is deliberately absent: it is the most common name for a short
  // label — a button's, a link's — and reads as nonsense as a paragraph.
  if (long || /body|description|summary|intro|excerpt|content|paragraph/.test(field))
    return faker.lorem.paragraph();
  if (/title|heading|headline|label|caption|cta|button|eyebrow/.test(field))
    return faker.commerce.productName();

  return faker.lorem.words(3);
}

/** The text a string-ish property gets: from the source, or its own name without one. */
function textFor(name: string, property: AnyProperty, ctx: MockContext): string {
  if (ctx.faker) return fakeText(name, property, ctx.faker);

  const label = labelOf(name, property);
  // A long field reads as body copy; a short one is more useful naming itself.
  return isLongText(property) ? `${label}. ${LOREM}` : label;
}

function mockRichText(label: string, ctx: MockContext) {
  const text = ctx.faker ? label : `${label}. ${LOREM}`;

  // A root node wrapping the blocks, as Graph returns it: the renderer reads
  // `children` off the top level and sees nothing in a bare array.
  return {
    json: { type: 'richText', children: [{ type: 'paragraph', children: [{ text }] }] },
    html: `<p>${text}</p>`,
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
  ctx: MockContext,
): unknown {
  const label = labelOf(name, property);
  const enumValues = (property as { enum?: { value: unknown }[] }).enum;

  if (enumValues?.length) return enumValues[0].value;

  switch (property.type) {
    case 'string':
      return textFor(name, property, ctx);
    case 'boolean':
      return true;
    case 'integer':
    case 'float': {
      if (property.minimum !== undefined) return property.minimum;
      if (!ctx.faker) return 1;

      // `maximum` can be below the default floor, and a source is entitled to
      // throw when handed an inverted range.
      const max = property.maximum ?? 100;
      const min = Math.min(1, max);
      const whole = ctx.faker.number.int({ min, max });

      // A float property reading as a whole number hides formatting bugs, so
      // nudge it off the integer — downwards when the maximum is in the way.
      if (property.type !== 'float') return whole;
      return whole + 0.5 <= max ? whole + 0.5 : whole - 0.5;
    }
    case 'dateTime':
      return ctx.faker ? ctx.faker.date.past({ refDate: MOCK_DATE }).toISOString() : MOCK_DATE;
    case 'json':
      return {};
    case 'binary':
      return null;
    case 'url':
      return contentUrl('/example');
    case 'link': {
      const text = textFor(name, property, ctx);
      return {
        text,
        title: text,
        target: '_self',
        url: contentUrl('/example'),
      };
    }
    case 'richText':
      return mockRichText(ctx.faker ? ctx.faker.lorem.paragraph() : label, ctx);
    case 'contentReference':
      return mockReference(label, property);
    case 'content': {
      const nested = allowedKeys(property).map(getContentType).find(isContentType);
      return nested && ctx.depth < MAX_DEPTH ?
          build(nested, { ...ctx, depth: ctx.depth + 1 })
        : null;
    }
    case 'component': {
      const nested = (property as { contentType?: AnyContentType }).contentType;
      return nested && ctx.depth < MAX_DEPTH ?
          build(nested, { ...ctx, depth: ctx.depth + 1 })
        : null;
    }
    case 'array': {
      const items = (property as { items: AnyProperty }).items;
      // Two reads as a list without being a wall, but a property that allows
      // fewer must not be handed more than it permits.
      const count = Math.min(
        Math.max(property.minItems ?? 0, 2),
        property.maxItems ?? Number.MAX_SAFE_INTEGER,
      );
      // One level of nesting per item would multiply, so arrays of components
      // are filled at the depth of the array itself.
      //
      // Nulls dropped: a component mapping over them would hand `null` to
      // `OptimizelyComponent`, which throws.
      return Array.from({ length: count }, () =>
        mockProperty(name, items, ctx),
      ).filter(item => item !== null);
    }
    default:
      return null;
  }
}

/**
 * An empty composition. Which components an editor would place inside is a
 * guess, so the container renders its own chrome and nothing else.
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

function build(
  contentType: AnyContentType,
  ctx: MockContext,
): Record<string, unknown> {
  const { key, displayName, properties } = contentType as AnyContentType & {
    properties?: Record<string, AnyProperty>;
  };
  const baseType = 'baseType' in contentType ? (contentType.baseType as string) : undefined;

  const values = Object.fromEntries(
    Object.entries(properties ?? {}).map(([name, property]) => [
      name,
      mockProperty(name, property, ctx),
    ]),
  );

  const generated = {
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
      locale: ctx.locale,
      version: '1',
      status: 'Published',
      published: MOCK_DATE,
      created: MOCK_DATE,
      lastModified: MOCK_DATE,
      url: contentUrl(`/preview/${key}`),
    },
  };

  return applyMockData(contentType, generated, ctx);
}

/**
 * Lets declared data win over the generated values. Applied at every level,
 * so a mock for `Author` works nested as well as standalone.
 *
 * Order is component first, then whatever the preview page passed: the
 * component's mock is its default, and the application gets the last word.
 */
function applyMockData(
  contentType: AnyContentType,
  generated: Record<string, unknown>,
  { sources, mockFor, faker }: MockContext,
): Record<string, unknown> {
  let content = generated;

  const declared = mockFor?.(contentType.key);
  if (declared) {
    content = {
      ...content,
      ...(typeof declared === 'function' ?
        declared({ faker, generated: content })
      : declared),
    };
  }

  for (const source of sources) {
    // The text source was used while generating; it has nothing to add here.
    if (isFaker(source)) continue;

    if (typeof source === 'function') {
      content = source(contentType, content) ?? content;
      continue;
    }

    // Shallow: a field is either declared or generated, never half of each,
    // which would be hard to reason about from the outside.
    content = { ...content, ...source[contentType.key] };
  }

  return content;
}

/** A stable 32-bit number from a string, to seed the text source with. */
function hash(value: string): number {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) {
    result = Math.imul(result ^ value.charCodeAt(i), 16777619);
  }
  return result >>> 0;
}

/** A text source is recognised by shape, so the SDK never imports one to check. */
const isFaker = (source: MockDataSource): source is FakerLike =>
  typeof source === 'object' &&
  // Both, because pinned values are also an object: a content type called
  // `lorem` would otherwise be taken for a text source and never applied.
  'lorem' in source &&
  typeof (source as FakerLike).seed === 'function';

/**
 * Builds stand-in content for one content type, shaped the way Graph returns
 * it, so {@linkcode OptimizelyComponent} can render it without a CMS.
 *
 * Values come from the schema. What the text *says* comes from `mockData`,
 * and without it each property names itself.
 *
 * @example Realistic copy, drawn from each property's name
 * ```ts
 * generateMockContent(type, { mockData: faker });
 * ```
 *
 * @example Pin some fields, generate the rest
 * ```ts
 * generateMockContent(type, { mockData: { HeroSection: { Headline: 'Set it.' } } });
 * ```
 *
 * @example Build it however the application likes
 * ```ts
 * generateMockContent(type, { mockData: (type, generated) => ({ ...generated }) });
 * ```
 *
 * The source is seeded from the content type key, so a component looks the
 * same on every reload.
 */
export function generateMockContent(
  contentType: AnyContentType,
  { mockData, mockFor, locale = DEFAULT_LOCALE }: MockContentOptions = {},
) {
  const sources = mockData === undefined ? [] : [mockData].flat();
  const faker = sources.find(isFaker);
  faker?.seed(hash(contentType.key));

  return build(contentType, { faker, locale, sources, mockFor, depth: 0 });
}
