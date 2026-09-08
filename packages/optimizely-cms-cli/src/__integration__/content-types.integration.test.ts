import './setup.js';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestRestClient,
  generateTestPrefix,
  cleanupTestContentTypes,
  skipCleanup,
} from './helpers.js';
import { createMinimalPageType, createMinimalComponentType } from './fixtures.js';

describe('Content Type CRUD Operations', () => {
  // Note: These tests will fail if REST API credentials are not set in .env.integration
  // See error messages at test startup for setup instructions
  let client: any;
  let testPrefix: string;
  const createdTypes: string[] = [];
  let counter = 0;

  const getUniqueTypeKey = (baseName: string) => `${testPrefix}${baseName}_${++counter}`;

  beforeAll(async () => {
    client = await createTestRestClient();
    testPrefix = generateTestPrefix();
  });

  afterAll(async () => {
    if (client && !skipCleanup()) {
      await cleanupTestContentTypes(client, testPrefix);
    }
  });

  describe('GET /contenttypes', () => {
    test('should list all content types', async () => {
      const { data, error } = await client.GET('/contenttypes');

      expect(error).toBeUndefined();
      expect(data).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);
    });

    test('should include base content types', async () => {
      const { data } = await client.GET('/contenttypes');

      const hasPageType = data.items.some(
        (ct: any) => ct.baseType === '_page'
      );
      const hasComponentType = data.items.some(
        (ct: any) => ct.baseType === '_component'
      );

      expect(hasPageType).toBe(true);
      expect(hasComponentType).toBe(true);
    });
  });

  describe('POST /contenttypes', () => {
    test('should create individual content type', async () => {
      const typeKey = getUniqueTypeKey('CreatePage');
      createdTypes.push(typeKey);

      const { data, error } = await client.POST('/contenttypes', {
        body: createMinimalPageType(typeKey),
      });

      expect(error).toBeUndefined();
      expect(data).toBeDefined();
      expect(data.key).toBe(typeKey);
      expect(data.baseType).toBe('_page');
    });

    test('should create component type', async () => {
      const typeKey = getUniqueTypeKey('CreateComponent');
      createdTypes.push(typeKey);

      const { data, error } = await client.POST('/contenttypes', {
        body: createMinimalComponentType(typeKey),
      });

      expect(error).toBeUndefined();
      expect(data).toBeDefined();
      expect(data.key).toBe(typeKey);
      expect(data.baseType).toBe('_component');
    });
  });

  describe('GET /contenttypes/{key}', () => {
    test('should fetch specific content type', async () => {
      const typeKey = getUniqueTypeKey('FetchPage');
      createdTypes.push(typeKey);

      const createResponse = await client.POST('/contenttypes', {
        body: createMinimalPageType(typeKey),
      });

      expect(createResponse.error).toBeUndefined();
      expect(createResponse.data).toBeDefined();

      const { data, error } = await client.GET('/contenttypes/{key}', {
        params: { path: { key: typeKey } },
      });

      expect(error).toBeUndefined();
      expect(data).toBeDefined();
      expect(data.key).toBe(typeKey);
      expect(data.properties).toBeDefined();
    });

    test('should return 404 for non-existent type', async () => {
      const { error } = await client.GET('/contenttypes/{key}', {
        params: { path: { key: getUniqueTypeKey('NonExistent') } },
      });

      expect(error).toBeDefined();
      expect(error.status).toBe(404);
    });
  });

  describe('DELETE /contenttypes/{key}', () => {
    test('should delete content type', async () => {
      const typeKey = getUniqueTypeKey('DeletePage');

      await client.POST('/contenttypes', {
        body: createMinimalPageType(typeKey),
      });

      const { error: deleteError } = await client.DELETE(
        '/contenttypes/{key}',
        {
          params: { path: { key: typeKey } },
        }
      );

      expect(deleteError).toBeUndefined();

      const { error: fetchError } = await client.GET(
        '/contenttypes/{key}',
        {
          params: { path: { key: typeKey } },
        }
      );

      expect(fetchError).toBeDefined();
      expect(fetchError.status).toBe(404);

      createdTypes.splice(createdTypes.indexOf(typeKey), 1);
    });
  });
});
