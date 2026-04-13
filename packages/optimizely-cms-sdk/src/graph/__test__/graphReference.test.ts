/**
 * @vitest-environment node
 */
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { referenceFilter } from '../filters.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';

vi.mock('../../context/config.js', () => ({
  setContext: vi.fn(),
}));

describe('GraphReference type and filters', () => {
  describe('referenceFilter()', () => {
    test('creates filter with key only', () => {
      const result = referenceFilter({ key: 'abc123' });
      expect(result).toEqual({
        where: {
          _metadata: {
            key: { eq: 'abc123' },
          },
        },
      });
    });

    test('creates filter with key and locale', () => {
      const result = referenceFilter({ key: 'abc123', locale: 'en' });
      expect(result).toEqual({
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            locale: { eq: 'en' },
          },
        },
      });
    });

    test('creates filter with key and version', () => {
      const result = referenceFilter({ key: 'abc123', version: '1.0' });
      expect(result).toEqual({
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            version: { eq: '1.0' },
          },
        },
      });
    });

    test('version takes priority over locale', () => {
      const result = referenceFilter({
        key: 'abc123',
        locale: 'en',
        version: '1.0',
      });
      expect(result).toEqual({
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            version: { eq: '1.0' },
          },
        },
      });
      expect(result.where?._metadata).not.toHaveProperty('locale');
    });
  });
});

describe('GraphClient.parseGraphReference()', () => {
  let client: GraphClient;

  beforeEach(() => {
    client = new GraphClient('test-key');
  });

  test('parses key only format', () => {
    const result = (client as any).parseGraphReference('graph://abc123');
    expect(result).toEqual({
      key: 'abc123',
    });
  });

  test('parses type/key format', () => {
    const result = (client as any).parseGraphReference('graph://Page/abc123');
    expect(result).toEqual({
      type: 'Page',
      key: 'abc123',
    });
  });

  test('parses source/type/key format', () => {
    const result = (client as any).parseGraphReference(
      'graph://cms/Page/abc123',
    );
    expect(result).toEqual({
      source: 'cms',
      type: 'Page',
      key: 'abc123',
    });
  });

  test('parses with locale query parameter', () => {
    const result = (client as any).parseGraphReference(
      'graph://abc123?loc=en',
    );
    expect(result).toEqual({
      key: 'abc123',
      locale: 'en',
    });
  });

  test('parses with version query parameter', () => {
    const result = (client as any).parseGraphReference(
      'graph://abc123?ver=1.0',
    );
    expect(result).toEqual({
      key: 'abc123',
      version: '1.0',
    });
  });

  test('parses with both locale and version', () => {
    const result = (client as any).parseGraphReference(
      'graph://abc123?loc=en&ver=1.0',
    );
    expect(result).toEqual({
      key: 'abc123',
      locale: 'en',
      version: '1.0',
    });
  });

  test('parses full format with all parameters', () => {
    const result = (client as any).parseGraphReference(
      'graph://cms/Page/abc123?loc=en&ver=1.0',
    );
    expect(result).toEqual({
      source: 'cms',
      type: 'Page',
      key: 'abc123',
      locale: 'en',
      version: '1.0',
    });
  });

  test('throws error for invalid protocol', () => {
    expect(() => {
      (client as any).parseGraphReference('http://abc123');
    }).toThrow('Invalid graph reference format');
  });

  test('throws error for missing key', () => {
    expect(() => {
      (client as any).parseGraphReference('graph://');
    }).toThrow('Expected at least key to be present');
  });

  test('handles trailing slashes', () => {
    const result = (client as any).parseGraphReference(
      'graph://cms/Page/abc123/',
    );
    expect(result).toEqual({
      source: 'cms',
      type: 'Page',
      key: 'abc123',
    });
  });
});

