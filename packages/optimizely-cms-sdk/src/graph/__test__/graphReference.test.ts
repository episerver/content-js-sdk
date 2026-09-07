/**
 * @vitest-environment node
 */
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { referenceScalarFilter } from '../filters.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';

vi.mock('../../context/config.js', () => ({
  setContext: vi.fn(),
}));

describe('GraphReference type and filters', () => {
  describe('referenceScalarFilter()', () => {
    test('creates filter with key only', () => {
      const result = referenceScalarFilter({ key: '880777d5a2824399b07e93e3ca70668e' });
      expect(result).toEqual({
        filterShape: 'by-key',
        variables: { key: '880777d5a2824399b07e93e3ca70668e' },
      });
    });

    test('creates filter with key and locale', () => {
      const result = referenceScalarFilter({
        key: '880777d5a2824399b07e93e3ca70668e',
        locale: 'en',
      });
      expect(result).toEqual({
        filterShape: 'by-key',
        variables: {
          key: '880777d5a2824399b07e93e3ca70668e',
          metadataLocale: 'en',
        },
      });
    });

    test('creates filter with key and version', () => {
      const result = referenceScalarFilter({
        key: '880777d5a2824399b07e93e3ca70668e',
        version: '123',
      });
      expect(result).toEqual({
        filterShape: 'by-key',
        variables: {
          key: '880777d5a2824399b07e93e3ca70668e',
          version: '123',
        },
      });
    });

    test('includes both version and locale when both are provided', () => {
      const result = referenceScalarFilter({
        key: '880777d5a2824399b07e93e3ca70668e',
        locale: 'en',
        version: '123',
      });
      expect(result.filterShape).toBe('by-key');
      expect(result.variables).toEqual({
        key: '880777d5a2824399b07e93e3ca70668e',
        version: '123',
        metadataLocale: 'en',
      });
    });
  });
});

