import chalk from 'chalk';
import { v5 as uuidv5 } from 'uuid';
import type { components } from './apiSchema/openapi-schema-types.js';
import { createApiClient } from './cmsRestClient.js';

type NewContent = components['schemas']['NewContent'];

interface ContentConfig {
  key: string;
  displayName: string;
  contentType: string;
}

// Root container is common for all CMS instances
const ROOT_CONTAINER_KEY = '43f936c99b234ea397b261c538ad07c9';

// Namespace UUID for content key generation
const CONTENT_NAMESPACE = 'a8f3e1c4-7b2d-4a9e-b5f6-8c3d1e2f4a5b';

/**
 * Formats content key as CMS content reference.
 */
function toContentRef(key: string): string {
  return `cms://content/${key}`;
}

/**
 * Validates content type exists.
 */
async function validateContentType(
  contentType: string,
  client: ReturnType<typeof createApiClient> extends Promise<infer T> ? T : never,
): Promise<void> {
  const response = await client.GET('/contenttypes/{key}', {
    params: { path: { key: contentType } },
  });

  if (!response.response.ok) {
    throw new Error(`ContentType "${contentType}" not found.`);
  }
}

/**
 * Creates content in CMS.
 * Returns content key if successful, undefined if 409 (content exists), throws on other errors.
 */
async function createContent(
  config: ContentConfig,
  client: ReturnType<typeof createApiClient> extends Promise<infer T> ? T : never,
  key?: string,
): Promise<string | undefined> {
  const newContent: NewContent & { key?: string } = {
    ...(key && { key }),
    contentType: config.contentType,
    container: ROOT_CONTAINER_KEY,
    initialVersion: {
      displayName: config.displayName,
      locale: 'en',
      properties: {},
    },
  };

  const response = await client.POST('/content', {
    body: newContent,
    params: {
      header: {
        'cms-skip-validation': ['*'],
        Prefer: ['return=representation'],
      },
    },
  });

  if (!response.response.ok) {
    // Status code 409 means content exists
    if (response.response.status === 409) {
      return undefined;
    }

    const errorDetails = response.error?.detail || JSON.stringify(response.error);
    throw new Error(
      `Failed to create content "${config.key}": ${response.error?.title || 'Unknown error'}. Details: ${errorDetails}`,
    );
  }

  if (!response.data?.key) {
    throw new Error(`No data returned from content creation for "${config.key}"`);
  }

  return response.data.key;
}

/**
 * Checks content existence based on config. Creates content if it doesn't exist.
 * Uses deterministic UUIDs based on content keys to handle potential 403 responses gracefully.
 * Returns a map of user-specified content keys to their corresponding CMS content refs.
 */
async function checkContentFromConfig(
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
    if (existingContent.response.ok && existingContent.data?.key) {
      contentRefMap.set(contentConfig.key, toContentRef(existingContent.data.key));
      console.log(chalk.dim(`  Content "${contentConfig.key}" exists`));
      continue;
    }

    // If GET returned non-404 error (likely 403), assume exists
    if (!existingContent.response.ok && existingContent.response.status !== 404) {
      if (existingContent.response.status === 403) {
        contentRefMap.set(contentConfig.key, toContentRef(contentKey));
        console.log(chalk.dim(`  Content "${contentConfig.key}" exists`));
        continue;
      }
    }

    // Content doesn't exist (404), create it
    console.log(chalk.dim(`  Creating content "${contentConfig.key}"...`));

    await validateContentType(contentConfig.contentType, client);

    const createdKey = await createContent(contentConfig, client, contentKey);

    // If 403 during creation, content likely exists - use deterministic UUID
    if (createdKey) {
      contentRefMap.set(contentConfig.key, toContentRef(createdKey));
      console.log(chalk.dim(`  Created content "${contentConfig.key}"`));
    } else {
      contentRefMap.set(contentConfig.key, toContentRef(contentKey));
      console.log(chalk.dim(`  Content "${contentConfig.key}" exists`));
    }
  }

  return contentRefMap;
}

/**
 * Processes content array and maps application entryPoints to content refs.
 * Creates content instances and updates application entryPoints with generated GUIDs.
 * For missing applications, always creates new content instances.
 */
export async function processContentWithApplications(
  contentArray: ContentConfig[],
  applications: any[],
  host?: string,
  missingAppKeys?: Set<string>,
): Promise<void> {
  if (!contentArray || !Array.isArray(contentArray) || contentArray.length === 0) {
    return;
  }

  const contentRefMap = await checkContentFromConfig(contentArray, host);

  // Map content keys in entryPoint to full content refs
  for (const app of applications) {
    if (app.entryPoint && !app.entryPoint.startsWith('cms://')) {
      // entryPoint is a content key, need to map to full ref
      let contentRef = contentRefMap.get(app.entryPoint);

      // Force create new content instance if app doesn't exist
      if (missingAppKeys?.has(app.key)) {
        contentRef = await createNewContentInstance(
          contentArray.find(c => c.key === app.entryPoint),
          host,
        );
      }

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

/**
 * Creates a new content instance with a new UUID.
 */
async function createNewContentInstance(
  contentConfig: ContentConfig | undefined,
  host?: string,
): Promise<string | undefined> {
  if (!contentConfig) return undefined;

  const client = await createApiClient(host);

  console.log(chalk.dim(`  Creating new instance for "${contentConfig.key}"...`));

  await validateContentType(contentConfig.contentType, client);

  const createdKey = await createContent(contentConfig, client);

  if (!createdKey) {
    throw new Error(`Failed to create new instance for "${contentConfig.key}"`);
  }

  console.log(chalk.dim(`  Created new instance for "${contentConfig.key}"`));
  return toContentRef(createdKey);
}