describe('GraphClient.getContent() with GraphReference', () => {
  let client: GraphClient;
  let mockRequest: any;

  beforeEach(() => {
    // Initialize content type registry with a test Page type
    const pageType = contentType({
      key: 'Page',
      displayName: 'Page',
      baseType: '_page',
      properties: {
        title: { type: 'string', displayName: 'Title' },
        content: { type: 'string', displayName: 'Content' },
      },
    });
    initContentTypeRegistry([pageType]);

    client = new GraphClient('test-key');
    mockRequest = vi.spyOn(client, 'request');
  });

  test('fetches content by key only (latest published)', async () => {
    // Mock getContentMetaData response
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      // Mock actual content response
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await client.getContent({ key: 'abc123' });

    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      {
        where: {
          _metadata: {
            key: { eq: 'abc123' },
          },
        },
      },
      undefined,
      true,
      undefined,
    );
  });

  test('fetches content by key and locale', async () => {
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await client.getContent({ key: 'abc123', locale: 'en' });

    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      {
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            locale: { eq: 'en' },
          },
        },
      },
      undefined,
      true,
      undefined,
    );
  });

  test('fetches content by key and version', async () => {
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await client.getContent({ key: 'abc123', version: '1.0' });

    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      {
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            version: { eq: '1.0' },
          },
        },
      },
      undefined,
      true,
      undefined,
    );
  });

  test('version has priority over locale', async () => {
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await client.getContent({
      key: 'abc123',
      locale: 'en',
      version: '1.0',
    });

    // Should only have version in the filter, not locale
    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      {
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            version: { eq: '1.0' },
          },
        },
      },
      undefined,
      true,
      undefined,
    );

    const variables = mockRequest.mock.calls[0][1];
    expect(variables.where._metadata).not.toHaveProperty('locale');
  });

  test('supports string format (graph://)', async () => {
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await client.getContent('graph://cms/Page/abc123?loc=en&ver=1.0');

    // Should parse the string and use version (not locale due to priority)
    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      {
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            version: { eq: '1.0' },
          },
        },
      },
      undefined,
      true,
      undefined,
    );
  });

  test('supports preview token', async () => {
    const previewToken = 'test-preview-token';

    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await client.getContent({ key: 'abc123', version: '1.0' }, { previewToken });

    // Both requests should include preview token
    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.any(Object),
      previewToken,
      false,
      undefined,
    );
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      previewToken,
      false, // Don't cache preview content
      undefined,
    );
  });

  test('returns null when content not found', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _metadata: {
            types: null,
          },
        },
      },
      damAssetType: null,
    });

    const result = await client.getContent({ key: 'nonexistent' });

    expect(result).toBeNull();
  });

  test('removes type prefixes from response', async () => {
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
            Page__content: 'Test content',
            _metadata: {
              key: 'abc123',
            },
          },
        },
      });

    const result = await client.getContent({ key: 'abc123' });

    expect(result).toEqual({
      __typename: 'Page',
      title: 'Test Page',
      content: 'Test content',
      _metadata: {
        key: 'abc123',
      },
    });
  });

  test('cache parameter is true when not in preview mode', async () => {
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await client.getContent({ key: 'abc123' });

    // Second call should have cache = true (4th parameter)
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      undefined,
      true, // Cache enabled for non-preview
      undefined,
    );
  });

  test('cache parameter is false when in preview mode', async () => {
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await client.getContent({ key: 'abc123' }, { previewToken: 'preview-token' });

    // Second call should have cache = false (4th parameter)
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      'preview-token',
      false, // Cache disabled for preview
      undefined,
    );
  });

  test('slot parameter defaults to undefined (Current)', async () => {
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await client.getContent({ key: 'abc123' });

    // slot (6th parameter) should default to undefined
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      undefined,
      true,
      undefined, // no slot = Current (default)
    );
  });

  test('slot parameter can be set to New for smooth rebuild', async () => {
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await client.getContent({ key: 'abc123' }, { slot: 'New' });

    // slot (6th parameter) should be 'New' → sends cg-query-new header
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      undefined,
      true,
      'New', // slot set to New for smooth rebuild
    );
  });

  test('slot parameter inherits from global config', async () => {
    const customClient = new GraphClient('test-key', { slot: 'New' });
    const customMockRequest = vi.spyOn(customClient, 'request');

    customMockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await customClient.getContent({ key: 'abc123' });

    expect(customMockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      undefined,
      true,
      'New', // inherited from global config
    );
  });

  test('per-request options override global config for all query options', async () => {
    const customClient = new GraphClient('test-key', {
      cache: true,
      slot: 'Current',
    });
    const customMockRequest = vi.spyOn(customClient, 'request');

    customMockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: {
              types: ['Page'],
            },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test Page',
          },
        },
      });

    await customClient.getContent({ key: 'abc123' }, {
      cache: false,
      slot: 'New',
    });

    expect(customMockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      undefined,
      false, // cache overridden
      'New', // slot overridden
    );
  });
});

