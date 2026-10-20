import { describe, expect, test, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import { config, getClient, GraphClient } from '../index.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { refreshCache } from '../../util/queryUtils.js';
import { configureAdapter } from '../../context/config.js';
import { MemoryAdapter } from '../../core/context/memoryAdapter.js';
import {
  BlogArticle,
  Categorizable,
  NewsArticle,
  contentQuery,
  metadataResponse,
  stubGraph,
} from './helpers.js';

const HomePage = contentType({
  key: 'HomePage',
  displayName: 'Home Page',
  baseType: '_page',
  properties: {
    body: { type: 'richText' },
    related: { type: 'content', allowedTypes: [Categorizable] },
  },
});

describe('getClient - Critical Edge Cases', () => {
  describe('Basic functionality', () => {
    beforeEach(() => {
      config({
        apiKey: 'test-key',
        graphUrl: 'https://test.optimizely.com/content/v2',
        query: { host: 'test.com' },
      });
    });

    test('should return GraphClient instance when properly configured', () => {
      const client = getClient();

      expect(client).toBeInstanceOf(GraphClient);
      expect(client.apiKey).toBe('test-key');
      expect(client.graphUrl).toBe('https://test.optimizely.com/content/v2');
      expect(client.queryDefaults.host).toBe('test.com');
    });

    test('should allow override options', () => {
      const client = getClient({
        query: { host: 'override.com' },
      });

      expect(client.apiKey).toBe('test-key');
      expect(client.queryDefaults.host).toBe('override.com');
    });
  });

  describe('CRITICAL: getClient called without config', () => {
    test('should throw error when getClient() is called without config()', async () => {
      // Fresh module state: config() above already set the global options
      vi.resetModules();
      const { getClient: freshGetClient } = await import('../index.js');

      expect(() => freshGetClient()).toThrow(
        'The Graph client is not configured. Call config() in the application entry point.',
      );
    });
  });

  describe('CRITICAL: undefined/null key validation', () => {
    test('should throw error for empty string key in config', () => {
      expect(() => config({ apiKey: '' })).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error for whitespace-only key in config', () => {
      expect(() => config({ apiKey: '   ' })).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error for undefined key in config (runtime behavior)', () => {
      // @ts-expect-error - Testing runtime behavior
      expect(() => config({ apiKey: undefined })).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error for null key in config (runtime behavior)', () => {
      // @ts-expect-error - Testing runtime behavior
      expect(() => config({ apiKey: null })).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error with helpful message mentioning environment variables', () => {
      // @ts-expect-error - Testing runtime behavior
      expect(() => config({ apiKey: undefined })).toThrow('process.env.OPTIMIZELY_GRAPH_SINGLE_KEY');
    });
  });

  describe('CRITICAL: undefined/null graphUrl', () => {
    test('should use default graphUrl when undefined in config', () => {
      config({ apiKey: 'test-key', graphUrl: undefined });
      const client = getClient();

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should use default graphUrl when null in config (runtime)', () => {
      // @ts-expect-error - Testing runtime behavior
      config({ apiKey: 'test-key', graphUrl: null });
      const client = getClient();

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should use default graphUrl when empty string in config', () => {
      config({ apiKey: 'test-key', graphUrl: '' });
      const client = getClient();

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('GraphClient constructor should handle undefined graphUrl', () => {
      const client = new GraphClient('test-key', { graphUrl: undefined });

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('GraphClient constructor should handle null graphUrl', () => {
      // @ts-expect-error - Testing runtime behavior
      const client = new GraphClient('test-key', { graphUrl: null });

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });
  });

  describe('CRITICAL: override options with undefined/null', () => {
    beforeEach(() => {
      config({
        apiKey: 'base-key',
        graphUrl: 'https://base.optimizely.com/content/v2',
        query: { host: 'base.com' },
      });
    });

    test('should override with undefined graphUrl and use default', () => {
      const client = getClient({ graphUrl: undefined });

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should override with empty graphUrl and use default', () => {
      const client = getClient({ graphUrl: '' });

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should override with undefined host', () => {
      const client = getClient({ query: { host: undefined } });

      expect(client.queryDefaults.host).toBeUndefined();
    });
  });

  describe('getClient overrides merge into a group', () => {
    beforeEach(() => {
      config({
        apiKey: 'base-key',
        fragment: { richTextFormat: 'html', compositionDepth: 2, maxThreshold: 42 },
        query: { cache: false, slot: 'New' },
      });
    });

    test('overriding one fragment field keeps the rest of the group', () => {
      const overridden = getClient({ fragment: { compositionDepth: 8 } });

      expect(overridden.fragmentDefaults.compositionDepth).toBe(8);
      expect(overridden.fragmentDefaults.richTextFormat).toBe('html');
      expect(overridden.fragmentDefaults.maxThreshold).toBe(42);
    });

    test('overriding one query field keeps the rest of the group', () => {
      const overridden = getClient({ query: { cache: true } });

      expect(overridden.queryDefaults.cache).toBe(true);
      expect(overridden.queryDefaults.slot).toBe('New');
    });

    test('an untouched group is inherited whole', () => {
      const overridden = getClient({ userAgent: 'MyApp/1.0' });

      expect(overridden.userAgent).toBe('MyApp/1.0');
      expect(overridden.fragmentDefaults.richTextFormat).toBe('html');
      expect(overridden.queryDefaults.slot).toBe('New');
    });
  });

  describe('fragment options reach the generated query', () => {
    beforeEach(() => {
      initContentTypeRegistry([Categorizable, BlogArticle, NewsArticle, HomePage]);
      refreshCache();
    });

    const fetchHomePage = async (client: GraphClient) => {
      const spy = stubGraph(client, {
        metadata: metadataResponse(['HomePage']),
        content: { _Content: { item: { __typename: 'HomePage' } } },
      });
      await client.getContent({ key: 'a' });
      return contentQuery(spy);
    };

    test('typeFilter excludes a content type from the fragments', async () => {
      const query = await fetchHomePage(
        new GraphClient('test-key', {
          fragment: { expandContracts: true, typeFilter: key => key !== 'NewsArticle' },
        }),
      );

      expect(query).toContain('fragment BlogArticle');
      expect(query).not.toContain('fragment NewsArticle');
    });

    test('expandContracts pulls in the implementing types', async () => {
      const query = await fetchHomePage(
        new GraphClient('test-key', { fragment: { expandContracts: true } }),
      );

      expect(query).toContain('fragment NewsArticle');
    });
  });

  describe('CRITICAL: graphUrl normalization (issue #468)', () => {
    test('should append /content/v2 when graphUrl is just the gateway base URL', () => {
      config({ apiKey: 'test-key', graphUrl: 'https://cg.optimizely.com' });
      const client = getClient();

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should append /content/v2 when graphUrl has trailing slash', () => {
      config({ apiKey: 'test-key', graphUrl: 'https://cg.optimizely.com/' });
      const client = getClient();

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should not double-append when graphUrl already has /content/v2', () => {
      config({ apiKey: 'test-key', graphUrl: 'https://cg.optimizely.com/content/v2' });
      const client = getClient();

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should work with staging gateway URL', () => {
      config({ apiKey: 'test-key', graphUrl: 'https://cg.staging.optimizely.com' });
      const client = getClient();

      expect(client.graphUrl).toBe('https://cg.staging.optimizely.com/content/v2');
    });

    test('should normalize via GraphClient constructor directly', () => {
      const client = new GraphClient('test-key', {
        graphUrl: 'https://cg.optimizely.com',
      });

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });
  });

  describe('Default values', () => {
    test('should use all defaults when only key is provided', () => {
      config({ apiKey: 'minimal-key' });
      const client = getClient();

      expect(client.apiKey).toBe('minimal-key');
      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
      expect(client.fragmentDefaults.maxThreshold).toBe(100);
      expect(client.queryDefaults.host).toBeUndefined();
    });

    test('should handle config with all optional values undefined', () => {
      config({
        apiKey: 'test-key',
        graphUrl: undefined,
        query: { host: undefined },
        fragment: { maxThreshold: undefined },
      });
      const client = getClient();

      expect(client.apiKey).toBe('test-key');
      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
      expect(client.queryDefaults.host).toBeUndefined();
      expect(client.fragmentDefaults.maxThreshold).toBe(100);
    });
  });

  describe('stored URL parameter', () => {
    let client: GraphClient;
    let mockFetch: MockInstance<typeof fetch>;

    const requestUrl = (index = 0) => new URL(mockFetch.mock.calls[index][0].toString());
    const requestHeaders = (index = 0) => mockFetch.mock.calls[index][1]?.headers as Record<string, string>;

    beforeEach(() => {
      config({ apiKey: 'test-key' });
      client = getClient();
      mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      } as Response);
    });

    afterEach(() => mockFetch.mockRestore());

    test('should omit stored from URL by default for request()', async () => {
      await client.request('query { test }', {});

      expect(requestUrl().searchParams.has('stored')).toBe(false);
    });

    test('should omit stored from URL when stored is false', async () => {
      await client.request('query { test }', {}, undefined, true, undefined, false);

      expect(requestUrl().searchParams.has('stored')).toBe(false);
    });

    test('should have cache and stored in URL together', async () => {
      await client.request('query { test }', {}, undefined, true, undefined, true);

      expect(requestUrl().searchParams.get('cache')).toBe('true');
      expect(requestUrl().searchParams.get('stored')).toBe('true');
    });

    test('getPreviewContent sends every request with cache=false and stored=true', async () => {
      initContentTypeRegistry([Categorizable, HomePage]);
      refreshCache();
      configureAdapter(new MemoryAdapter());
      mockFetch.mockImplementation(async (_url, init) => {
        const data =
          String(init?.body).includes('GetContentMetadata') ?
            metadataResponse(['HomePage'])
          : { _Content: { item: { __typename: 'HomePage' } } };
        return { ok: true, json: async () => ({ data }) } as Response;
      });

      await client.getPreviewContent({
        preview_token: 'preview-token',
        key: 'a',
        ctx: 'edit',
        ver: '1',
        loc: 'en',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      [0, 1].forEach(index => {
        expect(requestUrl(index).searchParams.get('cache')).toBe('false');
        expect(requestUrl(index).searchParams.get('stored')).toBe('true');
      });
    });

    test('should send cg-stored-query header when stored is true', async () => {
      await client.request('query { test }', {}, undefined, true, undefined, true);

      expect(requestHeaders()['cg-stored-query']).toBe('template');
    });

    test('should omit cg-stored-query header when stored is false', async () => {
      await client.request('query { test }', {}, undefined, true, undefined, false);

      expect(requestHeaders()['cg-stored-query']).toBeUndefined();
    });
  });
});
