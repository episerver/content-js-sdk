import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';
import { clearTaxonomyCache } from '../operations.js';

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
  taxonomyTerms?: Array<{ _metadata: { key: string; displayName: string | null; description?: string | null; taxonomy?: string | null; usage?: string | null; parent?: any } }>;
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
  clearTaxonomyCache();
  client = new GraphClient('test-key', { fragment: { taxonomy: 'on' } });
});

describe('resolveTaxonomy: true', () => {
  test('resolves category hierarchy with breadcrumb path from parent chain', async () => {
    stubGraph({
      categories: ['term-nordic'],
      taxonomyTerms: [
        {
          _metadata: {
            key: 'term-nordic',
            displayName: 'Nordic',
            description: 'Nordic countries',
            taxonomy: 'Region',
            usage: null,
            parent: {
              key: 'term-europe',
              displayName: 'Europe',
              parent: {
                key: 'term-region',
                displayName: 'Region',
                parent: null,
              },
            },
          },
        },
      ],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.resolvedCategories).toEqual([
      {
        key: 'term-nordic',
        displayName: 'Nordic',
        description: 'Nordic countries',
        taxonomy: 'Region',
        usage: null,
        sortOrder: null,
        isAvailable: null,
        isSelectable: null,
        path: [
          { key: 'term-region', displayName: 'Region' },
          { key: 'term-europe', displayName: 'Europe' },
          { key: 'term-nordic', displayName: 'Nordic' },
        ],
      },
    ]);
  });

  test('maintains 1:1 order with categories array', async () => {
    stubGraph({
      categories: ['term-b', 'term-a'],
      taxonomyTerms: [
        { _metadata: { key: 'term-a', displayName: 'A', parent: null } },
        { _metadata: { key: 'term-b', displayName: 'B', parent: null } },
      ],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.resolvedCategories).toHaveLength(2);
    expect(result._metadata.resolvedCategories[0].key).toBe('term-b');
    expect(result._metadata.resolvedCategories[1].key).toBe('term-a');
  });

  test('returns displayName: null for unresolvable terms', async () => {
    stubGraph({
      categories: ['term-deleted'],
      taxonomyTerms: [],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.resolvedCategories).toEqual([
      {
        key: 'term-deleted',
        displayName: null,
        description: null,
        taxonomy: null,
        usage: null,
        sortOrder: null,
        isAvailable: null,
        isSelectable: null,
        path: [{ key: 'term-deleted', displayName: null }],
      },
    ]);
  });

  test('returns empty array when content has no categories', async () => {
    stubGraph({
      categories: [],
      taxonomyTerms: [],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.resolvedCategories).toEqual([]);
  });

  test('returns undefined when taxonomy term query fails', async () => {
    stubGraph({
      categories: ['term-a'],
      taxonomyQueryFails: true,
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.resolvedCategories).toBeUndefined();
  });

  test('root-level term has single-element path', async () => {
    stubGraph({
      categories: ['term-root'],
      taxonomyTerms: [
        { _metadata: { key: 'term-root', displayName: 'Root Category', parent: null } },
      ],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.resolvedCategories[0].path).toEqual([
      { key: 'term-root', displayName: 'Root Category' },
    ]);
  });
});

describe('resolveTaxonomy: false (default)', () => {
  test('does not resolve hierarchy and resolvedCategories is undefined', async () => {
    stubGraph({
      categories: ['term-a'],
      taxonomyTerms: [{ _metadata: { key: 'term-a', displayName: 'A' } }],
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

describe('resolveTaxonomy with taxonomy disabled', () => {
  test('silently ignores resolveTaxonomy when taxonomy is off', async () => {
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

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.categories).toBeUndefined();
    expect(result._metadata.resolvedCategories).toBeUndefined();
  });
});

describe('taxonomy term caching', () => {
  test('does not re-query already cached terms', async () => {
    stubGraph({
      categories: ['term-a'],
      taxonomyTerms: [
        { _metadata: { key: 'term-a', displayName: 'A', parent: null } },
      ],
    });

    await client.getContent({ key: 'a' }, { resolveTaxonomy: true });
    await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    const taxonomyQueries = mockRequest.mock.calls
      .map((call: unknown[]) => String(call[0]))
      .filter((q: string) => q.includes('ResolveTaxonomyTerms'));
    expect(taxonomyQueries).toHaveLength(1);
  });

  test('queries only uncached terms on second call', async () => {
    stubGraph({
      categories: ['term-a'],
      taxonomyTerms: [
        { _metadata: { key: 'term-a', displayName: 'A', parent: null } },
      ],
    });

    await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    mockRequest.mockClear();
    stubGraph({
      categories: ['term-a', 'term-b'],
      taxonomyTerms: [
        { _metadata: { key: 'term-b', displayName: 'B', parent: null } },
      ],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    const taxonomyQuery = mockRequest.mock.calls
      .find((call: unknown[]) => String(call[0]).includes('ResolveTaxonomyTerms'));
    expect(taxonomyQuery).toBeDefined();
    expect(taxonomyQuery[1].keys).toEqual(['term-b']);

    expect(result._metadata.resolvedCategories).toHaveLength(2);
    expect(result._metadata.resolvedCategories[0].key).toBe('term-a');
    expect(result._metadata.resolvedCategories[1].key).toBe('term-b');
  });

  test('clearTaxonomyCache forces re-query', async () => {
    stubGraph({
      categories: ['term-a'],
      taxonomyTerms: [
        { _metadata: { key: 'term-a', displayName: 'A', parent: null } },
      ],
    });

    await client.getContent({ key: 'a' }, { resolveTaxonomy: true });
    clearTaxonomyCache();
    await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    const taxonomyQueries = mockRequest.mock.calls
      .map((call: unknown[]) => String(call[0]))
      .filter((q: string) => q.includes('ResolveTaxonomyTerms'));
    expect(taxonomyQueries).toHaveLength(2);
  });
});
