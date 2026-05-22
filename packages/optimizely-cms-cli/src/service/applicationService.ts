import type { components } from './apiSchema/openapi-schema-types.js';
import type { ApplicationsType } from '@optimizely/cms-sdk/buildConfig';
import type { AnyContentType } from './utils.js';
import { createApiClient } from './cmsRestClient.js';
import ora from 'ora';
import chalk from 'chalk';
import { ensureStartPageContent } from './contentService.js';

type Application = components['schemas']['Application'];
type ApplicationPage = components['schemas']['ApplicationPage'];

export async function createApplication(
  application: Application,
  host?: string,
): Promise<Application | undefined> {
  const client = await createApiClient(host);

  const response = await client.POST('/applications', {
    body: application,
    params: {
      header: {
        Prefer: ['return=representation'],
      },
    },
  });

  if (!response.response.ok) {
    const errorDetails = response.error?.detail || JSON.stringify(response.error);
    throw new Error(
      `Failed to create application: ${response.error?.title || 'Unknown error'}. Details: ${errorDetails}`,
    );
  }

  return response.data;
}

export async function getApplication(key: string, host?: string): Promise<Application | undefined> {
  const client = await createApiClient(host);

  const response = await client.GET('/applications/{key}', {
    params: {
      path: { key },
    },
  });

  // 404 means application doesn't exist - return undefined
  if (response.response.status === 404) {
    return undefined;
  }

  if (!response.response.ok) {
    throw new Error(`Failed to get application: ${response.error?.title || 'Unknown error'}`);
  }

  return response.data;
}

export async function listApplications(
  options?: { pageIndex?: number; pageSize?: number },
  host?: string,
): Promise<ApplicationPage | undefined> {
  const client = await createApiClient(host);

  const response = await client.GET('/applications', {
    params: {
      query: options,
    },
  });

  if (!response.response.ok) {
    throw new Error(`Failed to list applications: ${response.error?.title || 'Unknown error'}`);
  }

  return response.data;
}

/**
 * Ensures an application exists. Creates it if not present.
 * Returns the application key.
 */
export async function ensureApplication(
  application: ApplicationsType,
  host?: string,
): Promise<{ key: string; existed: boolean }> {
  if (!application.key) {
    throw new Error('Application key is required');
  }

  // Check if application already exists
  const existing = await getApplication(application.key, host);
  if (existing) {
    return { key: application.key, existed: true };
  }

  // Create application (cast to Application for API compatibility)
  const created = await createApplication(application as unknown as Application, host);
  if (!created?.key) {
    throw new Error('Failed to create application: no key returned');
  }

  return { key: created.key, existed: false };
}

/**
 * Builds a map of application keys to their startPage contentType configuration.
 * Validates that each application has exactly one startPage.
 */
export function buildStartPageMap(
  startPageMarkers: Array<{ contentTypeKey: string; appKeys: string | string[] }>,
  contentTypes: AnyContentType[],
): Map<string, { key: string; displayName: string; baseType: string }> {
  const startPageMap = new Map<string, { key: string; displayName: string; baseType: string }>();

  startPageMarkers.forEach(marker => {
    // Find the contentType object by key
    const ct = contentTypes.find(c => c.key === marker.contentTypeKey);
    if (!ct) {
      console.error(
        chalk.red(
          `ContentType "${marker.contentTypeKey}" marked with .startPage() not found in contentTypes`,
        ),
      );
      process.exit(1);
    }

    // Normalize to array
    const appKeys = Array.isArray(marker.appKeys) ? marker.appKeys : [marker.appKeys];

    appKeys.forEach((appKey: string) => {
      if (startPageMap.has(appKey)) {
        console.error(
          chalk.red(`Multiple contentTypes marked as startPage for application "${appKey}":`),
        );
        console.error(chalk.dim(`  - ${startPageMap.get(appKey)!.key}`));
        console.error(chalk.dim(`  - ${ct.key}`));
        process.exit(1);
      }
      startPageMap.set(appKey, {
        key: ct.key,
        displayName: ct.displayName,
        baseType: ct.baseType,
      });
    });
  });

  return startPageMap;
}

/**
 * Ensures applications exist with their start page content.
 * Creates applications if they don't exist, sets up entryPoints.
 */
export async function ensureApplicationsWithContent(
  applications: ApplicationsType[],
  startPageMap: Map<string, { key: string; displayName: string; baseType: string }>,
  fallbackStartPage: { key: string; displayName: string; baseType: string } | undefined,
  host?: string,
): Promise<void> {
  for (const app of applications) {
    const appSpinner = ora(`Checking application "${app.displayName}"`).start();
    try {
      // Check if application already exists first
      const existingApp = await getApplication(app.key!, host);

      if (existingApp) {
        appSpinner.succeed(
          chalk.green(`Application "${app.displayName}" already exists (${app.key})`),
        );
        continue;
      }

      // Get startPage from map (per-application) OR from fallback (global)
      const appStartPage = startPageMap.get(app.key!) || fallbackStartPage;

      if (!appStartPage) {
        appSpinner.fail(chalk.red(`No startPage defined for application "${app.displayName}"`));
        console.error(
          chalk.dim(
            `Mark a contentType with .startPage('${app.key}') in component files OR configure startPage in config`,
          ),
        );
        throw new Error(`No startPage defined for application ${app.key}`);
      }

      const contentSpinner = ora(`Creating start page content "${appStartPage.key}"`).start();
      try {
        const result = await ensureStartPageContent(appStartPage, host);
        const startPageContentRef = result.contentRef;

        if (result.existed) {
          contentSpinner.succeed(
            chalk.green(`Start page content "${appStartPage.key}" already exists`),
          );
        } else {
          contentSpinner.succeed(chalk.green(`Start page content "${appStartPage.key}" created`));
        }

        // Set application entryPoint to content reference
        app.entryPoint = startPageContentRef;
        console.log(
          chalk.dim(`  Set application "${app.displayName}" entryPoint to ${startPageContentRef}`),
        );
      } catch (error) {
        contentSpinner.fail(chalk.red(`Failed to create start page content`));
        throw error;
      }

      // Set default previewUrlFormats if not provided
      if (!app.previewUrlFormats) {
        app.previewUrlFormats = {
          any: '{host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}',
        };
      }

      // Create the application
      const result = await ensureApplication(app, host);
      appSpinner.succeed(chalk.green(`Application "${app.displayName}" created (${result.key})`));
    } catch (error) {
      appSpinner.fail(chalk.red(`Failed to ensure application "${app.displayName}"`));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      throw error;
    }
  }
}
