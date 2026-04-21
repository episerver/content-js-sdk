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

  console.log('ensureStartPageContentType existingContentType', existingContentType);
}

/**
 * Ensures a start page content exists. Creates it if not present.
 * Returns the content reference URI (e.g., "cms://content/48b70fa46b28414386c9ff4b9aa82f5a")
 */
export async function ensureStartPageContent(startPage: StartPageConfig, host?: string): Promise<string> {
  const client = await createApiClient(host);

  const ct = await ensureStartPageContentType(startPage, host);
  console.log('ensureStartPageContentType', JSON.stringify(ct));

  // Check if content already exists
  const existingContent = await client.GET('/content/{key}', {
    params: {
      path: { key: startPage.key },
    },
  });

  console.log('ensureStartPageContent existingContent', existingContent);

  // If content exists, return its reference
  if (existingContent.response.ok && existingContent.data) {
    const contentRef = `cms://content/${existingContent.data.key}`;
    return contentRef;
  }

  // Content doesn't exist, create it
  const newContent: NewContent = {
    contentType: startPage.baseType,
    initialVersion: {
      displayName: startPage.displayName,
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
      },
    },
  });

  if (!createResponse.response.ok) {
    throw new Error(`Failed to create start page content: ${createResponse.error?.title || 'Unknown error'}`);
  }

  if (!createResponse.data) {
    throw new Error('No data returned from content creation');
  }

  const data = createResponse.data;
  const contentRef = `cms://content/${data.key}`;
  return contentRef;
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

