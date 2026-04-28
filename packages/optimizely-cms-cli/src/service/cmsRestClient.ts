import createClient from 'openapi-fetch';
import { readEnvCredentials } from './config.js';
import { credentialErrors } from './error.js';
import { OAuthPaths } from './apiSchema/gateway-auth-types.js';
import { paths } from './apiSchema/openapi-schema-types.js';

const DEFAULT_GATEWAY_URL = 'https://api.cms.optimizely.com';

/**
 * Determines if the provided URL matches the pattern of a SaaS API gateway.
 * @param url - The URL to check
 * @returns True if the URL is a SaaS API gateway, false otherwise
 */
function isSaasApiGateway(url: string): boolean {
  // Matches: api.cms.optimizely.com, api.cmstest.optimizely.com, api-<tenant>.cms*.optimizely.com
  return /^https:\/\/api(-[^.]+)?\.cms[^.]*\.optimizely\.com$/.test(url);
}

/**
 * Resolves the effective CMS host, falling back to the environment variable and
 * then the default SaaS gateway URL. Trailing slashes are stripped.
 */
function resolveHost(host?: string): string {
  return (host || process.env.OPTIMIZELY_CMS_API_URL || DEFAULT_GATEWAY_URL).replace(/\/$/, '');
}

/**
 * Constructs the root URL for the CMS API, optionally omitting the version segment.
 * @param options - Configuration options for constructing the URL
 * @param options.host - An optional host URL to use as the base for the API
 * @param options.omitVersion - A boolean flag indicating whether to omit the version segment from the URL
 * @returns The constructed root URL for the CMS API
 */
function rootUrl(options?: { host?: string; omitVersion?: boolean }): string {
  const API_VERSION = 'v1';
  const omitVersion = options?.omitVersion ?? false;

  const baseUrl = resolveHost(options?.host);

  // PaaS instances always require /_cms prefix and version
  if (!isSaasApiGateway(baseUrl)) {
    return `${baseUrl}/_cms/${API_VERSION}`;
  }

  // SaaS gateways: omitVersion is 'true' when used for the token endpoint
  if (omitVersion) return baseUrl;

  return `${baseUrl}/${API_VERSION}`;
}

export async function getToken(clientId: string, clientSecret: string, host?: string) {
  const client = createClient<OAuthPaths>({
    baseUrl: rootUrl({ host, omitVersion: true }),
  });

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

        throw new Error('Something went wrong when trying to fetch token. Please try again');
      }

      if (!data) {
        throw new Error('The endpoint `/oauth/token` did not respond with data');
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


