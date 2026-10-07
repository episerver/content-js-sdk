/** Client for the DXP Deployment API, which deploys packages to front-end hosting */

import { createHash, createHmac, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { HostingCredentials } from '../config.js';
import { hostingErrors } from '../error.js';

/** Expected deployment statuses; the API documents `status` as a plain string, so others may still arrive */
export type DeploymentStatus =
  | 'InProgress'
  | 'AwaitingVerification'
  | 'Completing'
  | 'Succeeded'
  | 'Failed'
  | 'Resetting'
  | 'Reset';

export type Deployment = {
  id: string;
  status: DeploymentStatus;
  percentComplete?: number;
  validationLinks?: string[];
  deploymentWarnings?: string[];
  deploymentErrors?: string[];
};

type ApiResponse<T> = { success?: boolean; errors?: string[]; result?: T };

type SignRequestInput = {
  clientKey: string;
  clientSecret: string;
  method: string;
  pathAndQuery: string;
  body: string;
  timestamp: number;
  nonce: string;
};

type ClientOptions = { apiUrl?: string; userAgent: string };

const DEFAULT_API_URL = 'https://paasportal.episerver.net/api/v1.0';
const BLOB_API_VERSION = '2021-08-06';

/** Build the `epi-hmac` Authorization header value for a Deployment API request */
export function signRequest({
  clientKey,
  clientSecret,
  method,
  pathAndQuery,
  body,
  timestamp,
  nonce,
}: SignRequestInput): string {
  const bodyHash = createHash('md5').update(body).digest('base64');
  const signature = createHmac('sha256', Buffer.from(clientSecret, 'base64'))
    .update(`${clientKey}${method}${pathAndQuery}${timestamp}${nonce}${bodyHash}`)
    .digest('base64');

  return `epi-hmac ${clientKey}:${timestamp}:${nonce}:${signature}`;
}

/** Derive the live site URL from a verification slot URL, or return undefined if it is not a slot URL */
export function toLiveSiteUrl(slotUrl: string): string | undefined {
  const [schemeAndWebApp, ...domain] = slotUrl.split('.');

  // Observed convention, not documented: the slot is served at <web app>-slot.<domain>
  if (!schemeAndWebApp.toLowerCase().endsWith('-slot')) return undefined;

  const liveUrl = [schemeAndWebApp.slice(0, -'-slot'.length), ...domain].join('.');
  return new URL(liveUrl).toString();
}

const readErrors = async (response: Response): Promise<string[]> => {
  const text = await response.text();

  try {
    return (JSON.parse(text) as ApiResponse<unknown>).errors ?? [];
  } catch {
    return text ? [text] : [];
  }
};

/** Create a Deployment API client for one front-end hosting project */
export function createDeploymentClient(
  { projectId, clientKey, clientSecret }: HostingCredentials,
  {
    apiUrl = process.env.OPTIMIZELY_DXP_API_URL ?? DEFAULT_API_URL,
    userAgent,
  }: ClientOptions,
) {
  const request = async <T>(
    action: string,
    method: 'GET' | 'POST',
    path: string,
    payload?: unknown,
  ): Promise<T> => {
    const url = new URL(`${apiUrl.replace(/\/$/, '')}/projects/${projectId}${path}`);
    const body = payload === undefined ? '' : JSON.stringify(payload);
    const authorization = signRequest({
      clientKey,
      clientSecret,
      method,
      pathAndQuery: url.pathname + url.search,
      body,
      timestamp: Date.now(),
      nonce: randomUUID().replaceAll('-', ''),
    });
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'User-Agent': userAgent,
        ...(body && { 'Content-Type': 'application/json' }),
      },
      body: body || undefined,
    });

    if (response.status === 401) throw new hostingErrors.InvalidHostingCredentials();
    if (response.status === 403)
      throw new hostingErrors.ForbiddenHostingCredentials(await readErrors(response));
    if (!response.ok)
      throw new hostingErrors.DeploymentApiError(
        action,
        response.status,
        await readErrors(response),
      );

    const json = (await response.json()) as ApiResponse<T>;

    if (json.success === false)
      throw new hostingErrors.DeploymentApiError(action, response.status, json.errors);

    return json.result as T;
  };

  return {
    getPackageLocation: async () =>
      (
        await request<{ location: string }>(
          'get the package upload location',
          'GET',
          '/packages/location',
        )
      ).location,

    /** Upload to the SAS container URL; `If-None-Match` stops an existing package from being overwritten */
    uploadPackage: async (location: string, packageName: string, path: string) => {
      const url = new URL(location);

      url.pathname = `${url.pathname.replace(/\/$/, '')}/${encodeURIComponent(packageName)}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'x-ms-version': BLOB_API_VERSION,
          'If-None-Match': '*',
          'Content-Type': 'application/zip',
        },
        body: await readFile(path),
      });

      if ([409, 412].includes(response.status))
        throw new hostingErrors.PackageExists(packageName);
      if (!response.ok)
        throw new hostingErrors.DeploymentApiError(
          'upload the package',
          response.status,
          [await response.text()],
        );
    },

    startDeployment: (targetEnvironment: string, packageName: string) =>
      request<Deployment>('start the deployment', 'POST', '/deployments', {
        targetEnvironment,
        packages: [packageName],
      }),

    getDeployment: (id: string) =>
      request<Deployment>('get the deployment status', 'GET', `/deployments/${id}`),

    completeDeployment: (id: string) =>
      request<Deployment>(
        'complete the deployment',
        'POST',
        `/deployments/${id}/complete`,
      ),
  };
}

/** Deployment API client created by `createDeploymentClient` */
export type DeploymentClient = ReturnType<typeof createDeploymentClient>;

