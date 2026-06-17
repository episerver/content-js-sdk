import type { components } from './apiSchema/openapi-schema-types.js';
import type { ApplicationsType } from '@optimizely/cms-sdk/buildConfig';
import { createApiClient } from './cmsRestClient.js';
import ora from 'ora';
import chalk from 'chalk';

type Application = components['schemas']['Application'];

/**
 * Creates an application in the CMS.
 * Returns the created application with its key.
 * Throws an error if creation fails.
 */
async function createApplication(
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
    const errorTitle = response.error?.title || 'Unknown error';
    const errors = (response.error as any)?.errors;

    if (errors && Array.isArray(errors)) {
      const formattedErrors = errors
        .map((err: any) => {
          const field = err.field ? `[${err.field}]` : '';
          return `  ${field} ${err.detail}`;
        })
        .join('\n');
      throw new Error(`Failed to create application: ${errorTitle}\n${formattedErrors}`);
    }

    const errorDetails = response.error?.detail || JSON.stringify(response.error);
    throw new Error(`Failed to create application: ${errorTitle}. Details: ${errorDetails}`);
  }

  return response.data;
}

/**
 * Checks if content exists based on config keys. Creates content if not present.
 * Returns a map of content config keys to CMS content refs (GUIDs).
 */
async function getApplication(
  key: string,
  host?: string,
): Promise<Application | undefined> {
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
    throw new Error(
      `Failed to get application: ${response.error?.title || 'Unknown error'}`,
    );
  }

  return response.data;
}

/**
 * Ensures applications exist.
 * Creates applications if they don't exist. Requires entryPoint to be set.
 */
async function checkApplicationsWithContent(
  applications: ApplicationsType[],
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

      // Validate entryPoint is set
      if (!app.entryPoint) {
        appSpinner.fail(
          chalk.red(`No entryPoint defined for application "${app.displayName}"`),
        );
        console.error(
          chalk.dim(`Configure entryPoint in application config via content array`),
        );
        throw new Error(`No entryPoint defined for application ${app.key}`);
      }

      // Validate inProcessWebsite doesn't use preview fields
      if (app.type === 'inProcessWebsite') {
        if ('usePreviewTokens' in app || 'previewUrlFormats' in app) {
          appSpinner.fail(
            chalk.red(`Application "${app.displayName}" has invalid configuration`),
          );
          console.error(
            chalk.dim(
              `Fields 'usePreviewTokens' and 'previewUrlFormats' are only valid for type 'website'`,
            ),
          );
          throw new Error(`Invalid fields for inProcessWebsite application ${app.key}`);
        }
      }

      // Set default previewUrlFormats if not provided
      if (app.type !== 'inProcessWebsite' && !app.previewUrlFormats) {
        app.previewUrlFormats = {
          any: '{host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}',
        };
      }

      // Create the application
      const result = await checkApplication(app, host);
      appSpinner.succeed(
        chalk.green(`Application "${app.displayName}" created (${result.key})`),
      );
    } catch (error) {
      appSpinner.fail(chalk.red(`Failed to ensure application "${app.displayName}"`));
      throw error;
    }
  }
}

/**
 * Ensures an application exists. Creates it if not present.
 * Returns the application key.
 */
export async function checkApplication(
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
 * Checks if applications exist and processes content/creates apps if needed.
 * Returns true if all apps already existed (skipped processing).
 */
export async function checkApplications(
  applications: ApplicationsType[],
  contentArray: any[] | undefined,
  host?: string,
): Promise<boolean> {
  if (applications.length === 0) {
    return true;
  }

  // Check if all applications already exist
  const checkSpinner = ora('Checking applications').start();
  const existingApps = await Promise.all(
    applications.map(app => getApplication(app.key!, host)),
  );
  const allAppsExist = existingApps.every(app => app !== undefined);

  if (allAppsExist) {
    checkSpinner.succeed(chalk.green('All applications already exist'));
    return true;
  }

  checkSpinner.info(chalk.blue('Some applications need setup'));

  // Collect missing app keys
  const missingAppKeys = new Set(
    applications
      .filter((_, i) => !existingApps[i])
      .map(app => app.key!)
  );

  // lazy load content service to avoid circular dependency
  const { processContentWithApplications } = await import('./contentService.js');

  const contentSpinner = ora('Processing content configuration').start();
  try {
    await processContentWithApplications(contentArray || [], applications, host, missingAppKeys);
    contentSpinner.succeed(chalk.green('Content configuration processed'));
  } catch (error) {
    contentSpinner.fail(chalk.red('Failed to process content configuration'));
    throw error;
  }

  await checkApplicationsWithContent(applications, host);

  return false;
}
