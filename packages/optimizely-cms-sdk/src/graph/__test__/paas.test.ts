/**
 * @vitest-environment node
 */
import { describe, expect, test } from 'vitest';
import { config, getClient } from '../index.js';
import { paasPlatform } from '../paas.js';

const AUTOMATIC = { dam: 'automatic', taxonomy: 'automatic' } as const;

describe('paasPlatform', () => {
  test("is picked up by clients built from config({ platform: 'paas' })", () => {
    config({ apiKey: 'key', platform: 'paas' });

    expect(getClient().platform).toBe(paasPlatform);
  });

  describe('readMetadata', () => {
    test('detects DAM, taxonomy and forms from the probe', () => {
      const data = {
        _Content: { item: { _metadata: { types: ['Article', '_Page'] } } },
        damAssetType: { __typename: '__Type' },
        taxonomyType: { fields: [{ name: 'categories' }] },
        formsOnPage: { total: 1 },
      };

      expect(paasPlatform.readMetadata(data, AUTOMATIC)).toEqual({
        contentTypeName: 'Article',
        damEnabled: true,
        taxonomyEnabled: true,
        formsOnPage: true,
      });
    });

    test('reports nothing when the probe finds nothing', () => {
      const data = { _Content: { item: null }, damAssetType: null, taxonomyType: null };

      expect(paasPlatform.readMetadata(data, AUTOMATIC)).toEqual({
        contentTypeName: undefined,
        damEnabled: false,
        taxonomyEnabled: false,
        formsOnPage: false,
      });
    });

    test('forced modes override detection', () => {
      const data = {
        damAssetType: null,
        taxonomyType: { fields: [{ name: 'categories' }] },
      };
      const metadata = paasPlatform.readMetadata(data, { dam: 'on', taxonomy: 'off' });

      expect(metadata.damEnabled).toBe(true);
      expect(metadata.taxonomyEnabled).toBe(false);
    });
  });

  test('normalize strips type prefixes and lifts section nodes', () => {
    const item = {
      __typename: 'Hero',
      _metadata: { types: ['Hero'] },
      Hero__title: 'Hello',
      composition: { nodeType: 'section', nodes: [{ key: 'row' }] },
    };

    expect(paasPlatform.normalize(item)).toMatchObject({
      title: 'Hello',
      nodes: [{ key: 'row' }],
    });
  });
});
