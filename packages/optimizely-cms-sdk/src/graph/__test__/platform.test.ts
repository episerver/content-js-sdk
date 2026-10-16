/**
 * @vitest-environment node
 */
import { describe, expect, test, vi } from 'vitest';
import { config, getClient, GraphClient } from '../index.js';
import { type GraphPlatform, saasPlatform } from '../platform.js';

const customPlatform = (): GraphPlatform => ({
  name: 'custom',
  metadataQuery: () => 'METADATA',
  readMetadata: () => ({
    contentTypeName: 'Article',
    damEnabled: false,
    taxonomyEnabled: false,
    formsOnPage: false,
  }),
  contentQuery: vi.fn(() => 'CONTENT'),
  normalize: vi.fn(item => ({ ...item, normalized: true })),
});

describe('platform option', () => {
  test('defaults to SaaS', () => {
    expect(new GraphClient('key').platform).toBe(saasPlatform);
  });

  test('is inherited from config() and overridable per client', () => {
    const configured = customPlatform();
    const override = customPlatform();
    config({ apiKey: 'key', platform: configured });

    expect(getClient().platform).toBe(configured);
    expect(getClient({ platform: override }).platform).toBe(override);
  });

  test('drives the metadata query, content query and normalisation', async () => {
    const platform = customPlatform();
    const client = new GraphClient('key', { platform });
    const request = vi
      .spyOn(client, 'request')
      .mockImplementation(async query =>
        query === 'METADATA' ? {} : { _Content: { item: { _metadata: { key: 'abc' } } } },
      );

    const result = await client.getContent({ key: 'abc' });

    expect(request.mock.calls.map(([query]) => query)).toEqual(['METADATA', 'CONTENT']);
    expect(platform.contentQuery).toHaveBeenCalledWith(
      'single',
      'Article',
      expect.any(Object),
    );
    expect(result).toEqual({ _metadata: { key: 'abc' }, normalized: true });
  });
});
