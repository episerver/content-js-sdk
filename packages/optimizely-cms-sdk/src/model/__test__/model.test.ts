import { describe, expect, test } from 'vitest';
import {
  buildConfig,
  contentType,
  contract,
  displayTemplate,
  findExtendingContentTypes,
  initContentTypeRegistry,
  isContentType,
  isContentTypeRegistered,
  isContract,
  isDisplayTemplate,
} from '../index.js';

const Seo = contract({
  key: 'Seo',
  displayName: 'SEO',
  properties: { metaTitle: { type: 'string' }, shared: { type: 'string' } },
});

const Social = contract({
  key: 'Social',
  displayName: 'Social',
  properties: { image: { type: 'url' }, shared: { type: 'integer' } },
});

const Article = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  extends: [Seo, Social],
  properties: { title: { type: 'string' }, shared: { type: 'boolean' } },
});

const Card = displayTemplate({
  key: 'Card',
  displayName: 'Card',
  isDefault: false,
  baseType: '_component',
});

describe('definition helpers', () => {
  test('contract tags its options as a contract', () => {
    expect(Seo).toEqual({
      key: 'Seo',
      displayName: 'SEO',
      properties: { metaTitle: { type: 'string' }, shared: { type: 'string' } },
      __type: 'contract',
      isContract: true,
    });
  });

  test('displayTemplate tags its options as a display template', () => {
    expect(Card).toEqual({
      key: 'Card',
      displayName: 'Card',
      isDefault: false,
      baseType: '_component',
      __type: 'displayTemplate',
    });
  });

  test('buildConfig tags its options as a build configuration', () => {
    const options = { components: ['./src/**'], locale: ['en'], propertyGroups: [] };

    expect(buildConfig(options)).toEqual({ ...options, __type: 'buildConfig' });
  });
});

describe('contentType property merging', () => {
  test('merges contract properties in order, with the content type winning last', () => {
    expect(Article.properties).toEqual({
      metaTitle: { type: 'string' },
      image: { type: 'url' },
      title: { type: 'string' },
      shared: { type: 'boolean' },
    });
  });

  test('accepts a single contract rather than an array', () => {
    const Page = contentType({ key: 'P', displayName: 'P', baseType: '_page', extends: Seo });

    expect(Page.properties).toEqual(Seo.properties);
  });

  test('leaves properties out when neither the type nor its contracts define any', () => {
    const Empty = contract({ key: 'Empty', displayName: 'Empty' });

    expect(contentType({ key: 'A', displayName: 'A', baseType: '_page' })).not.toHaveProperty('properties');
    expect(
      contentType({ key: 'B', displayName: 'B', baseType: '_page', extends: [Empty] }),
    ).not.toHaveProperty('properties');
  });

  test('keeps the rest of the options and tags the result as a content type', () => {
    expect(Article).toMatchObject({ key: 'Article', baseType: '_page', extends: [Seo, Social], __type: 'contentType' });
  });
});

describe('type guards', () => {
  const nonObjects = [null, undefined, 'Article', 42, true];

  test.each([
    ['isContentType', isContentType, Article],
    ['isContract', isContract, Seo],
    ['isDisplayTemplate', isDisplayTemplate, Card],
  ])('%s recognises only its own kind', (_name, guard, own) => {
    const others = [Article, Seo, Card].filter(it => it !== own);

    expect(guard(own)).toBe(true);
    others.forEach(other => expect(guard(other)).toBe(false));
    nonObjects.forEach(value => expect(guard(value)).toBe(false));
  });

  test.each([
    ['isContentType', isContentType, 'contentType'],
    ['isContract', isContract, 'contract'],
    ['isDisplayTemplate', isDisplayTemplate, 'displayTemplate'],
  ])('%s needs a key as well as the tag', (_name, guard, tag) => {
    expect(guard({ __type: tag })).toBe(false);
    expect(guard({ __type: tag, key: 'x' })).toBe(true);
  });
});

describe('registry lookups', () => {
  test('isContentTypeRegistered reflects the last registry initialisation', () => {
    initContentTypeRegistry([Article]);

    expect(isContentTypeRegistered('Article')).toBe(true);
    // Contracts reached through `extends` are registered implicitly
    expect(isContentTypeRegistered('Seo')).toBe(true);
    expect(isContentTypeRegistered('Missing')).toBe(false);

    initContentTypeRegistry([]);
    expect(isContentTypeRegistered('Article')).toBe(false);
  });

  test('findExtendingContentTypes returns the registered types extending a contract', () => {
    const Plain = contentType({ key: 'Plain', displayName: 'Plain', baseType: '_page' });
    const SeoOnly = contentType({ key: 'SeoOnly', displayName: 'SEO only', baseType: '_page', extends: Seo });
    initContentTypeRegistry([Article, Plain, SeoOnly]);

    expect(findExtendingContentTypes(Seo).map(it => it.key)).toEqual(['Article', 'SeoOnly']);
    expect(findExtendingContentTypes(Social).map(it => it.key)).toEqual(['Article']);
  });
});
