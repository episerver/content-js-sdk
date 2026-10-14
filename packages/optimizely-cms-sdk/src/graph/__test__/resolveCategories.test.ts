import { describe, expect, test, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';
import { clearTaxonomyCache } from '../operations.js';
import { type GraphRequestSpy, metadataResponse, stubGraph } from './helpers.js';

const PageType = contentType({
  key: 'ct1',
  displayName: 'CT1',
  baseType: '_page',
  properties: {
    title: { type: 'string' },
  },
});

type TermMetadata = {
  key: string;
  displayName: string | null;
  description?: string | null;
  taxonomy?: string | null;
  usage?: string | null;
  parent?: any;
};

let client: GraphClient;
let mockRequest: GraphRequestSpy;

/** Answers `ResolveTaxonomyTerms` with the given terms whose key was asked for. */
function stubTaxonomy(options: {
  categories?: string[];
  taxonomyTerms?: TermMetadata[];
  taxonomyQueryFails?: boolean;
  item?: Record<string, unknown>;
}) {
  const { categories = [], taxonomyTerms = [], taxonomyQueryFails = false } = options;
  const item = options.item ?? {
    __typename: 'ct1',
    _metadata: { types: ['ct1'], categories, locale: 'en' },
  };

  mockRequest = stubGraph(client, {
    metadata: metadataResponse(['ct1'], { taxonomyType: { __typename: '__Type' } }),
    operations: {
      ResolveTaxonomyTerms: (variables: { keys: string[] }) => {
        if (taxonomyQueryFails) throw new Error('Network error');
        return {
          _TaxonomyTerm: {
            items: taxonomyTerms
              .filter(term => variables.keys.includes(term.key))
              .map(term => ({ _metadata: term })),
          },
        };
      },
    },
    content: { _Content: { item } },
  });
}

const taxonomyCalls = () =>
  mockRequest.mock.calls.filter(call => String(call[0]).includes('ResolveTaxonomyTerms'));

const pathKeys = (term: { path: { key: string }[] }) => term.path.map(entry => entry.key);

beforeEach(() => {
  initContentTypeRegistry([PageType]);
  refreshCache();
  clearTaxonomyCache();
  client = new GraphClient('test-key', { fragment: { taxonomy: 'on' } });
});

describe('resolveTaxonomy: true', () => {
  test('resolves category hierarchy with breadcrumb path from parent chain', async () => {
    stubTaxonomy({
      categories: ['term-nordic'],
      taxonomyTerms: [
        {
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
          { key: 'term-region', displayName: 'Region', description: null, taxonomy: null, usage: null },
          { key: 'term-europe', displayName: 'Europe', description: null, taxonomy: null, usage: null },
          { key: 'term-nordic', displayName: 'Nordic', description: 'Nordic countries', taxonomy: 'Region', usage: null },
        ],
      },
    ]);
  });

  test('maintains 1:1 order with categories array', async () => {
    stubTaxonomy({
      categories: ['term-b', 'term-a'],
      taxonomyTerms: [
        { key: 'term-a', displayName: 'A', parent: null },
        { key: 'term-b', displayName: 'B', parent: null },
      ],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.resolvedCategories).toHaveLength(2);
    expect(result._metadata.resolvedCategories[0].key).toBe('term-b');
    expect(result._metadata.resolvedCategories[1].key).toBe('term-a');
  });

  test('returns displayName: null for unresolvable terms', async () => {
    stubTaxonomy({
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
        path: [{ key: 'term-deleted', displayName: null, description: null, taxonomy: null, usage: null }],
      },
    ]);
  });

  test('returns empty array when content has no categories', async () => {
    stubTaxonomy({
      categories: [],
      taxonomyTerms: [],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.resolvedCategories).toEqual([]);
  });

  test('returns undefined when taxonomy term query fails', async () => {
    stubTaxonomy({
      categories: ['term-a'],
      taxonomyQueryFails: true,
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.resolvedCategories).toBeUndefined();
  });

  test('root-level term has single-element path', async () => {
    stubTaxonomy({
      categories: ['term-root'],
      taxonomyTerms: [{ key: 'term-root', displayName: 'Root Category', parent: null }],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.resolvedCategories[0].path).toEqual([
      { key: 'term-root', displayName: 'Root Category', description: null, taxonomy: null, usage: null },
    ]);
  });
});

describe('category keys', () => {
  test('categories arriving under itemMetadata are hoisted onto _metadata', async () => {
    stubTaxonomy({
      item: {
        __typename: 'ct1',
        _metadata: { types: ['ct1'] },
        itemMetadata: { categories: ['term-a'] },
      },
    });

    const result: any = await client.getContent({ key: 'a' });

    expect(result._metadata.categories).toEqual(['term-a']);
    expect(result).not.toHaveProperty('itemMetadata');
  });

  test('URI-form category keys are shortened to the term key', async () => {
    stubTaxonomy({
      categories: ['https://example.com/taxonomy/Region/term-a'],
      taxonomyTerms: [{ key: 'term-a', displayName: 'A', parent: null }],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.categories).toEqual(['term-a']);
    expect(taxonomyCalls()[0][1]).toEqual({ keys: ['term-a'] });
    expect(result._metadata.resolvedCategories[0]).toMatchObject({ key: 'term-a', displayName: 'A' });
  });
});

describe('ancestor resolution', () => {
  test('fetches string-URI parents level by level and builds the path from their metadata', async () => {
    stubTaxonomy({
      categories: ['term-c'],
      taxonomyTerms: [
        { key: 'term-c', displayName: 'C', parent: 'taxonomy/term-b' },
        { key: 'term-b', displayName: 'B', taxonomy: 'Region', parent: 'taxonomy/term-a' },
        { key: 'term-a', displayName: 'A', parent: null },
      ],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(taxonomyCalls().map(call => call[1].keys)).toEqual([['term-c'], ['term-b'], ['term-a']]);
    expect(result._metadata.resolvedCategories[0].path).toEqual([
      { key: 'term-a', displayName: 'A', description: null, taxonomy: null, usage: null },
      { key: 'term-b', displayName: 'B', description: null, taxonomy: 'Region', usage: null },
      { key: 'term-c', displayName: 'C', description: null, taxonomy: null, usage: null },
    ]);
  });

  test('stops at a cycle in string-URI parents', async () => {
    stubTaxonomy({
      categories: ['term-a'],
      taxonomyTerms: [
        { key: 'term-a', displayName: 'A', parent: 'taxonomy/term-b' },
        { key: 'term-b', displayName: 'B', parent: 'taxonomy/term-a' },
      ],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(taxonomyCalls()).toHaveLength(2);
    expect(pathKeys(result._metadata.resolvedCategories[0])).toEqual(['term-b', 'term-a']);
  });

  test('stops at a cycle in object parents', async () => {
    stubTaxonomy({
      categories: ['term-a'],
      taxonomyTerms: [
        {
          key: 'term-a',
          displayName: 'A',
          parent: { key: 'term-b', displayName: 'B', parent: { key: 'term-a', displayName: 'A' } },
        },
      ],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(pathKeys(result._metadata.resolvedCategories[0])).toEqual(['term-b', 'term-a']);
  });

  test('caps the ancestor walk at 20 levels', async () => {
    const chain = Array.from({ length: 30 }, (_, index) => ({
      key: `term-${index}`,
      displayName: `T${index}`,
      parent: `taxonomy/term-${index + 1}`,
    }));
    stubTaxonomy({ categories: ['term-0'], taxonomyTerms: chain });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });
    const path = pathKeys(result._metadata.resolvedCategories[0]);

    expect(taxonomyCalls()).toHaveLength(20);
    expect(path).toHaveLength(20);
    expect(path[0]).toBe('term-19');
  });

  test('splits more than 100 keys into batches of 100', async () => {
    const terms = Array.from({ length: 150 }, (_, index) => ({
      key: `term-${index}`,
      displayName: `T${index}`,
      parent: null,
    }));
    stubTaxonomy({ categories: terms.map(term => term.key), taxonomyTerms: terms });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(taxonomyCalls().map(call => call[1].keys.length)).toEqual([100, 50]);
    expect(result._metadata.resolvedCategories).toHaveLength(150);
    expect(result._metadata.resolvedCategories[149]).toMatchObject({ key: 'term-149', displayName: 'T149' });
  });
});

describe('resolveTaxonomy: false (default)', () => {
  test('does not resolve hierarchy and resolvedCategories is undefined', async () => {
    stubTaxonomy({
      categories: ['term-a'],
      taxonomyTerms: [{ key: 'term-a', displayName: 'A' }],
    });

    const result: any = await client.getContent({ key: 'a' });

    expect(result._metadata.categories).toEqual(['term-a']);
    expect(result._metadata.resolvedCategories).toBeUndefined();
  });

  test('does not issue a taxonomy term query', async () => {
    stubTaxonomy({
      categories: ['term-a'],
      taxonomyTerms: [],
    });

    await client.getContent({ key: 'a' });

    expect(taxonomyCalls()).toHaveLength(0);
  });
});

describe('resolveTaxonomy with taxonomy disabled', () => {
  test('silently ignores resolveTaxonomy when taxonomy is off', async () => {
    client = new GraphClient('test-key', { fragment: { taxonomy: 'off' } });
    mockRequest = stubGraph(client, {
      metadata: metadataResponse(['ct1'], { taxonomyType: null }),
      content: { _Content: { item: { __typename: 'ct1', _metadata: { types: ['ct1'] } } } },
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(result._metadata.categories).toBeUndefined();
    expect(result._metadata.resolvedCategories).toBeUndefined();
  });
});

describe('taxonomy term caching', () => {
  test('does not re-query already cached terms', async () => {
    stubTaxonomy({
      categories: ['term-a'],
      taxonomyTerms: [{ key: 'term-a', displayName: 'A', parent: null }],
    });

    await client.getContent({ key: 'a' }, { resolveTaxonomy: true });
    await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(taxonomyCalls()).toHaveLength(1);
  });

  test('queries only uncached terms on second call', async () => {
    stubTaxonomy({
      categories: ['term-a'],
      taxonomyTerms: [{ key: 'term-a', displayName: 'A', parent: null }],
    });

    await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    mockRequest.mockClear();
    stubTaxonomy({
      categories: ['term-a', 'term-b'],
      taxonomyTerms: [{ key: 'term-b', displayName: 'B', parent: null }],
    });

    const result: any = await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(taxonomyCalls().map(call => call[1])).toEqual([{ keys: ['term-b'] }]);
    expect(result._metadata.resolvedCategories).toHaveLength(2);
    expect(result._metadata.resolvedCategories[0].key).toBe('term-a');
    expect(result._metadata.resolvedCategories[1].key).toBe('term-b');
  });

  test('clearTaxonomyCache forces re-query', async () => {
    stubTaxonomy({
      categories: ['term-a'],
      taxonomyTerms: [{ key: 'term-a', displayName: 'A', parent: null }],
    });

    await client.getContent({ key: 'a' }, { resolveTaxonomy: true });
    clearTaxonomyCache();
    await client.getContent({ key: 'a' }, { resolveTaxonomy: true });

    expect(taxonomyCalls()).toHaveLength(2);
  });
});
