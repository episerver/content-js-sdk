import type { components } from './apiSchema/openapi-schema-types.js';
import { createApiClient } from './cmsRestClient.js';
import chalk from 'chalk';
import { v5 as uuidv5 } from 'uuid';

type ContentNode = components['schemas']['ContentNode'];
type NewContent = components['schemas']['NewContent'];

interface StartPageConfig {
  key: string;
  displayName: string;
  baseType: string;
}

// Root container is common for all CMS instances
const ROOT_CONTAINER_KEY = '43f936c99b234ea397b261c538ad07c9';

// Namespace UUID for content key generation
const CONTENT_NAMESPACE = 'a8f3e1c4-7b2d-4a9e-b5f6-8c3d1e2f4a5b';

export async function ensureStartPageContentType(
  startPage: StartPageConfig,
  host?: string,
) {
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
      `Failed to create content type "${startPage.key}": ${contentTypeResponse.error?.title || 'Unknown error'}`,
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
    container: ROOT_CONTAINER_KEY,
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
    const errorDetails =
      createResponse.error?.detail || JSON.stringify(createResponse.error);
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

export async function getContent(
  key: string,
  host?: string,
): Promise<ContentNode | undefined> {
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

export async function createContent(
  content: NewContent,
  host?: string,
): Promise<ContentNode | undefined> {
  const client = await createApiClient(host);

  const response = await client.POST('/content', {
    body: content,
  });

  if (!response.response.ok) {
    throw new Error(
      `Failed to create content: ${response.error?.title || 'Unknown error'}`,
    );
  }

  return response.data;
}

interface ContentConfig {
  key: string;
  displayName: string;
  contentType: string;
}

/**
 * Ensures content instances exist based on config array.
 * Creates content if not present, returns map of key → contentRef.
 */
/**
 * Processes content array and maps application entryPoints to content refs.
 * Creates content instances and updates application entryPoints with generated GUIDs.
 */
export async function processContentWithApplications(
  contentArray: any[],
  applications: any[],
  host?: string,
): Promise<void> {
  if (!contentArray || !Array.isArray(contentArray) || contentArray.length === 0) {
    return;
  }

  const contentRefMap = await checkContentFromConfig(contentArray, host);

  // Map content keys in entryPoint to full content refs
  for (const app of applications) {
    if (app.entryPoint && !app.entryPoint.startsWith('cms://')) {
      // entryPoint is a content key, need to map to full ref
      const contentRef = contentRefMap.get(app.entryPoint);
      if (contentRef) {
        app.entryPoint = contentRef;
        console.log(chalk.dim(`  Mapped "${app.displayName}" entryPoint`));
      } else {
        console.warn(
          chalk.yellow(
            `  Warning: Content "${app.entryPoint}" not found for application "${app.displayName}"`,
          ),
        );
      }
    }
  }
}

export async function checkContentFromConfig(
  contentArray: ContentConfig[],
  host?: string,
): Promise<Map<string, string>> {
  const contentRefMap = new Map<string, string>();
  const client = await createApiClient(host);

  for (const contentConfig of contentArray) {
    // Generate a deterministic UUID/GUID based on the content key (without hyphens for API)
    const contentKey = uuidv5(contentConfig.key, CONTENT_NAMESPACE).replace(/-/g, '');

    const existingContent = await client.GET('/content/{key}', {
      params: { path: { key: contentKey } },
    });

    // If content exists (200 OK), use it
    if (existingContent.response.ok && existingContent.data) {
      const contentRef = `cms://content/${existingContent.data.key}`;
      contentRefMap.set(contentConfig.key, contentRef);
      console.log(chalk.dim(`  Content "${contentConfig.key}" exists`));
      continue;
    }

    // If GET returned non-404 error (likely 403), assume exists
    if (!existingContent.response.ok && existingContent.response.status !== 404) {
      if (existingContent.response.status === 403) {
        const contentRef = `cms://content/${contentKey}`;
        contentRefMap.set(contentConfig.key, contentRef);
        console.log(chalk.dim(`  Content "${contentConfig.key}" exists`));
        continue;
      }
    }

    // Content doesn't exist (404), create it
    console.log(chalk.dim(`  Creating content "${contentConfig.key}"...`));

    const existingContentType = await client.GET('/contenttypes/{key}', {
      params: { path: { key: contentConfig.contentType } },
    });

    if (!existingContentType.response.ok) {
      throw new Error(
        `ContentType "${contentConfig.contentType}" not found. Ensure contentType exists before creating content "${contentKey}".`,
      );
    }

    // Create content with deterministic UUID as key
    const newContent: NewContent & { key?: string } = {
      key: contentKey,
      contentType: contentConfig.contentType,
      container: ROOT_CONTAINER_KEY,
      initialVersion: {
        displayName: contentConfig.displayName,
        locale: 'en',
        properties: {},
      },
    };

    const createResponse = await client.POST('/content', {
      body: newContent,
      params: {
        header: {
          // Skips all validations since the properties may be incomplete
          'cms-skip-validation': ['*'],
          Prefer: ['return=representation'],
        },
      },
    });

    if (!createResponse.response.ok) {
      // If Forbidden, content likely exists - use deterministic UUID
      if (createResponse.response.status === 403) {
        const contentRef = `cms://content/${contentKey}`;
        contentRefMap.set(contentConfig.key, contentRef);
        console.log(chalk.dim(`  Content "${contentConfig.key}" exists`));
        continue;
      }

      const errorDetails =
        createResponse.error?.detail || JSON.stringify(createResponse.error);
      throw new Error(
        `Failed to create content "${contentConfig.key}": ${createResponse.error?.title || 'Unknown error'}. Details: ${errorDetails}`,
      );
    }

    if (!createResponse.data || !createResponse.data.key) {
      throw new Error(
        `No data returned from content creation for "${contentConfig.key}"`,
      );
    }

    // Map user-specified key → API-generated GUID ref
    const contentRef = `cms://content/${createResponse.data.key}`;
    contentRefMap.set(contentConfig.key, contentRef);
    console.log(chalk.dim(`  Created content "${contentConfig.key}"`));
  }

  return contentRefMap;
}