describe('GraphClient.getPath() with GraphReference', () => {
  let client: GraphClient;
  let mockRequest: any;

  beforeEach(() => {
    client = new GraphClient('test-key');
    mockRequest = vi.spyOn(client, 'request');
  });

  test('fetches path using GraphReference object', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: 'test-id',
          _metadata: {
            path: ['key1', 'key2', 'key3'],
          },
          _link: {
            _Page: {
              items: [
                { _metadata: { key: 'key1', displayName: 'Home' } },
                { _metadata: { key: 'key2', displayName: 'Blog' } },
                { _metadata: { key: 'key3', displayName: 'Post' } },
              ],
            },
          },
        },
      },
    });

    const result = await client.getPath({ key: 'abc123', locale: 'en' });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            locale: { eq: 'en' },
          },
        },
        locale: ['en'],
      },
      undefined,
      true,
      undefined,
    );
    expect(result).toHaveLength(3);
  });

  test('fetches path using graph:// string format', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: 'test-id',
          _metadata: {
            path: ['key1'],
          },
          _link: {
            _Page: {
              items: [{ _metadata: { key: 'key1', displayName: 'Home' } }],
            },
          },
        },
      },
    });

    await client.getPath('graph://Page/abc123?loc=en');

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            locale: { eq: 'en' },
          },
        },
        locale: ['en'],
      },
      undefined,
      true,
      undefined,
    );
  });

  test('fetches path using regular path string', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: 'test-id',
          _metadata: {
            path: ['key1'],
          },
          _link: {
            _Page: {
              items: [{ _metadata: { key: 'key1', displayName: 'Home' } }],
            },
          },
        },
      },
    });

    await client.getPath('/blog/post-1');

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        where: {
          _or: expect.any(Array),
        },
      },
      undefined,
      true,
      undefined,
    );
  });

  test('returns null when page does not exist', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: null,
        },
      },
    });

    const result = await client.getPath({ key: 'nonexistent' });

    expect(result).toBeNull();
  });

  test('supports locales option with GraphReference', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: 'test-id',
          _metadata: {
            path: ['key1'],
          },
          _link: {
            _Page: {
              items: [{ _metadata: { key: 'key1' } }],
            },
          },
        },
      },
    });

    await client.getPath({ key: 'abc123' }, { locales: ['en', 'sv'] });

    expect(mockRequest).toHaveBeenCalledWith(expect.any(String), {
      where: {
        _metadata: {
          key: { eq: 'abc123' },
        },
      },
      locale: ['en', 'sv'],
    }, undefined, true, undefined);
  });
});

