import createClient from 'openapi-fetch';
import { paths } from './apiSchema/openapi-schema-types.js';
import { readEnvCredentials } from './config.js';
import { credentialErrors } from './error.js';

/**
 * Constructs the root URL for the CMS API, optionally omitting the version segment.
 * @param options - Configuration options for constructing the URL
 * @param options.host - An optional host URL to use as the base for the API
 * @param options.omitVersion - A boolean flag indicating whether to omit the version segment from the URL
 * @returns The constructed root URL for the CMS API
 */
function rootUrl(options?: { host?: string; omitVersion?: boolean }): string {
  const API_VERSION = 'preview3';
  const DEFAULT_GATEWAY_URL = 'https://api.cms.optimizely.com';
  const host = options?.host;
  const omitVersion = options?.omitVersion ?? false;

  // Remove trailing slash if present for consistency
  const baseUrl = (
    host ||
    process.env.OPTIMIZELY_CMS_API_URL ||
    DEFAULT_GATEWAY_URL
  ).replace(/\/$/, '');

  if (omitVersion) return baseUrl;

  // Check if URL is an Optimizely API gateway (e.g., https://api.*.optimizely.com)
  const isOptimizelyGateway =
    baseUrl.startsWith('https://api.') && baseUrl.endsWith('.optimizely.com');
  // The prefix _cms is needed for CMS PaaS (local or non-gateway URLs)
  const pathPrefix = isOptimizelyGateway ? '' : '/_cms';

  return `${baseUrl}${pathPrefix}/${API_VERSION}`;
}

export async function getToken(
  clientId: string,
  clientSecret: string,
  host?: string,
) {
  const client = createClient<paths>({ baseUrl: rootUrl({ host, omitVersion: true }) });

  return client
    .POST('/oauth/token', {
      body: {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      },
    })
    .then(({ response, data, error }) => {
      if (!response.ok) {
        // In CMS production:
        if (error?.code === 'invalid_client') {
          throw new credentialErrors.InvalidCredentials();
        }

        // In CMS test:
        if (error?.code === 'AUTHENTICATION_ERROR') {
          throw new credentialErrors.InvalidCredentials();
        }

        // Generic error message:

        throw new Error(
          'Something went wrong when trying to fetch token. Please try again',
        );
      }

      if (!data) {
        throw new Error(
          'The endpoint `/oauth/token` did not respond with data',
        );
      }
      return data.access_token;
    });
}

export async function createRestApiClient({
  clientId,
  clientSecret,
  host,
}: {
  clientId: string;
  clientSecret: string;
  host?: string;
}) {
  const baseUrl = rootUrl({ host });
  const accessToken = await getToken(clientId, clientSecret, host);

  return createClient<paths>({
    baseUrl,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createApiClient(host?: string) {
  const cred = readEnvCredentials();
  const client = await createRestApiClient({ ...cred, host });
  return client;
}
