import './setup.js';
import { describe, test, expect } from 'vitest';
import { GraphClient } from '../index.js';
import { GraphHttpResponseError } from '../error.js';

describe('GraphQL Error Handling', () => {
  describe('invalid API key', () => {
    test('should throw GraphHttpResponseError with 401 status', async () => {
      const client = new GraphClient('invalid-api-key', {
        graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY ||
          'https://cg.optimizely.com/content/v2',
      });

      try {
        await client.getContentByPath('/en/start/');
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphHttpResponseError);
        if (error instanceof GraphHttpResponseError) {
          expect(error.status).toBe(401);
        }
      }
    });
  });

  describe('invalid URL', () => {
    test('should handle invalid graph URL gracefully', async () => {
      const client = new GraphClient(
        process.env.OPTIMIZELY_GRAPH_SINGLE_KEY || 'test-key',
        {
          graphUrl: 'https://invalid-domain-xyz-12345.example.com/content/v2',
        }
      );

      try {
        await client.getContentByPath('/en/start/');
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(GraphHttpResponseError);
      }
    });
  });
});
