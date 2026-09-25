import './setup.js';
import { describe, test, expect, beforeAll } from 'vitest';
import { GraphClient } from '../index.js';
import { createTestGraphClient } from './helpers.js';

describe('GraphQL Content Fetching', () => {
  let client: GraphClient;

  beforeAll(() => {
    client = createTestGraphClient();
  });

  describe('getContentByPath', () => {
    test('should handle path without trailing slash', async () => {
      const results = await client.getContentByPath('/');
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    test('should return empty array for non-existent path', async () => {
      const results = await client.getContentByPath(
        '/non-existent-path-xyz-12345/'
      );
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('should return empty array for non-existent path without trailing slash', async () => {
      const results = await client.getContentByPath(
        '/non-existent-path-xyz-12345'
      );
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('getContent', () => {
    test('should have GraphClient configured with API key', () => {
      expect(client).toBeInstanceOf(GraphClient);
      expect(client.graphUrl).toBeTruthy();
    });

    test('should support query options', async () => {
      const results = await client.getContentByPath('/', {
        cache: false,
      });
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should not throw for missing content', async () => {
      const results = await client.getContentByPath(
        '/missing-content-xyz-12345/'
      );
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });
});
