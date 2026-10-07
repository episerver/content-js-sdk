import type { components } from './apiSchema/openapi-schema-types.js';
import type { ApplicationsType } from '@optimizely/cms-sdk/buildConfig';
import { createApiClient } from './cmsRestClient.js';
import ora from 'ora';
import chalk from 'chalk';

type Application = components['schemas']['Application'];
type ApplicationPatch = components['schemas']['ApplicationPatch'];

// UTILITIES

const formatApiError = (response: any, operation: string): Error => {
  const errorTitle = response.error?.title || 'Unknown error';
  const errors = (response.error as any)?.errors;

  if (errors && Array.isArray(errors)) {
    const formattedErrors = errors
      .map((err: any) => {
        const field = err.field ? `[${err.field}]` : '';
        return `  ${field} ${err.detail}`;
      })
      .join('\n');
    return new Error(`Failed to ${operation}: ${errorTitle}\n${formattedErrors}`);
  }

  const errorDetails = response.error?.detail || JSON.stringify(response.error);
  return new Error(`Failed to ${operation}: ${errorTitle}. Details: ${errorDetails}`);
};

const normalizeType = (type: any, defaultType = 'website'): string =>
  typeof type === 'string' ? type : defaultType;

const isContentRef = (val: string | undefined) =>
  val && (val.startsWith('cms://') || val.startsWith('content://'));

// COMPARISON HELPERS

/**
 * Compares two host arrays for equality.
 */
export const areHostsEqual = (
  hosts1: any[] | undefined,
  hosts2: any[] | undefined,
): boolean => {
  if (!hosts1 && !hosts2) return true;
  if (!hosts1 || !hosts2) return false;
  if (hosts1.length !== hosts2.length) return false;

  return hosts1.every((host1, index) => {
    const host2 = hosts2[index];
    return (
      host1.authority === host2.authority &&
      normalizeType(host1.type, undefined) === normalizeType(host2.type, undefined) &&
      host1.locale === host2.locale &&
      host1.preferredUrlScheme === host2.preferredUrlScheme
    );
  });
};

/**
 * Compares two previewUrlFormats objects for equality.
 */
export const arePreviewUrlFormatsEqual = (
  formats1: Record<string, string> | undefined,
  formats2: Record<string, string> | undefined,
): boolean => {
  if (!formats1 && !formats2) return true;
  if (!formats1 || !formats2) return false;

  const keys1 = Object.keys(formats1).sort();
  const keys2 = Object.keys(formats2).sort();

  if (keys1.length !== keys2.length || !keys1.every((key, i) => key === keys2[i]))
    return false;

  return keys1.every(key => formats1[key] === formats2[key]);
};

/**
 * Detects changes between existing application and config.
 * Returns a patch object with only changed fields, or null if no changes.
 */
export const detectApplicationChanges = (
  existingApp: Application,
  configApp: ApplicationsType,
): ApplicationPatch | null => {
  const patch: ApplicationPatch = {};
  const isWebsiteType = configApp.type === 'website';

  if (configApp.displayName !== existingApp.displayName)
    patch.displayName = configApp.displayName;

  if (configApp.type !== normalizeType(existingApp.type))
    patch.type = configApp.type as any;

  if (
    isContentRef(configApp.entryPoint) &&
    configApp.entryPoint !== existingApp.entryPoint
  )
    patch.entryPoint = configApp.entryPoint;

  if (configApp.isDefault !== existingApp.isDefault)
    patch.isDefault = configApp.isDefault;

  if (configApp.useApplicationSpecificAssets !== existingApp.useApplicationSpecificAssets)
    patch.useApplicationSpecificAssets = configApp.useApplicationSpecificAssets;

  if (!areHostsEqual(existingApp.hosts, configApp.hosts))
    patch.hosts = configApp.hosts as any;

  if (isWebsiteType) {
    if (configApp.usePreviewTokens !== existingApp.usePreviewTokens)
      patch.usePreviewTokens = configApp.usePreviewTokens;

    if (
      !arePreviewUrlFormatsEqual(
        existingApp.previewUrlFormats,
        configApp.previewUrlFormats,
      )
    )
      patch.previewUrlFormats = configApp.previewUrlFormats;
  }

  return Object.keys(patch).length ? patch : null;
};

// VALIDATION HELPERS

const validateEntryPoint = (app: ApplicationsType): void => {
  if (!app.entryPoint)
    throw new Error(`No entryPoint defined for application ${app.key}`);
};

const validateInProcessWebsiteFields = (app: ApplicationsType): void => {
  if (
    app.type === 'inProcessWebsite' &&
    ('usePreviewTokens' in app || 'previewUrlFormats' in app)
  )
    throw new Error(`Invalid fields for inProcessWebsite application ${app.key}`);
};

const setDefaultPreviewFormats = (app: ApplicationsType): void => {
  if (app.type !== 'inProcessWebsite' && !app.previewUrlFormats) {
    app.previewUrlFormats = {
      any: '{host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}',
    };
  }
};

// API OPERATIONS

