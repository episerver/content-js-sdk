/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { config, getClient, GraphClient } from '../index.js';
import { OptimizelyGraphError } from '../error.js';
import { saasPlatform } from '../platform.js';
import { paasPlatform } from '../paas.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('platform option', () => {
  test('defaults to SaaS', () => {
    expect(new GraphClient('key').platform).toBe(saasPlatform);
  });

  test('is inherited from config() and overridable per client', () => {
    config({ apiKey: 'key', platform: 'paas' });

    expect(getClient().platform).toBe(paasPlatform);
    expect(getClient({ platform: 'saas' }).platform).toBe(saasPlatform);
  });

  test('rejects an unknown platform', () => {
    const platform = 'cms12' as any;

    expect(() => config({ apiKey: 'key', platform })).toThrow(OptimizelyGraphError);
    expect(() => new GraphClient('key', { platform })).toThrow(
      "Unknown platform 'cms12'",
    );
  });

  test('drives the metadata query, content query and normalisation', async () => {
    vi.spyOn(paasPlatform, 'metadataQuery').mockReturnValue('METADATA');
    vi.spyOn(paasPlatform, 'readMetadata').mockReturnValue({
      contentTypeName: 'Article',
      damDetected: false,
      taxonomyDetected: false,
      formsOnPage: false,
    });
    const contentQuery = vi
      .spyOn(paasPlatform, 'contentQuery')
      .mockReturnValue('CONTENT');
    vi.spyOn(paasPlatform, 'normalize').mockImplementation(item => ({
      ...item,
      normalized: true,
    }));

    const client = new GraphClient('key', { platform: 'paas' });
    const request = vi
      .spyOn(client, 'request')
      .mockImplementation(async query =>
        query === 'METADATA' ? {} : { _Content: { item: { _metadata: { key: 'abc' } } } },
      );

    const result = await client.getContent({ key: 'abc' });

    expect(request.mock.calls.map(([query]) => query)).toEqual(['METADATA', 'CONTENT']);
    expect(contentQuery).toHaveBeenCalledWith('single', 'Article', expect.any(Object));
    expect(result).toEqual({ _metadata: { key: 'abc' }, normalized: true });
  });
});
