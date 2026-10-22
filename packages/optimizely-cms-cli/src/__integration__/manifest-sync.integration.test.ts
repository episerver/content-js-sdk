import './setup.js';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestRestClient,
  generateTestPrefix,
  cleanupTestContentTypes,
  skipCleanup,
} from './helpers.js';
import {
  createMinimalPageType,
  createMinimalComponentType,
  createManifestPayload,
} from './fixtures.js';

describe('Manifest Sync', () => {
  let client: any;
  let testPrefix: string;
  const createdTypes: string[] = [];

  beforeAll(async () => {
    client = await createTestRestClient();
    testPrefix = generateTestPrefix();
  });

  afterAll(async () => {
    if (client && !skipCleanup()) {
      await cleanupTestContentTypes(client, testPrefix);
    }
  });

  test('should upload new content type via manifest', async () => {
    const typeKey = `${testPrefix}BlogPage`;
    createdTypes.push(typeKey);

    const { data, error } = await client.POST('/manifest', {
      headers: {
        'content-type':
          'application/vnd.optimizely.cms.v1.manifest+json',
      },
      body: createManifestPayload([createMinimalPageType(typeKey)]),
    });

    expect(error).toBeUndefined();
    expect(data).toBeDefined();
    expect(data.outcomes).toBeDefined();
  });

  test('should fetch manifest', async () => {
    const { data, error } = await client.GET('/manifest');

    expect(error).toBeUndefined();
    expect(data).toBeDefined();
    expect(Array.isArray(data.contentTypes)).toBe(true);
  });

  test('should upload multiple content types in one manifest', async () => {
    const pageKey = `${testPrefix}MultiPage`;
    const componentKey = `${testPrefix}MultiComponent`;
    createdTypes.push(pageKey, componentKey);

    const { data, error } = await client.POST('/manifest', {
      headers: {
        'content-type':
          'application/vnd.optimizely.cms.v1.manifest+json',
      },
      body: createManifestPayload([
        createMinimalPageType(pageKey),
        createMinimalComponentType(componentKey),
      ]),
    });

    expect(error).toBeUndefined();
    expect(data).toBeDefined();
    expect(data.outcomes).toBeDefined();
  });

  test('should update existing content type in manifest', async () => {
    const typeKey = `${testPrefix}UpdatePage`;
    createdTypes.push(typeKey);

    const initialType = createMinimalPageType(typeKey);

    const uploadInitial = await client.POST('/manifest', {
      headers: {
        'content-type':
          'application/vnd.optimizely.cms.v1.manifest+json',
      },
      body: createManifestPayload([initialType]),
    });

    expect(uploadInitial.error).toBeUndefined();

    const updatedType = {
      ...initialType,
      displayName: 'Updated Test Page',
      properties: {
        ...initialType.properties,
        subtitle: {
          type: 'string',
          displayName: 'Subtitle',
        },
      },
    };

    const uploadUpdated = await client.POST('/manifest', {
      headers: {
        'content-type':
          'application/vnd.optimizely.cms.v1.manifest+json',
      },
      body: createManifestPayload([updatedType]),
    });

    expect(uploadUpdated.error).toBeUndefined();
    expect(uploadUpdated.data).toBeDefined();
  });
});
