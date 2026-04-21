import type { components } from './apiSchema/openapi-schema-types.js';
import { createApiClient } from './cmsRestClient.js';

type ContentItem = components['schemas']['ContentItem'];

interface StartPageConfig {
  key: string;
  displayName: string;
  baseType: string;
}

/**
 * Ensures a start page content exists. Creates it if not present.
 * Returns the content reference URI (e.g., "content://default/Start")
 */
export async function ensureStartPageContent(
  startPage: StartPageConfig,
  host?: string,
): Promise<string> {
  const client = await createApiClient(host);

  // Check if content already exists
  const existingContent = await client.GET('/content/{key}', {
    params: {
      path: { key: startPage.key },
    },
  });

  console.log('ensureStartPageContent existingContent', existingContent);

  // If content exists, return its reference
  if (existingContent.response.ok && existingContent.data) {
    const contentRef = `content://default/${startPage.key}`;
    return contentRef;
  }

  // Content doesn't exist, create it
  const newContent: Partial<ContentItem> = {
    displayName: startPage.displayName,
    properties: {
      // Empty properties for now - can be extended
    },
  };

  const createResponse = await client.POST('/content', {
    body: newContent as ContentItem,
    params: {
      query: {
        skipValidation: true,
      },
    },
  });

  if (!createResponse.response.ok) {
    throw new Error(
      `Failed to create start page content: ${createResponse.error?.title || 'Unknown error'}`,
    );
  }

  if (!createResponse.data) {
    throw new Error('No data returned from content creation');
  }

  const data = createResponse.data as ContentItem;
  const contentRef = `content://default/${data.key}`;
  return contentRef;
}

export async function getContent(
  key: string,
  host?: string,
): Promise<ContentItem | undefined> {
  const client = await createApiClient(host);

  const response = await client.GET('/content/{key}', {
    params: {
      path: { key },
    },
  });

  if (!response.response.ok) {
    throw new Error(
      `Failed to get content: ${response.error?.title || 'Unknown error'}`,
    );
  }

  return response.data as ContentItem | undefined;
}

export async function createContent(
  content: Partial<ContentItem>,
  host?: string,
): Promise<ContentItem | undefined> {
  const client = await createApiClient(host);

  const response = await client.POST('/content', {
    body: content as ContentItem,
  });

  if (!response.response.ok) {
    throw new Error(
      `Failed to create content: ${response.error?.title || 'Unknown error'}`,
    );
  }

  return response.data as ContentItem | undefined;
}
