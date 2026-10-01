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

const contentResponse = { _Content: { item: { __typename: 'ct1' } } };

let client: GraphClient;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRequest: any;

function stubGraph(schemaHasTaxonomy: boolean, schemaHasDam = false) {
  mockRequest = vi.spyOn(client, 'request').mockImplementation(async (query: string) => {
    if (query.includes('GetContentMetadata')) {
      return {
        _Content: { item: { _metadata: { types: ['ct1'] } } },
        damAssetType: schemaHasDam ? { __typename: '__Type' } : null,
        taxonomyType: schemaHasTaxonomy ? { __typename: '__Type' } : null,
      };
    }
    return contentResponse;
  });
}

const contentQuery = (): string =>
  mockRequest.mock.calls
    .map((call: unknown[]) => String(call[0]))
    .filter((q: string) => !q.includes('GetContentMetadata'))
    .at(-1) ?? '';

const metadataQuery = (): string =>
  mockRequest.mock.calls
    .map((call: unknown[]) => String(call[0]))
    .find((q: string) => q.includes('GetContentMetadata')) ?? '';

beforeEach(() => {
  initContentTypeRegistry([PageType]);
  refreshCache();
  client = new GraphClient('test-key');
});

describe("taxonomy: 'automatic' (default)", () => {
  test('probes the schema and includes categories when taxonomy is present', async () => {
    stubGraph(true);

    await client.getContent({ key: 'a' });

    expect(metadataQuery()).toContain('__type(name: "_TaxonomyTerm")');
    expect(contentQuery()).toContain('categories');
  });

  test('probes the schema and omits categories when taxonomy is absent', async () => {
    stubGraph(false);

    await client.getContent({ key: 'a' });

    expect(metadataQuery()).toContain('__type(name: "_TaxonomyTerm")');
    expect(contentQuery()).not.toContain('categories');
  });
});

describe("taxonomy: 'off'", () => {
  test('omits categories even when the schema has taxonomy', async () => {
    client = new GraphClient('test-key', { fragment: { taxonomy: 'off' } });
    stubGraph(true);

    await client.getContent({ key: 'a' });

    expect(contentQuery()).not.toContain('categories');
  });
});

describe("taxonomy: 'on'", () => {
  test('includes categories even when the schema lacks taxonomy', async () => {
    client = new GraphClient('test-key', { fragment: { taxonomy: 'on' } });
    stubGraph(false);

    await client.getContent({ key: 'a' });

    expect(contentQuery()).toContain('categories');
  });
});

describe('ItemMetadata fragment', () => {
  test('categories is in the ItemMetadata fragment alongside changeset and displayOption', async () => {
    stubGraph(true);

    await client.getContent({ key: 'a' });

    const query = contentQuery();
    const itemMetadataMatch = query.match(/fragment ItemMetadata on ItemMetadata \{([^}]+)\}/);
    expect(itemMetadataMatch).not.toBeNull();
    const fields = itemMetadataMatch![1].trim();
    expect(fields).toContain('changeset');
    expect(fields).toContain('displayOption');
    expect(fields).toContain('categories');
  });

  test('ItemMetadata fragment omits categories when taxonomy disabled', async () => {
    client = new GraphClient('test-key', { fragment: { taxonomy: 'off' } });
    stubGraph(false);

    await client.getContent({ key: 'a' });

    const query = contentQuery();
    const itemMetadataMatch = query.match(/fragment ItemMetadata on ItemMetadata \{([^}]+)\}/);
    expect(itemMetadataMatch).not.toBeNull();
    const fields = itemMetadataMatch![1].trim();
    expect(fields).toContain('changeset');
    expect(fields).toContain('displayOption');
    expect(fields).not.toContain('categories');
  });
});
