import { describe, expect, test, beforeEach } from 'vitest';
import { GraphClient, type GraphOptions } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';
import { contentQuery, metadataQuery, metadataResponse, stubGraph } from './helpers.js';

/**
 * `dam` and `taxonomy` are tri-state: `'automatic'` follows a schema probe in the
 * metadata request, `'on'`/`'off'` override it.
 */

type Mode = 'on' | 'off';

const PageType = contentType({
  key: 'ct1',
  displayName: 'CT1',
  baseType: '_page',
  properties: {
    title: { type: 'string' },
    image: { type: 'contentReference', allowedTypes: ['*'] },
  },
});

const contentResponse = { _Content: { item: { __typename: 'ct1' } } };

const modes = [
  {
    flag: 'dam',
    probe: '__type(name: "cmp_Asset")',
    marker: 'PublicImageAsset',
    schema: (present: boolean) => ({ damAssetType: present ? { __typename: '__Type' } : null }),
    fragment: (mode: Mode) => ({ dam: mode }),
  },
  {
    flag: 'taxonomy',
    probe: '__type(name: "_Metadata")',
    marker: 'categories',
    schema: (present: boolean) => ({
      taxonomyType: present ? { fields: [{ name: 'categories' }] } : null,
    }),
    fragment: (mode: Mode) => ({ taxonomy: mode }),
  },
];

/** Fetches one item with the schema reporting the feature present or absent. */
const fetchItem = async (
  schemaExtra: Record<string, unknown>,
  fragment: GraphOptions['fragment'] = {},
) => {
  const client = new GraphClient('test-key', { fragment });
  const spy = stubGraph(client, {
    metadata: metadataResponse(['ct1'], schemaExtra),
    content: contentResponse,
  });

  await client.getContent({ key: 'a' });
  return spy;
};

beforeEach(() => {
  initContentTypeRegistry([PageType]);
  refreshCache();
});

describe.each(modes)('$flag', ({ probe, marker, schema, fragment }) => {
  test("'automatic' probes the schema and includes the fragments when present", async () => {
    const spy = await fetchItem(schema(true));

    expect(metadataQuery(spy)).toContain(probe);
    expect(contentQuery(spy)).toContain(marker);
  });

  test("'automatic' probes the schema and omits the fragments when absent", async () => {
    const spy = await fetchItem(schema(false));

    expect(metadataQuery(spy)).toContain(probe);
    expect(contentQuery(spy)).not.toContain(marker);
  });

  test("'off' omits the fragments even when the schema has the feature", async () => {
    const spy = await fetchItem(schema(true), fragment('off'));

    expect(contentQuery(spy)).not.toContain(marker);
  });

  test("'on' includes the fragments even when the schema lacks the feature", async () => {
    const spy = await fetchItem(schema(false), fragment('on'));

    expect(contentQuery(spy)).toContain(marker);
  });
});

describe('taxonomy probe', () => {
  test("'automatic' treats a _Metadata type without a categories field as absent", async () => {
    const spy = await fetchItem({ taxonomyType: { fields: [{ name: 'key' }] } });

    expect(contentQuery(spy)).not.toContain('categories');
  });
});

describe('ItemMetadata fragment', () => {
  const itemMetadataFields = (query: string) =>
    query.match(/fragment ItemMetadata on ItemMetadata \{([^}]+)\}/)?.[1].trim();

  test('categories is fetched via _itemMetadata alongside ItemMetadata changeset and displayOption', async () => {
    const query = contentQuery(await fetchItem(modes[1].schema(true)));
    const fields = itemMetadataFields(query);

    expect(fields).toContain('changeset');
    expect(fields).toContain('displayOption');
    expect(query).toContain('_itemMetadata');
    expect(query).toContain('categories');
  });

  test('ItemMetadata fragment omits categories when taxonomy disabled', async () => {
    const fields = itemMetadataFields(contentQuery(await fetchItem({}, { taxonomy: 'off' })));

    expect(fields).toContain('changeset');
    expect(fields).toContain('displayOption');
    expect(fields).not.toContain('categories');
  });
});
