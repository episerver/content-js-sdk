import { describe, expect, test, beforeEach, vi } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';
import { clearTaxonomyCache } from '../operations.js';

const ImageType = contentType({
  key: 'ctImage',
  displayName: 'CT Image',
  baseType: '_image',
  properties: { alt: { type: 'string' } },
});

const PageType = contentType({
  key: 'ct1',
  displayName: 'CT1',
  baseType: '_page',
  properties: {
    hero: { type: 'contentReference', allowedTypes: [ImageType] },
    body: { type: 'content', allowedTypes: [ImageType] },
    payload: { type: 'json' },
  },
});

/** Editor-supplied JSON that happens to look like a piece of content. */
const CONTENT_SHAPED_JSON = {
  __typename: 'ctImage',
  _metadata: { types: ['ctImage'] },
  itemMetadata: { categories: ['https://example.com/taxonomy/json-category'] },
};

let client: GraphClient;

/** Categories arrive from Graph as URIs; the SDK exposes the last segment. */
const uri = (key: string) => `https://example.com/taxonomy/${key}`;

/** A response shaped the way Graph answers once taxonomy is enabled. */
const graphResponse = () => ({
  _Content: {
    item: {
      __typename: 'ct1',
      _metadata: { types: ['ct1'], locale: 'en' },
      ct1__itemMetadata: { categories: [uri('page-category')] },
      hero: {
        key: 'image-key',
        item: {
          __typename: 'ctImage',
          _metadata: { types: ['ctImage'], locale: 'en' },
          ctImage__itemMetadata: { categories: [uri('image-category')] },
        },
      },
      ct1__body: {
        __typename: 'ctImage',
        _metadata: { types: ['ctImage'], locale: 'en' },
        ctImage__itemMetadata: { categories: [uri('body-category')] },
      },
      ct1__payload: structuredClone(CONTENT_SHAPED_JSON),
    },
  },
});

let taxonomyQueries = 0;

beforeEach(() => {
  initContentTypeRegistry([ImageType, PageType]);
  refreshCache();
  clearTaxonomyCache();
  taxonomyQueries = 0;
  client = new GraphClient('test-key', { fragment: { taxonomy: 'on' } });

  vi.spyOn(client, 'request').mockImplementation(
    async (query: string, variables: any) => {
      if (query.includes('GetContentMetadata')) {
        return {
          _Content: { item: { _metadata: { types: ['ct1'] } } },
          damAssetType: null,
          taxonomyType: { __typename: '__Type' },
        };
      }
      if (query.includes('ResolveTaxonomyTerms')) {
        taxonomyQueries++;
        return {
          _TaxonomyTerm: {
            items: variables.keys.map((key: string) => ({
              _metadata: { key, displayName: `Term ${key}`, parent: null },
            })),
          },
        };
      }
      return graphResponse();
    },
  );
});

/** The page, the reference item and the content area item. */
const everyNode = (content: any) =>
  [
    ['page', content, 'page-category'],
    ['reference item', content.hero.item, 'image-category'],
    ['content area', content.body, 'body-category'],
  ] as const;

describe('taxonomy categories on nested content', () => {
  test('are hoisted onto `_metadata` and shortened wherever the content sits', async () => {
    const content: any = await client.getContent({ key: 'a' });

    for (const [where, item, category] of everyNode(content)) {
      expect(item.itemMetadata, where).toBeUndefined();
      expect(item._metadata.categories, where).toEqual([category]);
    }
  });

  test('are resolved for nested content too, in one batch per locale', async () => {
    const content: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    for (const [where, item, category] of everyNode(content)) {
      // A resolved term is keyed the same way as the category it came from.
      expect(item._metadata.resolvedCategories, where).toEqual([
        expect.objectContaining({ key: category, displayName: `Term ${category}` }),
      ]);
      expect(item._metadata.resolvedCategories[0].key, where).toBe(
        item._metadata.categories[0],
      );
    }

    // One `_TaxonomyTerm` query for all three, not one per content item.
    expect(taxonomyQueries).toBe(1);
  });

  test('leave a content-shaped `json` property untouched', async () => {
    const content: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(content.payload).toEqual(CONTENT_SHAPED_JSON);
  });
});
