import createClient from 'openapi-fetch';
import { paths } from './apiSchema/openapi-schema-types.js';
import { readCredentials, readEnvCredentials } from './config.js';
import { credentialErrors } from './error.js';

function rootUrl() {
  const rootUrl =
    process.env.OPTIMIZELY_CMS_API_URL || 'https://api.cms.optimizely.com';

  if (rootUrl.endsWith('/')) {
    return rootUrl.slice(0, -1);
  }

  return rootUrl;
}

export async function getToken(clientId: string, clientSecret: string) {
  const client = createClient<paths>({ baseUrl: rootUrl() });

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
        if (error?.error === 'invalid_client') {
          throw new credentialErrors.InvalidCredentials();
        }
        throw new Error(
          'Something went wrong when trying to fetch token. Please try again'
        );
      }

      if (!data) {
        throw new Error(
          'The endpoint `/oauth/token` did not respond with data'
        );
      }
      return data.access_token;
    });
}

export async function createRestApiClient({
  clientId,
  clientSecret,
}: {
  clientId: string;
  clientSecret: string;
}) {
  const baseUrl = rootUrl() + '/preview3';
  const accessToken = await getToken(clientId, clientSecret);

  return createClient<paths>({
    baseUrl,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createApiClient(host?: string) {
  const cred =
    readEnvCredentials() ||
    readCredentials(host ?? process.env.OPTIMIZELY_CMS_HOST);

  if (!cred) {
    throw new credentialErrors.NoCredentialsFound();
  }

  const client = await createRestApiClient(cred);
  return client;
}