describe('GraphClient.getItems() with GraphReference', () => {
  let client: GraphClient;
  let mockRequest: any;

  beforeEach(() => {
    client = new GraphClient('test-key');
    mockRequest = vi.spyOn(client, 'request');
  });

  test('fetches items using GraphReference object', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: 'test-id',
          _link: {
            _Page: {
              items: [
                { _metadata: { key: 'child1', displayName: 'Child 1' } },
                { _metadata: { key: 'child2', displayName: 'Child 2' } },
              ],
            },
          },
        },
      },
    });

    const result = await client.getItems({ key: 'abc123', locale: 'en' });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            locale: { eq: 'en' },
          },
        },
        locale: ['en'],
      },
      undefined,
      true,
      undefined,
    );
    expect(result).toHaveLength(2);
  });

  test('fetches items using graph:// string format', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: 'test-id',
          _link: {
            _Page: {
              items: [{ _metadata: { key: 'child1' } }],
            },
          },
        },
      },
    });

    await client.getItems('graph://Page/abc123?loc=en');

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        where: {
          _metadata: {
            key: { eq: 'abc123' },
            locale: { eq: 'en' },
          },
        },
        locale: ['en'],
      },
      undefined,
      true,
      undefined,
    );
  });

  test('fetches items using regular path string', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: 'test-id',
          _link: {
            _Page: {
              items: [],
            },
          },
        },
      },
    });

    await client.getItems('/blog');

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        where: {
          _or: expect.any(Array),
        },
      },
      undefined,
      true,
      undefined,
    );
  });

  test('returns null when page does not exist', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: null,
        },
      },
    });

    const result = await client.getItems({ key: 'nonexistent' });

    expect(result).toBeNull();
  });

  test('supports locales option with GraphReference', async () => {
    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: 'test-id',
          _link: {
            _Page: {
              items: [],
            },
          },
        },
      },
    });

    await client.getItems({ key: 'abc123' }, { locales: ['en', 'sv'] });

    expect(mockRequest).toHaveBeenCalledWith(expect.any(String), {
      where: {
        _metadata: {
          key: { eq: 'abc123' },
        },
      },
      locale: ['en', 'sv'],
    }, undefined, true, undefined);
  });

  test('returns items with metadata', async () => {
    const mockItems = [
      {
        _metadata: {
          key: 'child1',
          displayName: 'Child 1',
          locale: 'en',
          types: ['Page'],
        },
      },
      {
        _metadata: {
          key: 'child2',
          displayName: 'Child 2',
          locale: 'en',
          types: ['Page'],
        },
      },
    ];

    mockRequest.mockResolvedValueOnce({
      _Content: {
        item: {
          _id: 'test-id',
          _link: {
            _Page: {
              items: mockItems,
            },
          },
        },
      },
    });

    const result = await client.getItems({ key: 'abc123' });

    expect(result).toEqual(mockItems);
  });
});

describe('GraphClient.getPreviewContent() query options', () => {
  let client: GraphClient;
  let mockRequest: any;

  const previewParams = {
    preview_token: 'test-token',
    key: 'abc123',
    ctx: 'edit',
    ver: '1.0',
    loc: 'en',
  };

  beforeEach(() => {
    client = new GraphClient('test-key');
    mockRequest = vi.spyOn(client, 'request');
  });

  test('uses global slot by default', async () => {
    const customClient = new GraphClient('test-key', { slot: 'New' });
    const customMockRequest = vi.spyOn(customClient, 'request');

    customMockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: { types: ['Page'] },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test',
          },
        },
      });

    await customClient.getPreviewContent(previewParams);

    // Both calls should use global config: cache=false, slot='New'
    expect(customMockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.any(Object),
      'test-token',
      false,
      'New',
    );
    expect(customMockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      'test-token',
      false,
      'New',
    );
  });

  test('per-request options override global config', async () => {
    const customClient = new GraphClient('test-key', { slot: 'Current' });
    const customMockRequest = vi.spyOn(customClient, 'request');

    customMockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: { types: ['Page'] },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test',
          },
        },
      });

    await customClient.getPreviewContent(previewParams, { slot: 'New' });

    expect(customMockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      'test-token',
      false,
      'New', // slot overridden
    );
  });

  test('cache is always false for preview', async () => {
    mockRequest
      .mockResolvedValueOnce({
        _Content: {
          item: {
            _metadata: { types: ['Page'] },
          },
        },
        damAssetType: null,
      })
      .mockResolvedValueOnce({
        _Content: {
          item: {
            __typename: 'Page',
            Page__title: 'Test',
          },
        },
      });

    await client.getPreviewContent(previewParams, { cache: true });

    // cache should still be false regardless of options
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      'test-token',
      false, // always false for preview
      undefined,
    );
  });
});
