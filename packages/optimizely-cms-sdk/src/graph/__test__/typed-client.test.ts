import { beforeEach, describe, expect, test, vi, expectTypeOf } from 'vitest';
import { GraphClient, createClient, createClientFromRegistry } from '../index.js';
import type { TypedOrderBy } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { metadataResponse, stubGraph } from './helpers.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NewsPage = contentType({
  key: 'NewsPage',
  displayName: 'News Page',
  baseType: '_page' as const,
  properties: {
    headline: { type: 'string' as const },
    publishDate: { type: 'dateTime' as const },
  },
});

const ArticlePage = contentType({
  key: 'ArticlePage',
  displayName: 'Article Page',
  baseType: '_page' as const,
  properties: {
    title: { type: 'string' as const },
    body: { type: 'richText' as const },
  },
});

const HeroBlock = contentType({
  key: 'HeroBlock',
  displayName: 'Hero Block',
  baseType: '_component' as const,
  properties: {
    heading: { type: 'string' as const },
  },
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let client: GraphClient;

beforeEach(() => {
  initContentTypeRegistry([NewsPage, ArticlePage, HeroBlock]);
  client = new GraphClient('test-key');
});

// ---------------------------------------------------------------------------
// createClient (explicit map)
// ---------------------------------------------------------------------------

describe('createClient', () => {
  test('creates namespaces for each key in the type map', () => {
    const typed = createClient(client, {
      news: NewsPage,
      article: ArticlePage,
    });

    expect(typed.news).toBeDefined();
    expect(typed.article).toBeDefined();
    expect(typed.graph).toBe(client);
  });

  test('namespace methods delegate to the underlying GraphClient', async () => {
    const typed = createClient(client, { news: NewsPage });

    stubGraph(client, {
      metadata: metadataResponse(['NewsPage']),
      content: { _Content: { items: [{ _id: '1', _metadata: { types: ['NewsPage'] } }] } },
    });

    const result = await typed.news.getContentByPath('/news/post-1');
    expect(result).toHaveLength(1);
  });

  test('exposes the raw GraphClient via .graph', () => {
    const typed = createClient(client, { news: NewsPage });
    expect(typed.graph).toBe(client);
  });

  test('namespace has all expected methods', () => {
    const typed = createClient(client, { news: NewsPage });
    expect(typeof typed.news.getContentByPath).toBe('function');
    expect(typeof typed.news.getContent).toBe('function');
    expect(typeof typed.news.getItems).toBe('function');
    expect(typeof typed.news.getPath).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// createClientFromRegistry
// ---------------------------------------------------------------------------

describe('createClientFromRegistry', () => {
  test('creates namespaces from all registered content types', () => {
    const typed = createClientFromRegistry(client);

    expect(typed.newspage).toBeDefined();
    expect(typed.articlepage).toBeDefined();
    expect(typed.heroblock).toBeDefined();
  });

  test('filters by baseType when specified', () => {
    const typed = createClientFromRegistry(client, '_page');

    expect(typed.newspage).toBeDefined();
    expect(typed.articlepage).toBeDefined();
    expect((typed as any).heroblock).toBeUndefined();
  });

  test('keys are lowercased content type keys', () => {
    const typed = createClientFromRegistry(client);
    const keys = Object.keys(typed).filter(k => k !== 'graph');
    expect(keys).toContain('newspage');
    expect(keys).toContain('articlepage');
    expect(keys).toContain('heroblock');
  });
});

// ---------------------------------------------------------------------------
// Type-level tests for TypedOrderBy inference
// ---------------------------------------------------------------------------

describe('TypedOrderBy', () => {
  test('accepts content type property keys at top level', () => {
    type NewsOrderBy = TypedOrderBy<typeof NewsPage>;
    expectTypeOf<{ headline: 'DESC' }>().toMatchTypeOf<NewsOrderBy>();
    expectTypeOf<{ publishDate: 'ASC' }>().toMatchTypeOf<NewsOrderBy>();
  });

  test('accepts metadata fields under _metadata', () => {
    type NewsOrderBy = TypedOrderBy<typeof NewsPage>;
    expectTypeOf<{ _metadata: { sortOrder: 'ASC' } }>().toMatchTypeOf<NewsOrderBy>();
    expectTypeOf<{ _metadata: { published: 'DESC' } }>().toMatchTypeOf<NewsOrderBy>();
  });

  test('accepts mixed property and metadata fields', () => {
    type NewsOrderBy = TypedOrderBy<typeof NewsPage>;
    expectTypeOf<{ headline: 'DESC', _metadata: { published: 'ASC' } }>()
      .toMatchTypeOf<NewsOrderBy>();
  });

  test('orderBy option is accepted by getItems', () => {
    const typed = createClient(client, { news: NewsPage });
    expectTypeOf<{ orderBy: { headline: 'DESC' } }>()
      .toMatchTypeOf<NonNullable<Parameters<typeof typed.news.getItems>[1]>>();
  });
});
