import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { createSingleContentQuery } from '../createQuery.js';
import { configureAdapter } from '../../context/config.js';
import { refreshCache } from '../../util/queryUtils.js';

/**
 * The single key never sees a draft, so this filter is a no-op there. It matters
 * under `auth`, where a credential with editorial access otherwise gets every
 * version of a page and renders whichever one Graph happened to return first.
 */

const PUBLISHED = 'status: { eq: "Published" }';

const ArticleType = contentType({
  key: 'Article',
  displayName: 'Article',
  baseType: '_page',
  properties: {},
});

const metadataResponse = {
  _Content: { item: { _metadata: { types: ['Article'] } } },
  damAssetType: null,
};

const linksResponse = {
  _Content: {
    item: { _id: 'a', _metadata: { path: [] }, _link: { _Page: { items: [] } } },
  },
};

let client: GraphClient;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRequest: any;

// Matched on the operation name: a content query mentions `InstanceMetadata` too.
const stubGraph = (target: GraphClient) => {
  mockRequest = vi.spyOn(target, 'request').mockImplementation(async (query: string) => {
    if (query.includes('query GetContentMetadata')) return metadataResponse;
    if (query.includes('query GetPath') || query.includes('query GetItems'))
      return linksResponse;
    return { _Content: { item: { __typename: 'Article' }, items: [] } };
  });
};

/** Every query text the client sent, metadata requests included. */
const sentQueries = (): string[] =>
  mockRequest.mock.calls.map((call: unknown[]) => String(call[0]));

beforeEach(() => {
  initContentTypeRegistry([ArticleType]);
  refreshCache();
  // `getPreviewContent` stores what it fetched; nothing here reads it back.
  configureAdapter({
    initializeContext: () => {},
    getData: () => undefined,
    setData: () => {},
    set: () => {},
    get: () => undefined,
  });
  client = new GraphClient('test-key');
  stubGraph(client);
});

describe('by default', () => {
  test.each([
    ['getContentByPath', () => client.getContentByPath('/news/')],
    ['getContent', () => client.getContent({ key: 'a' })],
    ['getPath', () => client.getPath({ key: 'a' })],
    ['getItems', () => client.getItems({ key: 'a' })],
  ])('%s filters every query it sends', async (_name, run) => {
    await run();

    expect(sentQueries().length).toBeGreaterThan(0);
    sentQueries().forEach(query => expect(query).toContain(PUBLISHED));
  });

  // The identity filter is `_or`-shaped for a path, so the two have to be combined.
  test('combines the filter with a path lookup rather than replacing it', async () => {
    await client.getContentByPath('/news/');

    expect(sentQueries()[0]).toContain('_and');
    expect(sentQueries()[0]).toContain('hierarchical: { eq: $path }');
  });
});

describe('opting out', () => {
  test('per request', async () => {
    await client.getContentByPath('/news/', { publishedOnly: false });

    sentQueries().forEach(query => expect(query).not.toContain(PUBLISHED));
  });

  test('per client', async () => {
    const draftClient = new GraphClient('test-key', { query: { publishedOnly: false } });
    stubGraph(draftClient);

    await draftClient.getContentByPath('/news/');

    sentQueries().forEach(query => expect(query).not.toContain(PUBLISHED));
  });
});

/** Asking for one exact version and then filtering it out would return nothing. */
describe('requests for a specific version', () => {
  test('a preview is never filtered', async () => {
    await client.getPreviewContent({
      preview_token: 'token',
      key: 'a',
      ctx: 'edit',
      ver: '3',
      loc: 'en',
    });

    sentQueries().forEach(query => expect(query).not.toContain(PUBLISHED));
  });

  test('a reference pinning a version is not filtered', async () => {
    await client.getContent({ key: 'a', version: '3' });

    sentQueries().forEach(query => expect(query).not.toContain(PUBLISHED));
  });

  test('the same reference without a version is', async () => {
    await client.getContent({ key: 'a' });

    sentQueries().forEach(query => expect(query).toContain(PUBLISHED));
  });
});

// Query text is memoized, so a missing cache-key dimension serves the wrong query.
test('the filtered and unfiltered queries are cached apart', () => {
  const filtered = createSingleContentQuery('Article', { publishedOnly: true });
  const unfiltered = createSingleContentQuery('Article', { publishedOnly: false });

  expect(filtered).toContain(PUBLISHED);
  expect(unfiltered).not.toContain(PUBLISHED);
});
