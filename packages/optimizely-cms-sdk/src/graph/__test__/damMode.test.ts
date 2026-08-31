import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';

/**
 * DAM asset fragments are only useful when the schema exposes DAM types. The
 * `dam` flag lets an application force them on or off, overriding the schema
 * probe that `'automatic'` relies on.
 */

const PageType = contentType({
  key: 'ct1',
  displayName: 'CT1',
  baseType: '_page',
  properties: {
    image: { type: 'contentReference', allowedTypes: ['*'] },
  },
});

const contentResponse = { _Content: { item: { __typename: 'ct1' } } };

let client: GraphClient;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRequest: any;

/**
 * Stubs Graph so the metadata request reports whether the schema exposes DAM
 * types via the `cmp_Asset` probe result.
 */
function stubGraph(schemaHasDam: boolean) {
  mockRequest = vi.spyOn(client, 'request').mockImplementation(async (query: string) => {
    if (query.includes('GetContentMetadata')) {
      return {
        _Content: { item: { _metadata: { types: ['ct1'] } } },
        damAssetType: schemaHasDam ? { __typename: '__Type' } : null,
      };
    }
    return contentResponse;
  });
}

/** The generated content query, i.e. the request that isn't the metadata one. */
const contentQuery = (): string =>
  mockRequest.mock.calls
    .map((call: unknown[]) => String(call[0]))
    .filter((q: string) => !q.includes('GetContentMetadata'))
    .at(-1) ?? '';

/** The metadata query that carried the (optional) DAM probe. */
const metadataQuery = (): string =>
  mockRequest.mock.calls
    .map((call: unknown[]) => String(call[0]))
    .find((q: string) => q.includes('GetContentMetadata')) ?? '';

beforeEach(() => {
  initContentTypeRegistry([PageType]);
  refreshCache();
  client = new GraphClient('test-key');
});

describe("dam: 'automatic' (default)", () => {
  test('probes the schema and includes DAM fragments when present', async () => {
    stubGraph(true);

    await client.getContent({ key: 'a' });

    expect(metadataQuery()).toContain('__type(name: "cmp_Asset")');
    expect(contentQuery()).toContain('ContentReferenceItem');
  });

  test('probes the schema and omits DAM fragments when absent', async () => {
    stubGraph(false);

    await client.getContent({ key: 'a' });

    expect(metadataQuery()).toContain('__type(name: "cmp_Asset")');
    expect(contentQuery()).not.toContain('ContentReferenceItem');
  });
});

describe("dam: 'off'", () => {
  test('omits DAM fragments even when the schema has DAM', async () => {
    client = new GraphClient('test-key', { dam: 'off' });
    stubGraph(true);

    await client.getContent({ key: 'a' });

    expect(contentQuery()).not.toContain('ContentReferenceItem');
  });
});

describe("dam: 'on'", () => {
  test('includes DAM fragments even when the schema lacks DAM', async () => {
    client = new GraphClient('test-key', { dam: 'on' });
    stubGraph(false);

    await client.getContent({ key: 'a' });

    expect(contentQuery()).toContain('ContentReferenceItem');
  });
});

describe('per-request override', () => {
  test('request-level dam beats the global client setting', async () => {
    client = new GraphClient('test-key', { dam: 'off' });
    stubGraph(false);

    await client.getContent({ key: 'a' }, { dam: 'on' });

    expect(contentQuery()).toContain('ContentReferenceItem');
  });
});
