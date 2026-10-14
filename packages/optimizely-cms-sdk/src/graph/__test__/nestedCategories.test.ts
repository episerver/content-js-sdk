import { describe, expect, test, beforeEach, vi } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';

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
  },
});

let client: GraphClient;

/** A response shaped the way Graph answers once taxonomy is enabled. */
const graphResponse = () => ({
  _Content: {
    item: {
      __typename: 'ct1',
      _metadata: { types: ['ct1'] },
      ct1__itemMetadata: { categories: ['page-category'] },
      hero: {
        key: 'image-key',
        item: {
          __typename: 'ctImage',
          _metadata: { types: ['ctImage'] },
          ctImage__itemMetadata: { categories: ['image-category'] },
        },
      },
      ct1__body: {
        __typename: 'ctImage',
        _metadata: { types: ['ctImage'] },
        ctImage__itemMetadata: { categories: ['body-category'] },
      },
    },
  },
});

beforeEach(() => {
  initContentTypeRegistry([ImageType, PageType]);
  refreshCache();
  client = new GraphClient('test-key', { fragment: { taxonomy: 'on' } });

  vi.spyOn(client, 'request').mockImplementation(async (query: string) => {
    if (query.includes('GetContentMetadata')) {
      return {
        _Content: { item: { _metadata: { types: ['ct1'] } } },
        damAssetType: null,
        taxonomyType: { __typename: '__Type' },
      };
    }
    return graphResponse();
  });
});

describe('taxonomy categories on nested content', () => {
  test('are hoisted onto `_metadata` wherever the content sits', async () => {
    const content: any = await client.getContent({ key: 'a' });

    for (const [where, item] of [
      ['page', content],
      ['reference item', content.hero.item],
      ['content area', content.body],
    ] as const) {
      expect(item._metadata.categories, where).toBeDefined();
      expect(item.itemMetadata, where).toBeUndefined();
    }

    expect(content.hero.item._metadata.categories).toEqual(['image-category']);
    expect(content.body._metadata.categories).toEqual(['body-category']);
  });
});
