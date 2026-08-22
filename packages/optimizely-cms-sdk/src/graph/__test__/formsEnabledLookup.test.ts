import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';

const PageType = contentType({
  key: 'Page',
  displayName: 'Page',
  baseType: '_page',
  properties: { title: { type: 'string', displayName: 'Title' } },
});

const metadataResponse = {
  _Content: { item: { _metadata: { types: ['Page'] } } },
  damAssetType: null,
};

const contentResponse = {
  _Content: { item: { __typename: 'Page', Page__title: 'Test Page' } },
};

/** Answers each query by shape, so call order doesn't matter. */
const respondByQuery = (query: string) => {
  if (query.includes('GetFormsEnabled')) return { formsContainerType: null };
  if (query.includes('GetContentMetadata')) return metadataResponse;
  return contentResponse;
};

let client: GraphClient;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRequest: any;

/** How many times the Forms introspection query was sent. */
const formsLookups = () =>
  mockRequest.mock.calls.filter((call: unknown[]) =>
    String(call[0]).includes('GetFormsEnabled'),
  ).length;

beforeEach(() => {
  initContentTypeRegistry([PageType]);
  client = new GraphClient('test-key');
  mockRequest = vi
    .spyOn(client, 'request')
    .mockImplementation(async query => respondByQuery(query));
});

describe('whether Forms is enabled', () => {
  // It describes the schema, not the content, so asking once per client is
  // enough. It used to be asked on every single content fetch.
  test('is looked up once however many pages are fetched', async () => {
    await client.getContent({ key: 'a' });
    await client.getContent({ key: 'b' });
    await client.getContent({ key: 'c' });

    expect(formsLookups()).toBe(1);
  });

  test('is shared by concurrent fetches rather than requested twice', async () => {
    await Promise.all([client.getContent({ key: 'a' }), client.getContent({ key: 'b' })]);

    expect(formsLookups()).toBe(1);
  });

  // Memoizing a rejection would disable forms for the lifetime of the client.
  test('is retried after a failed lookup', async () => {
    let failNext = true;
    mockRequest.mockImplementation(async (query: string) => {
      if (query.includes('GetFormsEnabled') && failNext) {
        failNext = false;
        throw new Error('transient');
      }
      return respondByQuery(query);
    });

    await expect(client.getContent({ key: 'a' })).rejects.toThrow();
    await client.getContent({ key: 'b' });

    expect(formsLookups()).toBe(2);
  });
});
