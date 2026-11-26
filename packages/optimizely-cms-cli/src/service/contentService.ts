import chalk from 'chalk';
import { v5 as uuidv5 } from 'uuid';
import type { components } from './apiSchema/openapi-schema-types.js';
import { createApiClient, type ApiClient } from './cmsRestClient.js';

type NewContent = components['schemas']['NewContent'];

/** A content item declared in the config file's `content` array */
export interface ContentConfig {
  key: string;
  displayName: string;
  contentType: string;
  locale?: string;
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

// deterministic CMS key for a config content key, without hyphens for the API
const cmsContentKeyOf = (key: string) => uuidv5(key, CONTENT_NAMESPACE).replace(/-/g, '');

// a 403 means the item exists but the API key can't read it
const exists = (response: Response) => response.ok || response.status === 403;

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
      locale: config.locale || 'en',
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
    const contentKey = cmsContentKeyOf(contentConfig.key);

    const existingContent = await client.GET('/content/{key}', {
      params: { path: { key: contentKey } },
    });

    if (exists(existingContent.response)) {
      contentRefMap.set(
        contentConfig.key,
        toContentRef(existingContent.data?.key ?? contentKey),
      );
      console.log(chalk.dim(`  Content "${contentConfig.key}" exists`));
      continue;
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
 * Creates content instances with deterministic UUIDs and updates application entryPoints.
 */
export async function processContentWithApplications(
  contentArray: ContentConfig[],
  applications: any[],
  host?: string,
): Promise<void> {
  if (!contentArray || !Array.isArray(contentArray) || contentArray.length === 0) {
    return;
  }

  // Check/create all content items first
  const contentRefMap = await checkContentFromConfig(contentArray, host);

  // Map content keys in entryPoint to full content refs
  for (const app of applications) {
    const isContentRef =
      app.entryPoint &&
      (app.entryPoint.startsWith('cms://') || app.entryPoint.startsWith('content://'));
    if (app.entryPoint && !isContentRef) {
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

/** Lists the configured content items that don't exist in the CMS yet. */
export async function findMissingContent(
  contentArray: ContentConfig[],
  restClient: ApiClient,
): Promise<ContentConfig[]> {
  const found = await Promise.all(
    contentArray.map(async it => {
      const { response } = await restClient.GET('/content/{key}', {
        params: { path: { key: cmsContentKeyOf(it.key) } },
      });
      return exists(response);
    }),
  );

  return contentArray.filter((_, index) => !found[index]);
}
