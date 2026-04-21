import type { components } from './apiSchema/openapi-schema-types.js';
import type { ApplicationsType } from '@optimizely/cms-sdk/buildConfig';
import { createApiClient } from './cmsRestClient.js';

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
    throw new Error(
      `Failed to create application: ${response.error?.title || 'Unknown error'}`,
    );
  }

  return response.data;
}

export async function getApplication(
  key: string,
  host?: string,
): Promise<Application | undefined> {
  const client = await createApiClient(host);

  const response = await client.GET('/applications/{key}', {
    params: {
      path: { key },
    },
  });

  if (!response.response.ok) {
    throw new Error(
      `Failed to get application: ${response.error?.title || 'Unknown error'}`,
    );
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
    throw new Error(
      `Failed to list applications: ${response.error?.title || 'Unknown error'}`,
    );
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
): Promise<string> {
  if (!application.key) {
    throw new Error('Application key is required');
  }

  try {
    // Check if application already exists
    const existing = await getApplication(application.key, host);
    if (existing) {
      return application.key;
    }
  } catch (error) {
    // Application doesn't exist, will create below
  }

  // Create application (cast to Application for API compatibility)
  const created = await createApplication(application as unknown as Application, host);
  if (!created?.key) {
    throw new Error('Failed to create application: no key returned');
  }

  return created.key;
}
