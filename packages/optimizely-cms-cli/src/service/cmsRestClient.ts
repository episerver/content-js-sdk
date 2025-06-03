import createClient from 'openapi-fetch';
import { paths } from './apiSchema/openapi-schema-types.js';
import { readCredentials } from './config.js';
import { credentialErrors } from './error.js';

export async function getToken(
  cmsRoot: string,
  clientId: string,
  clientSecret: string
) {
  const baseUrl = new URL('https://api.cms.optimizely.com').toString();
  const client = createClient<paths>({ baseUrl });

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
  url,
  clientId,
  clientSecret,
}: {
  url: string;
  clientId: string;
  clientSecret: string;
}) {
  const baseUrl = new URL('/_cms/preview3', url).toString();
  const accessToken = await getToken(url, clientId, clientSecret);

  return createClient<paths>({
    baseUrl,
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createApiClient(host?: string) {
  const cred = readCredentials(host ?? process.env.OPTIMIZELY_CMS_HOST);

  if (!cred) {
    throw new credentialErrors.NoCredentialsFound();
  }

  const client = await createRestApiClient(cred);
  return client;
}
