import type { components } from './apiSchema/openapi-schema-types.js';
import { createApiClient } from './cmsRestClient.js';

type ContentNode = components['schemas']['ContentNode'];
type NewContent = components['schemas']['NewContent'];

interface StartPageConfig {
  key: string;
  displayName: string;
  baseType: string;
}

export async function ensureStartPageContentType(startPage: StartPageConfig, host?: string) {
  const client = await createApiClient(host);

  // Check if content type already exists
  const existingContentType = await client.GET('/contenttypes/{key}', {
    params: { path: { key: startPage.key } },
  });

  // If exists, return early
  if (existingContentType.response.ok) {
    return existingContentType;
  }

  // Content type doesn't exist - create it
  const contentTypeResponse = await client.POST('/contenttypes', {
    body: {
      key: startPage.key,
      displayName: startPage.displayName,
      baseType: startPage.baseType,
      properties: {},
    },
    params: {
      header: {
        Prefer: ['return=representation'],
      },
    },
  });

  if (!contentTypeResponse.response.ok) {
    throw new Error(
      `Failed to create content type "${startPage.key}": ${contentTypeResponse.error?.title || 'Unknown error'}`
    );
  }

  return contentTypeResponse;
}

/**
 * Ensures a start page content exists. Creates it if not present.
 * Returns the content reference URI (e.g., "cms://content/48b70fa46b28414386c9ff4b9aa82f5a")
 */
export async function ensureStartPageContent(
  startPage: StartPageConfig,
  host?: string,
): Promise<{ contentRef: string; existed: boolean }> {
  const client = await createApiClient(host);

  await ensureStartPageContentType(startPage, host);

  // Check if content already exists
  const existingContent = await client.GET('/content/{key}', {
    params: {
      path: { key: startPage.key },
    },
  });

  // If content exists, return its reference
  if (existingContent.response.ok && existingContent.data) {
    const contentRef = `cms://content/${existingContent.data.key}`;
    return { contentRef, existed: true };
  }

  // Content doesn't exist, create it
  const newContent: NewContent = {
    contentType: startPage.key,
    container: '43f936c99b234ea397b261c538ad07c9',
    initialVersion: {
      displayName: startPage.displayName,
      locale: 'en',
      properties: {
        // Empty properties for now - can be extended
      },
    },
  };

  const createResponse = await client.POST('/content', {
    body: newContent,
    params: {
      header: {
        'cms-skip-validation': ['*'],
        Prefer: ['return=representation'],
      },
    },
  });

  if (!createResponse.response.ok) {
    const errorDetails = createResponse.error?.detail || JSON.stringify(createResponse.error);
    throw new Error(
      `Failed to create start page content: ${createResponse.error?.title || 'Unknown error'}. Details: ${errorDetails}`,
    );
  }

  if (!createResponse.data) {
    throw new Error('No data returned from content creation');
  }

  const data = createResponse.data;
  const contentRef = `cms://content/${data.key}`;
  return { contentRef, existed: false };
}

export async function getContent(key: string, host?: string): Promise<ContentNode | undefined> {
  const client = await createApiClient(host);

  const response = await client.GET('/content/{key}', {
    params: {
      path: { key },
    },
  });

  if (!response.response.ok) {
    throw new Error(`Failed to get content: ${response.error?.title || 'Unknown error'}`);
  }

  return response.data;
}

export async function createContent(content: NewContent, host?: string): Promise<ContentNode | undefined> {
  const client = await createApiClient(host);

  const response = await client.POST('/content', {
    body: content,
  });

  if (!response.response.ok) {
    throw new Error(`Failed to create content: ${response.error?.title || 'Unknown error'}`);
  }

  return response.data;
}

