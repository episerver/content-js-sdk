import { describe, expect, test, beforeEach, vi } from 'vitest';
import { config, getClient, GraphClient } from '../index.js';

describe('getClient - Critical Edge Cases', () => {
  describe('Basic functionality', () => {
    beforeEach(() => {
      config({
        apiKey: 'test-key',
        graphUrl: 'https://test.optimizely.com/content/v2',
        host: 'test.com',
      });
    });

    test('should return GraphClient instance when properly configured', () => {
      const client = getClient();

      expect(client).toBeInstanceOf(GraphClient);
      expect(client.apiKey).toBe('test-key');
      expect(client.graphUrl).toBe('https://test.optimizely.com/content/v2');
      expect(client.host).toBe('test.com');
    });

    test('should allow override options', () => {
      const client = getClient({
        host: 'override.com',
      });

      expect(client.apiKey).toBe('test-key');
      expect(client.host).toBe('override.com');
    });
  });

  describe('CRITICAL: getClient called without config', () => {
    test('should throw error when getClient() is called without config()', async () => {
      // Reset module state to clear globalGraphGlobalOptions
      vi.resetModules();

      // Dynamically import to get fresh module state
      const { getClient: freshGetClient } = await import('../index.js');

      expect(() => {
        freshGetClient();
      }).toThrow(
        'The Graph client is not configured. Call config() in the application entry point.',
      );
    });
  });

  describe('CRITICAL: undefined/null key validation', () => {
    test('should throw error for empty string key in config', () => {
      expect(() => {
        config({ apiKey: '' });
      }).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error for whitespace-only key in config', () => {
      expect(() => {
        config({ apiKey: '   ' });
      }).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error for undefined key in config (runtime behavior)', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime behavior
        config({ apiKey: undefined });
      }).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error for null key in config (runtime behavior)', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime behavior
        config({ apiKey: null });
      }).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error with helpful message mentioning environment variables', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime behavior
        config({ apiKey: undefined });
      }).toThrow('process.env.OPTIMIZELY_GRAPH_SINGLE_KEY');
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
        host: 'base.com',
      });
    });

    test('should override with undefined graphUrl and use default', () => {
      const client = getClient({ graphUrl: undefined });

      // Undefined override replaces config value, then constructor applies default
      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should override with empty graphUrl and use default', () => {
      const client = getClient({ graphUrl: '' });

      // Empty string override replaces config value, then constructor applies default
      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should override with undefined host', () => {
      const client = getClient({ host: undefined });

      expect(client.host).toBeUndefined();
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
      expect(client.maxFragmentThreshold).toBe(100);
      expect(client.host).toBeUndefined();
    });

    test('should handle config with all optional values undefined', () => {
      config({
        apiKey: 'test-key',
        graphUrl: undefined,
        host: undefined,
        maxFragmentThreshold: undefined,
      });
      const client = getClient();

      expect(client.apiKey).toBe('test-key');
      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
      expect(client.host).toBeUndefined();
      expect(client.maxFragmentThreshold).toBe(100);
    });
  });

  describe('stored URL parameter', () => {
    let client: any;
    let mockFetch: any;

    beforeEach(() => {
      config({ apiKey: 'test-key' });
      client = getClient();
      mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      } as any);
    });

    test('should omit stored from URL by default for request()', async () => {
      await client.request('query { test }', {});

      const url = new URL(mockFetch.mock.calls[0][0].toString());
      expect(url.searchParams.has('stored')).toBe(false);
      mockFetch.mockRestore();
    });

    test('should omit stored from URL when stored is false', async () => {
      await client.request('query { test }', {}, undefined, true, undefined, false);

      const url = new URL(mockFetch.mock.calls[0][0].toString());
      expect(url.searchParams.has('stored')).toBe(false);
      mockFetch.mockRestore();
    });

    test('should have cache and stored in URL together', async () => {
      await client.request('query { test }', {}, undefined, true, undefined, true);

      const url = new URL(mockFetch.mock.calls[0][0].toString());
      expect(url.searchParams.get('cache')).toBe('true');
      expect(url.searchParams.get('stored')).toBe('true');
      mockFetch.mockRestore();
    });

    test('preview requests should have cache=false and stored=true', async () => {
      await client.request('query { test }', {}, 'preview-token', false, undefined, true);

      const url = new URL(mockFetch.mock.calls[0][0].toString());
      expect(url.searchParams.get('cache')).toBe('false');
      expect(url.searchParams.get('stored')).toBe('true');
      mockFetch.mockRestore();
    });

    test('should send cg-stored-query header when stored is true', async () => {
      await client.request('query { test }', {}, undefined, true, undefined, true);

      expect(mockFetch.mock.calls[0][1].headers['cg-stored-query']).toBe('template');
      mockFetch.mockRestore();
    });

    test('should omit cg-stored-query header when stored is false', async () => {
      await client.request('query { test }', {}, undefined, true, undefined, false);

      expect(mockFetch.mock.calls[0][1].headers['cg-stored-query']).toBeUndefined();
      mockFetch.mockRestore();
    });
  });
});
