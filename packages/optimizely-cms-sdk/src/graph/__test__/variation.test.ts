import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { getVariationClause, getVariationMode } from '../filters.js';

describe('variation filters', () => {
  let client: GraphClient;
  let mockRequest: any;

  beforeEach(() => {
    initContentTypeRegistry([
      contentType({ key: 'Page', displayName: 'Page', baseType: '_page' }),
    ]);
    client = new GraphClient('test-key');
    mockRequest = vi.spyOn(client, 'request');
    mockRequest
      .mockResolvedValueOnce({
        _Content: { item: { _metadata: { types: ['Page'] } } },
        damAssetType: null,
      })
      .mockResolvedValue({ _Content: { items: [] } });
  });

  // Defect 1: the metadata probe declared $v1..$vN but was never given them,
  // so Graph saw `value: [null]` and answered 500.
  test('every declared $vN has a value in the variables sent with it', async () => {
    await client.getContentByPath('/', {
      variation: { include: 'SOME', value: ['business', 'personal'] },
    });

    expect(mockRequest.mock.calls.length).toBeGreaterThan(0);
    for (const [query, variables] of mockRequest.mock.calls) {
      const declared = [...query.matchAll(/\$(v\d+):/g)].map(m => m[1]);
      for (const name of declared) {
        expect(variables[name], `${name} declared but not passed`).toBeDefined();
      }
    }
  });

  // Defect 2: includeOriginal was dropped, so a visitor matching no variation
  // got nothing instead of the base version.
  test('includeOriginal reaches the generated clause', () => {
    const mode = getVariationMode({
      include: 'SOME',
      value: ['business'],
      includeOriginal: true,
    });
    expect(getVariationClause(mode)).toContain('includeOriginal: true');

    const without = getVariationMode({ include: 'SOME', value: ['business'] });
    expect(getVariationClause(without)).not.toContain('includeOriginal');
  });
});
