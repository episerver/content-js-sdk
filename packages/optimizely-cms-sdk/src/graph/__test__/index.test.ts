import { describe, expect, test, beforeEach, vi, afterEach } from 'vitest';
import { removeTypePrefix, GraphClient } from '../index.js';
import {
  configureAdapter,
  getContextData,
  initializeRequestContext,
} from '../../context/config.js';
import type { ContextAdapter, ContextData } from '../../context/baseContext.js';
import { contentType, initContentTypeRegistry } from '../../index.js';

describe('removeTypePrefix()', () => {
  test('basic functionality', () => {
    const input = {
      __typename: 'T',
      T__p1: 'p1',
      T__p2: 42,
      T__p3: ['p3', 32],
      T__p4: { nested: 'p4' },
      T__p5: { nested: ['p5'] },
      ShouldBeKept__p6: 'p6',
    };
    const expected = {
      __typename: 'T',
      p1: 'p1',
      p2: 42,
      p3: ['p3', 32],
      p4: { nested: 'p4' },
      p5: { nested: ['p5'] },
      ShouldBeKept__p6: 'p6',
    };
    expect(removeTypePrefix(input)).toStrictEqual(expected);
  });

  test('should remove prefixes only in the same level', () => {
    const input = {
      __typename: 'T',
      T__p1: { T_shouldBeKept: 'shouldBeKept' },
    };
    const expected = {
      __typename: 'T',
      p1: { T_shouldBeKept: 'shouldBeKept' },
    };
    expect(removeTypePrefix(input)).toStrictEqual(expected);
  });

  test('should work for nested objects', () => {
    const input = {
      __typename: 'T',
      T__p1: {
        __typename: 'U',
        U__p1: 'p1',
        U__p2: {
          __typename: 'V',
          V__p1: 'p1',
        },
      },
      T__p2: [{ __typename: 'U', U__p1: 'p1' }],
    };
    const expected = {
      __typename: 'T',
      p1: {
        __typename: 'U',
        p1: 'p1',
        p2: {
          __typename: 'V',
          p1: 'p1',
        },
      },
      p2: [{ __typename: 'U', p1: 'p1' }],
    };
    expect(removeTypePrefix(input)).toStrictEqual(expected);
  });

  test('should not do anything if __typename is not found', () => {
    const input = {
      T__p1: 'hello',
      T__p2: 42,
      T__p3: ['hello', 32],
      T__p4: { nested: 'nested' },
      T__p5: { nested: ['hello'] },
    };

    expect(removeTypePrefix(input)).toStrictEqual(input);
  });
});

describe('GraphClient - Context Integration', () => {
  // Mock adapter for testing
  class MockAdapter implements ContextAdapter {
    private data: ContextData = {};

    initializeContext(): void {
      this.data = {};
    }

    getData(): ContextData | undefined {
      return this.data;
    }

    setData(value: Partial<ContextData>): void {
      Object.assign(this.data, value);
    }

    clear(): void {
      this.data = {};
    }
  }

  // Define a test content type
  const TestPageContentType = contentType({
    key: 'TestPage',
    baseType: '_page',
    properties: {
      title: { type: 'string' },
    },
  });

  let mockAdapter: MockAdapter;
  let client: GraphClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Register the test content type
    initContentTypeRegistry([TestPageContentType]);

    mockAdapter = new MockAdapter();
    configureAdapter(mockAdapter);
    initializeRequestContext();
    client = new GraphClient('test-key');

    // Mock fetch globally
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getPreviewContent', () => {
    test('should populate global context with preview params', async () => {
      // Mock successful responses
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            _Content: {
              item: {
                _metadata: {
                  types: ['TestPage'],
                },
              },
            },
            damAssetType: null,
          },
        }),
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            _Content: {
              item: {
                __typename: 'TestPage',
                TestPage__title: 'Test',
              },
            },
          },
        }),
      });

      const previewParams = {
        preview_token: 'token-123',
        key: 'page-key',
        ctx: 'edit',
        ver: '1.0',
        loc: 'en-US',
      };

      await client.getPreviewContent(previewParams);

      const contextData = getContextData();
      expect(contextData).toEqual({
        preview_token: 'token-123',
        locale: 'en-US',
        key: 'page-key',
        version: '1.0',
        ctx: 'edit',
      });
    });

    test('should throw error if adapter is broken', async () => {
      // Configure with a broken adapter that throws
      const brokenAdapter: ContextAdapter = {
        initializeContext: () => {
          throw new Error('Adapter error');
        },
        getData: () => {
          throw new Error('Adapter error');
        },
        setData: () => {
          throw new Error('Adapter error');
        },
        clear: () => {
          throw new Error('Adapter error');
        },
      };

      configureAdapter(brokenAdapter);
      const testClient = new GraphClient('test-key');

      // Mock successful responses
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            _Content: {
              item: {
                _metadata: {
                  types: ['TestPage'],
                },
              },
            },
            damAssetType: null,
          },
        }),
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            _Content: {
              item: {
                __typename: 'TestPage',
                TestPage__title: 'Test',
              },
            },
          },
        }),
      });

      const previewParams = {
        preview_token: 'token-123',
        key: 'page-key',
        ctx: 'edit',
        ver: '1.0',
        loc: 'en-US',
      };

      // Should throw when trying to populate context with broken adapter
      await expect(
        testClient.getPreviewContent(previewParams),
      ).rejects.toThrow('Adapter error');
    });
  });

});
