import { describe, expect, test, beforeEach, vi } from 'vitest';
import {
  configureGraph,
  getClient,
  GraphClient,
} from '../index.js';

describe('getClient - Critical Edge Cases', () => {
  describe('Basic functionality', () => {
    beforeEach(() => {
      configureGraph({
        key: 'test-key',
        graphUrl: 'https://test.optimizely.com/content/v2',
        host: 'test.com',
      });
    });

    test('should return GraphClient instance when properly configured', () => {
      const client = getClient();

      expect(client).toBeInstanceOf(GraphClient);
      expect(client.key).toBe('test-key');
      expect(client.graphUrl).toBe('https://test.optimizely.com/content/v2');
      expect(client.host).toBe('test.com');
    });

    test('should allow override options', () => {
      const client = getClient({ host: 'override.com' });

      expect(client.key).toBe('test-key');
      expect(client.host).toBe('override.com');
    });
  });

  describe('CRITICAL: getClient called without configureGraph', () => {
    test('should throw error when getClient() is called without configureGraph()', async () => {
      // Reset module state to clear globalGraphConfig
      vi.resetModules();

      // Dynamically import to get fresh module state
      const { getClient: freshGetClient } = await import('../index.js');

      expect(() => {
        freshGetClient();
      }).toThrow('Graph configuration is not set. Call configureGraph() in your root layout first.');
    });
  });

  describe('CRITICAL: undefined/null key validation', () => {
    test('should throw error for empty string key in configureGraph', () => {
      expect(() => {
        configureGraph({ key: '' });
      }).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error for whitespace-only key in configureGraph', () => {
      expect(() => {
        configureGraph({ key: '   ' });
      }).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error for undefined key in configureGraph (runtime behavior)', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime behavior
        configureGraph({ key: undefined });
      }).toThrow('Invalid Optimizely Graph API key');
    });

    test('should throw error for null key in configureGraph (runtime behavior)', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime behavior
        configureGraph({ key: null });
      }).toThrow('Invalid Optimizely Graph API key');
    });


    test('should throw error with helpful message mentioning environment variables', () => {
      expect(() => {
        // @ts-expect-error - Testing runtime behavior
        configureGraph({ key: undefined });
      }).toThrow('process.env.OPTIMIZELY_GRAPH_SINGLE_KEY');
    });
  });

  describe('CRITICAL: undefined/null graphUrl', () => {
    test('should use default graphUrl when undefined in config', () => {
      configureGraph({ key: 'test-key', graphUrl: undefined });
      const client = getClient();

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should use default graphUrl when null in config (runtime)', () => {
      // @ts-expect-error - Testing runtime behavior
      configureGraph({ key: 'test-key', graphUrl: null });
      const client = getClient();

      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should accept empty string graphUrl', () => {
      configureGraph({ key: 'test-key', graphUrl: '' });
      const client = getClient();

      expect(client.graphUrl).toBe('');
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
      configureGraph({
        key: 'base-key',
        graphUrl: 'https://base.optimizely.com/content/v2',
        host: 'base.com',
      });
    });

    test('should override with undefined graphUrl and use default', () => {
      const client = getClient({ graphUrl: undefined });

      // Undefined override replaces config value, then constructor applies default
      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
    });

    test('should override with undefined host', () => {
      const client = getClient({ host: undefined });

      expect(client.host).toBeUndefined();
    });

    test('should override with empty string graphUrl', () => {
      const client = getClient({ graphUrl: '' });

      expect(client.graphUrl).toBe('');
    });
  });

  describe('Default values', () => {
    test('should use all defaults when only key is provided', () => {
      configureGraph({ key: 'minimal-key' });
      const client = getClient();

      expect(client.key).toBe('minimal-key');
      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
      expect(client.maxFragmentThreshold).toBe(100);
      expect(client.host).toBeUndefined();
    });

    test('should handle config with all optional values undefined', () => {
      configureGraph({
        key: 'test-key',
        graphUrl: undefined,
        host: undefined,
        maxFragmentThreshold: undefined,
      });
      const client = getClient();

      expect(client.key).toBe('test-key');
      expect(client.graphUrl).toBe('https://cg.optimizely.com/content/v2');
      expect(client.host).toBeUndefined();
      expect(client.maxFragmentThreshold).toBe(100);
    });
  });
});