const createApplication = async (
  application: Application,
  host?: string,
): Promise<Application | undefined> => {
  const client = await createApiClient(host);

  const response = await client.POST('/applications', {
    body: application,
    params: {
      header: {
        Prefer: ['return=representation'],
      },
    },
  });

  if (!response.response.ok) throw formatApiError(response, 'create application');

  return response.data;
};

const updateApplication = async (
  key: string,
  patch: ApplicationPatch,
  host?: string,
): Promise<void> => {
  const client = await createApiClient(host);

  const response = await client.PATCH('/applications/{key}', {
    params: {
      path: { key },
    },
    body: patch,
    bodySerializer: body => JSON.stringify(body),
    headers: {
      'Content-Type': 'application/merge-patch+json',
    },
  });

  if (!response.response.ok) throw formatApiError(response, 'update application');
};

// APPLICATION

const getApplication = async (
  key: string,
  host?: string,
): Promise<Application | undefined> => {
  const client = await createApiClient(host);

  const response = await client.GET('/applications/{key}', {
    params: {
      path: { key },
    },
  });

  if (response.response.status === 404) return undefined;

  if (!response.response.ok)
    throw new Error(
      `Failed to get application: ${response.error?.title || 'Unknown error'}`,
    );

  return response.data;
};

const handleExistingApplication = async (
  existingApp: Application,
  app: ApplicationsType,
  host?: string,
): Promise<{ updated: boolean }> => {
  const changes = detectApplicationChanges(existingApp, app);

  if (!changes) return { updated: false };

  await updateApplication(app.key!, changes, host);
  return { updated: true };
};

const checkApplicationsWithContent = async (
  applications: ApplicationsType[],
  host?: string,
): Promise<void> => {
  for (const app of applications) {
    const appSpinner = ora(`Checking application "${app.displayName}"`).start();

    try {
      const existingApp = await getApplication(app.key!, host);

      if (existingApp) {
        const { updated } = await handleExistingApplication(existingApp, app, host);
        const message =
          updated ?
            `Application "${app.displayName}" updated (${app.key})`
          : `Application "${app.displayName}" is up to date (${app.key})`;
        appSpinner.succeed(chalk.green(message));
        continue;
      }

      validateEntryPoint(app);
      validateInProcessWebsiteFields(app);
      setDefaultPreviewFormats(app);

      const result = await checkApplication(app, host);
      appSpinner.succeed(
        chalk.green(`Application "${app.displayName}" created (${result.key})`),
      );
    } catch (error) {
      const errorMessage = (error as Error).message;
      appSpinner.fail(chalk.red(`Failed to ensure application "${app.displayName}"`));

      if (errorMessage.includes('No entryPoint'))
        console.error(
          chalk.dim('Configure entryPoint in application config via content array'),
        );

      if (errorMessage.includes('Invalid fields'))
        console.error(
          chalk.dim(
            "Fields 'usePreviewTokens' and 'previewUrlFormats' are only valid for type 'website'",
          ),
        );

      if (errorMessage.includes('entry points cannot overlap'))
        console.error(
          chalk.dim(
            `The entry point for "${app.displayName}" is already in use by another application.\nEach entry point can only be assigned to one application.\nTo fix: either use a different entry point or remove/update the conflicting application in CMS.`,
          ),
        );

      throw error;
    }
  }
};

/**
 * Ensures an application exists. Creates it if not present.
 * Returns the application key.
 */
export const checkApplication = async (
  application: ApplicationsType,
  host?: string,
): Promise<{ key: string; existed: boolean }> => {
  if (!application.key) throw new Error('Application key is required');

  const existing = await getApplication(application.key, host);
  if (existing) return { key: application.key, existed: true };

  const created = await createApplication(application as unknown as Application, host);
  if (!created?.key) throw new Error('Failed to create application: no key returned');

  return { key: created.key, existed: false };
};

/**
 * Checks if applications exist and processes content/creates apps if needed.
 * Returns true if all apps already existed (skipped processing).
 */
export const checkApplications = async (
  applications: ApplicationsType[],
  contentArray: any[] | undefined,
  host?: string,
): Promise<boolean> => {
  if (applications.length === 0) return true;

  const checkSpinner = ora('Checking applications').start();
  const existingApps = await Promise.all(
    applications.map(app => getApplication(app.key!, host)),
  );
  const allAppsExist = existingApps.every(app => app !== undefined);

  if (allAppsExist)
    checkSpinner.succeed(chalk.green('All applications exist, checking for updates'));
  else checkSpinner.info(chalk.blue('Some applications need setup'));

  const { processContentWithApplications } = await import('./contentService.js');

  const contentSpinner = ora('Processing content configuration').start();
  try {
    await processContentWithApplications(contentArray || [], applications, host);
    contentSpinner.succeed(chalk.green('Content configuration processed'));
  } catch (error) {
    contentSpinner.fail(chalk.red('Failed to process content configuration'));
    throw error;
  }

  await checkApplicationsWithContent(applications, host);

  return false;
};