describe('GraphClient.parseGraphReference()', () => {
  let client: GraphClient;

  beforeEach(() => {
    client = new GraphClient('test-key');
  });

  test('parses key only format', () => {
    const result = (client as any).parseGraphReference(
      'graph://880777d5a2824399b07e93e3ca70668e',
    );
    expect(result).toEqual({
      key: '880777d5a2824399b07e93e3ca70668e',
    });
  });

  test('parses type/key format', () => {
    const result = (client as any).parseGraphReference(
      'graph://Page/880777d5a2824399b07e93e3ca70668e',
    );
    expect(result).toEqual({
      type: 'Page',
      key: '880777d5a2824399b07e93e3ca70668e',
    });
  });

  test('parses source/type/key format', () => {
    const result = (client as any).parseGraphReference(
      'graph://cms/Page/880777d5a2824399b07e93e3ca70668e',
    );
    expect(result).toEqual({
      source: 'cms',
      type: 'Page',
      key: '880777d5a2824399b07e93e3ca70668e',
    });
  });

  test('parses with locale query parameter', () => {
    const result = (client as any).parseGraphReference(
      'graph://880777d5a2824399b07e93e3ca70668e?loc=en',
    );
    expect(result).toEqual({
      key: '880777d5a2824399b07e93e3ca70668e',
      locale: 'en',
    });
  });

  test('parses with version query parameter', () => {
    const result = (client as any).parseGraphReference(
      'graph://880777d5a2824399b07e93e3ca70668e?ver=123',
    );
    expect(result).toEqual({
      key: '880777d5a2824399b07e93e3ca70668e',
      version: '123',
    });
  });

  test('parses with both locale and version', () => {
    const result = (client as any).parseGraphReference(
      'graph://880777d5a2824399b07e93e3ca70668e?loc=en&ver=123',
    );
    expect(result).toEqual({
      key: '880777d5a2824399b07e93e3ca70668e',
      locale: 'en',
      version: '123',
    });
  });

  test('parses full format with all parameters', () => {
    const result = (client as any).parseGraphReference(
      'graph://cms/Page/880777d5a2824399b07e93e3ca70668e?loc=en&ver=123',
    );
    expect(result).toEqual({
      source: 'cms',
      type: 'Page',
      key: '880777d5a2824399b07e93e3ca70668e',
      locale: 'en',
      version: '123',
    });
  });

  test('throws error for invalid protocol', () => {
    expect(() => {
      (client as any).parseGraphReference('http://880777d5a2824399b07e93e3ca70668e');
    }).toThrow('Invalid graph reference format');
  });

  test('throws error for missing key', () => {
    expect(() => {
      (client as any).parseGraphReference('graph://');
    }).toThrow('Expected at least key to be present');
  });

  test('handles trailing slashes', () => {
    const result = (client as any).parseGraphReference(
      'graph://cms/Page/880777d5a2824399b07e93e3ca70668e/',
    );
    expect(result).toEqual({
      source: 'cms',
      type: 'Page',
      key: '880777d5a2824399b07e93e3ca70668e',
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

    await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e' });

    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        withForms: false,
        formsWhere: null,
      },
      undefined,
      true,
      undefined,
      true,
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

    await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e', locale: 'en' });

    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        metadataLocale: 'en',
        withForms: false,
        formsWhere: null,
      },
      undefined,
      true,
      undefined,
      true,
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

    await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e', version: '123' });

    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        version: '123',
        withForms: false,
        formsWhere: null,
      },
      undefined,
      true,
      undefined,
      true,
    );
  });

  test('includes both version and locale when both provided', async () => {
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
      key: '880777d5a2824399b07e93e3ca70668e',
      locale: 'en',
      version: '123',
    });

    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        version: '123',
        metadataLocale: 'en',
        withForms: false,
        formsWhere: null,
      },
      undefined,
      true,
      undefined,
      true,
    );
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

    await client.getContent(
      'graph://cms/Page/880777d5a2824399b07e93e3ca70668e?loc=en&ver=123',
    );

    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        version: '123',
        metadataLocale: 'en',
        withForms: false,
        formsWhere: null,
      },
      undefined,
      true,
      undefined,
      true,
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

    await client.getContent(
      { key: '880777d5a2824399b07e93e3ca70668e', version: '123' },
      { previewToken },
    );

    // Both requests should include preview token
    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.any(Object),
      previewToken,
      false,
      undefined,
      true,
    );
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      previewToken,
      false, // Don't cache preview content
      undefined,
      true,
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
              key: '880777d5a2824399b07e93e3ca70668e',
            },
          },
        },
      });

    const result = await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e' });

    expect(result).toEqual({
      __typename: 'Page',
      title: 'Test Page',
      content: 'Test content',
      _metadata: {
        key: '880777d5a2824399b07e93e3ca70668e',
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

    await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e' });

    // Second call should have cache = true (4th parameter)
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      undefined,
      true, // Cache enabled for non-preview
      undefined,
      true,
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

    await client.getContent(
      { key: '880777d5a2824399b07e93e3ca70668e' },
      { previewToken: 'preview-token' },
    );

    // Second call should have cache = false (4th parameter)
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      'preview-token',
      false, // Cache disabled for preview
      undefined,
      true,
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

    await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e' });

    // slot (6th parameter) should default to undefined
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      undefined,
      true,
      undefined, // no slot = Current (default)
      true,
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

    await client.getContent({ key: '880777d5a2824399b07e93e3ca70668e' }, { slot: 'New' });

    // slot (6th parameter) should be 'New' → sends cg-query-new header
    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      undefined,
      true,
      'New', // slot set to New for smooth rebuild
      true,
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

    await customClient.getContent({ key: '880777d5a2824399b07e93e3ca70668e' });

    expect(customMockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      undefined,
      true,
      'New', // inherited from global config
      true,
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

    await customClient.getContent(
      { key: '880777d5a2824399b07e93e3ca70668e' },
      {
        cache: false,
        slot: 'New',
      },
    );

    expect(customMockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      undefined,
      false, // cache overridden
      'New', // slot overridden
      true,
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

    const result = await client.getPath({
      key: '880777d5a2824399b07e93e3ca70668e',
      locale: 'en',
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        metadataLocale: 'en',
        locale: ['en'],
      },
      undefined,
      true,
      undefined,
      true,
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

    await client.getPath('graph://Page/880777d5a2824399b07e93e3ca70668e?loc=en');

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        metadataLocale: 'en',
        locale: ['en'],
      },
      undefined,
      true,
      undefined,
      true,
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
        path: '/blog/post-1/',
        pathNoSlash: '/blog/post-1',
        locale: undefined,
      },
      undefined,
      true,
      undefined,
      true,
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

    await client.getPath(
      { key: '880777d5a2824399b07e93e3ca70668e' },
      { locales: ['en', 'sv'] },
    );

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        locale: ['en', 'sv'],
      },
      undefined,
      true,
      undefined,
      true,
    );
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

    const result = await client.getItems({
      key: '880777d5a2824399b07e93e3ca70668e',
      locale: 'en',
    });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        metadataLocale: 'en',
        locale: ['en'],
      },
      undefined,
      true,
      undefined,
      true,
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

    await client.getItems('graph://Page/880777d5a2824399b07e93e3ca70668e?loc=en');

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        metadataLocale: 'en',
        locale: ['en'],
      },
      undefined,
      true,
      undefined,
      true,
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
        path: '/blog/',
        pathNoSlash: '/blog',
        locale: undefined,
      },
      undefined,
      true,
      undefined,
      true,
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

    await client.getItems(
      { key: '880777d5a2824399b07e93e3ca70668e' },
      { locales: ['en', 'sv'] },
    );

    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      {
        key: '880777d5a2824399b07e93e3ca70668e',
        locale: ['en', 'sv'],
      },
      undefined,
      true,
      undefined,
      true,
    );
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

    const result = await client.getItems({ key: '880777d5a2824399b07e93e3ca70668e' });

    expect(result).toEqual(mockItems);
  });
});

describe('GraphClient.getPreviewContent() query options', () => {
  let client: GraphClient;
  let mockRequest: any;

  const previewParams = {
    preview_token: 'test-token',
    key: '880777d5a2824399b07e93e3ca70668e',
    ctx: 'edit',
    ver: '123',
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
      true,
    );
    expect(customMockRequest).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Object),
      'test-token',
      false,
      'New',
      true,
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
      true,
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
      true,
    );
  });
});
