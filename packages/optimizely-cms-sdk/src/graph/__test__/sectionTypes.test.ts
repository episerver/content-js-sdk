import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';
import { FormContentTypes } from '../../model/formContentTypes.js';

/**
 * `composition` comes from Graph's `_ISection` interface, and declaring
 * `sectionEnabled` locally does not earn it. The list of real implementers is
 * read from the schema, in its own request: Graph nulls `possibleTypes` when the
 * introspection shares a document with a data field, which silently produces the
 * opposite of the intended answer.
 */

const Section = contentType({
  key: 'MySection',
  displayName: 'My Section',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled'],
  properties: { title: { type: 'string' } },
});

const Plain = contentType({
  key: 'PlainPage',
  displayName: 'Plain',
  baseType: '_page',
  properties: { title: { type: 'string' } },
});

let client: GraphClient;
let request: any;

const stub = () => {
  request = vi.spyOn(client, 'request').mockImplementation(async (query: string) => {
    if (query.includes('GetSectionTypes')) {
      return {
        sectionTypes: { possibleTypes: [{ name: 'MySection' }, { name: '_Section' }] },
      };
    }
    if (query.includes('GetContentMetadata')) {
      return {
        _Content: { item: { _metadata: { types: ['PlainPage'] } } },
        damAssetType: null,
      };
    }
    return { _Content: { item: { __typename: 'PlainPage' } } };
  });
};

const schemaLookups = () =>
  request.mock.calls.filter((call: any[]) => String(call[0]).includes('GetSectionTypes'));

beforeEach(() => {
  client = new GraphClient('test-key');
});

describe('looking up which types are sections', () => {
  test('is skipped when the application has no section of its own', async () => {
    initContentTypeRegistry([Plain, ...FormContentTypes]);
    refreshCache();
    stub();

    await client.getContent({ key: 'a' });

    // Forms are covered by the fallback, so nothing here needs the schema.
    expect(schemaLookups()).toHaveLength(0);
  });

  test('happens once per endpoint, not once per page', async () => {
    initContentTypeRegistry([Plain, Section]);
    refreshCache();
    stub();

    await client.getContent({ key: 'a' });
    await client.getContent({ key: 'b' });
    // A framework builds a fresh client per request; the answer is still shared.
    const second = new GraphClient('test-key');
    vi.spyOn(second, 'request').mockImplementation(request.getMockImplementation()!);
    await second.getContent({ key: 'c' });

    expect(schemaLookups()).toHaveLength(1);
  });

  // The lookup is a schema question, not a content one. Failing it must not stop
  // a page rendering — the query just falls back to the conservative default.
  test('a failed lookup does not break the fetch', async () => {
    initContentTypeRegistry([Plain, Section]);
    refreshCache();
    const failing = new GraphClient('other-key');
    vi.spyOn(failing, 'request').mockImplementation(async (query: string) => {
      if (query.includes('GetSectionTypes')) throw new Error('schema unavailable');
      if (query.includes('GetContentMetadata')) {
        return {
          _Content: { item: { _metadata: { types: ['PlainPage'] } } },
          damAssetType: null,
        };
      }
      return { _Content: { item: { __typename: 'PlainPage' } } };
    });

    await expect(failing.getContent({ key: 'a' })).resolves.toBeTruthy();
  });
});
