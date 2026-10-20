import { describe, expect, test, vi, beforeEach } from 'vitest';
import { config, getClient, GraphClient } from '../index.js';
import { createSingleContentQuery } from '../createQuery.js';
import { contract, contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';

/**
 * `config()` groups its options: `fragment` shapes the generated query, `query`
 * sets the defaults for the options every request method also accepts.
 *
 * The two risks the grouping introduces are covered here — a `fragment` setting
 * that never reaches the query builders (`typeFilter` used to be dropped
 * entirely), and an override that wipes the rest of its group instead of
 * merging into it.
 */

const Categorizable = contract({
  key: 'Categorizable',
  displayName: 'Categorizable',
  properties: { category: { type: 'string' } },
});

const BlogArticle = contentType({
  key: 'BlogArticle',
  displayName: 'Blog Article',
  baseType: '_page',
  extends: Categorizable,
  properties: { title: { type: 'string' } },
});

const NewsArticle = contentType({
  key: 'NewsArticle',
  displayName: 'News Article',
  baseType: '_page',
  extends: Categorizable,
  properties: { headline: { type: 'string' } },
});

const HomePage = contentType({
  key: 'HomePage',
  displayName: 'Home Page',
  baseType: '_page',
  properties: {
    body: { type: 'richText' },
    related: { type: 'content', allowedTypes: [Categorizable] },
  },
});

const Experience = contentType({
  key: 'DepthExperience',
  displayName: 'Depth Experience',
  baseType: '_experience',
  properties: {},
});

const Element = contentType({
  key: 'DepthElement',
  displayName: 'Depth Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: { heading: { type: 'string' } },
});

let client: GraphClient;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRequest: any;

/** Stubs Graph so any client resolves `HomePage` and returns an empty item. */
function stubGraph(target: GraphClient) {
  mockRequest = vi.spyOn(target, 'request').mockImplementation(async (query: string) => {
    if (query.includes('GetContentMetadata')) {
      return {
        _Content: { item: { _metadata: { types: ['HomePage'] } } },
        damAssetType: null,
      };
    }
    return { _Content: { item: { __typename: 'HomePage' } } };
  });
}

/** The generated content query, i.e. the request that isn't the metadata one. */
const contentQuery = (): string =>
  mockRequest.mock.calls
    .map((call: unknown[]) => String(call[0]))
    .filter((q: string) => !q.includes('GetContentMetadata'))
    .at(-1) ?? '';

beforeEach(() => {
  initContentTypeRegistry([Categorizable, BlogArticle, NewsArticle, HomePage]);
  refreshCache();
});

describe('fragment options reach the generated query', () => {
  test('typeFilter excludes a content type from the fragments', async () => {
    client = new GraphClient('test-key', {
      fragment: { expandContracts: true, typeFilter: key => key !== 'NewsArticle' },
    });
    stubGraph(client);

    await client.getContent({ key: 'a' });

    expect(contentQuery()).toContain('fragment BlogArticle');
    expect(contentQuery()).not.toContain('fragment NewsArticle');
  });

  test('expandContracts pulls in the implementing types', async () => {
    client = new GraphClient('test-key', { fragment: { expandContracts: true } });
    stubGraph(client);

    await client.getContent({ key: 'a' });

    expect(contentQuery()).toContain('fragment NewsArticle');
  });

  test('richTextFormat selects only the requested representation', async () => {
    client = new GraphClient('test-key', { fragment: { richTextFormat: 'html' } });
    stubGraph(client);

    await client.getContent({ key: 'a' });

    expect(contentQuery()).toContain('html');
    expect(contentQuery()).not.toContain('json');
  });
});

describe('query cache key', () => {
  // `compositionDepth` was missing from the key, so the first depth generated
  // won the cache entry and every later client silently reused its query.
  test('compositionDepth produces a distinct query', () => {
    initContentTypeRegistry([Experience, Element]);
    refreshCache();

    const shallow = createSingleContentQuery('DepthExperience', { compositionDepth: 2 });
    const deep = createSingleContentQuery('DepthExperience', { compositionDepth: 6 });

    expect(deep).not.toBe(shallow);
    expect(deep.length).toBeGreaterThan(shallow.length);
  });
});

describe('getClient overrides merge into a group', () => {
  beforeEach(() => {
    config({
      apiKey: 'base-key',
      fragment: { richTextFormat: 'html', compositionDepth: 2, maxThreshold: 42 },
      query: { cache: false, slot: 'New' },
    });
  });

  test('overriding one fragment field keeps the rest of the group', () => {
    const overridden = getClient({ fragment: { compositionDepth: 8 } });

    expect(overridden.fragmentDefaults.compositionDepth).toBe(8);
    expect(overridden.fragmentDefaults.richTextFormat).toBe('html');
    expect(overridden.fragmentDefaults.maxThreshold).toBe(42);
  });

  test('overriding one query field keeps the rest of the group', () => {
    const overridden = getClient({ query: { cache: true } });

    expect(overridden.queryDefaults.cache).toBe(true);
    expect(overridden.queryDefaults.slot).toBe('New');
  });

  test('an untouched group is inherited whole', () => {
    const overridden = getClient({ userAgent: 'MyApp/1.0' });

    expect(overridden.userAgent).toBe('MyApp/1.0');
    expect(overridden.fragmentDefaults.richTextFormat).toBe('html');
    expect(overridden.queryDefaults.slot).toBe('New');
  });
});
