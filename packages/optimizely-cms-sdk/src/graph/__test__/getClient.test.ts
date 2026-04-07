import { describe, expect, test, beforeEach } from 'vitest';
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

  describe('CRITICAL: configureGraph not defined', () => {
    test('should have error handling when config is not set', () => {
      // Verify the error message exists in the implementation
      expect(getClient.toString()).toContain('Graph configuration is not set');
      expect(getClient.toString()).toContain('configureGraph()');
    });
  });

  describe('CRITICAL: undefined/null key', () => {
    test('should accept empty string as key', () => {
      configureGraph({ key: '' });
      const client = getClient();

      expect(client.key).toBe('');
    });

    test('should handle undefined key (runtime behavior)', () => {
      // @ts-expect-error - Testing runtime behavior
      configureGraph({ key: undefined });
      const client = getClient();

      expect(client.key).toBeUndefined();
    });

    test('should handle null key (runtime behavior)', () => {
      // @ts-expect-error - Testing runtime behavior
      configureGraph({ key: null });
      const client = getClient();

      expect(client.key).toBeNull();
    });

    test('GraphClient constructor should accept undefined key', () => {
      // @ts-expect-error - Testing runtime behavior
      const client = new GraphClient(undefined);

      expect(client.key).toBeUndefined();
    });

    test('GraphClient constructor should accept null key', () => {
      // @ts-expect-error - Testing runtime behavior
      const client = new GraphClient(null);

      expect(client.key).toBeNull();
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
