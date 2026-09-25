import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';

const PageType = contentType({
  key: 'ct1',
  displayName: 'CT1',
  baseType: '_page',
  properties: {
    title: { type: 'string' },
  },
});

let client: GraphClient;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRequest: any;

function stubGraph(options: {
  categories?: string[];
  taxonomyTerms?: Array<{ id: string; name: string | null; path?: Array<{ id: string; name: string | null }> }>;
  taxonomyQueryFails?: boolean;
}) {
  const { categories = [], taxonomyTerms = [], taxonomyQueryFails = false } = options;

  mockRequest = vi.spyOn(client, 'request').mockImplementation(async (query: string) => {
    if (query.includes('GetContentMetadata')) {
      return {
        _Content: { item: { _metadata: { types: ['ct1'] } } },
        damAssetType: null,
        taxonomyType: { __typename: '__Type' },
      };
    }
    if (query.includes('ResolveTaxonomyTerms')) {
      if (taxonomyQueryFails) throw new Error('Network error');
      return { _TaxonomyTerm: { items: taxonomyTerms } };
    }
    return {
      _Content: {
        item: {
          __typename: 'ct1',
          _metadata: {
            types: ['ct1'],
            categories,
            locale: 'en',
          },
        },
      },
    };
  });
}

beforeEach(() => {
  initContentTypeRegistry([PageType]);
  refreshCache();
  client = new GraphClient('test-key', { fragment: { taxonomy: 'on' } });
});

describe('resolveCategories: true', () => {
  test('resolves category hierarchy with breadcrumb path', async () => {
    stubGraph({
      categories: ['term-nordic'],
      taxonomyTerms: [
        {
          id: 'term-nordic',
          name: 'Nordic',
          path: [
            { id: 'term-region', name: 'Region' },
            { id: 'term-europe', name: 'Europe' },
            { id: 'term-nordic', name: 'Nordic' },
          ],
        },
      ],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveCategories: true });

    expect(result._metadata.resolvedCategories).toEqual([
      {
        uri: 'term-nordic',
        name: 'Nordic',
        path: [
          { uri: 'term-region', name: 'Region' },
          { uri: 'term-europe', name: 'Europe' },
          { uri: 'term-nordic', name: 'Nordic' },
        ],
      },
    ]);
  });

  test('maintains 1:1 order with categories array', async () => {
    stubGraph({
      categories: ['term-b', 'term-a'],
      taxonomyTerms: [
        { id: 'term-a', name: 'A', path: [{ id: 'term-a', name: 'A' }] },
        { id: 'term-b', name: 'B', path: [{ id: 'term-b', name: 'B' }] },
      ],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveCategories: true });

    expect(result._metadata.resolvedCategories).toHaveLength(2);
    expect(result._metadata.resolvedCategories[0].uri).toBe('term-b');
    expect(result._metadata.resolvedCategories[1].uri).toBe('term-a');
  });

  test('returns name: null for unresolvable terms', async () => {
    stubGraph({
      categories: ['term-deleted'],
      taxonomyTerms: [],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveCategories: true });

    expect(result._metadata.resolvedCategories).toEqual([
      {
        uri: 'term-deleted',
        name: null,
        path: [{ uri: 'term-deleted', name: null }],
      },
    ]);
  });

  test('returns empty array when content has no categories', async () => {
    stubGraph({
      categories: [],
      taxonomyTerms: [],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveCategories: true });

    expect(result._metadata.resolvedCategories).toEqual([]);
  });

  test('returns undefined when taxonomy term query fails', async () => {
    stubGraph({
      categories: ['term-a'],
      taxonomyQueryFails: true,
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveCategories: true });

    expect(result._metadata.resolvedCategories).toBeUndefined();
  });
});

describe('resolveCategories: false (default)', () => {
  test('does not resolve hierarchy and resolvedCategories is undefined', async () => {
    stubGraph({
      categories: ['term-a'],
      taxonomyTerms: [{ id: 'term-a', name: 'A' }],
    });

    const result: any = await client.getContent({ key: 'a' });

    expect(result._metadata.categories).toEqual(['term-a']);
    expect(result._metadata.resolvedCategories).toBeUndefined();
  });

  test('does not issue a taxonomy term query', async () => {
    stubGraph({
      categories: ['term-a'],
      taxonomyTerms: [],
    });

    await client.getContent({ key: 'a' });

    const taxonomyQueries = mockRequest.mock.calls
      .map((call: unknown[]) => String(call[0]))
      .filter((q: string) => q.includes('ResolveTaxonomyTerms'));
    expect(taxonomyQueries).toHaveLength(0);
  });
});

describe('resolveCategories with taxonomy disabled', () => {
  test('silently ignores resolveCategories when taxonomy is off', async () => {
    client = new GraphClient('test-key', { fragment: { taxonomy: 'off' } });
    mockRequest = vi.spyOn(client, 'request').mockImplementation(async (query: string) => {
      if (query.includes('GetContentMetadata')) {
        return {
          _Content: { item: { _metadata: { types: ['ct1'] } } },
          damAssetType: null,
          taxonomyType: null,
        };
      }
      return {
        _Content: {
          item: {
            __typename: 'ct1',
            _metadata: { types: ['ct1'] },
          },
        },
      };
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveCategories: true });

    expect(result._metadata.categories).toBeUndefined();
    expect(result._metadata.resolvedCategories).toBeUndefined();
  });
});
