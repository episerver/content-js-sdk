import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiClient, createRestApiClient, getToken } from '../service/cmsRestClient.js';
import { credentialErrors } from '../service/error.js';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const tokenResponse = () => jsonResponse({ access_token: 'token-123' });

describe('cmsRestClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  const requestedUrls = () =>
    fetchMock.mock.calls.map(([request]) => (request as Request).url);

  beforeEach(() => {
    fetchMock = vi.fn(async () => tokenResponse());
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('OPTIMIZELY_CMS_API_URL', '');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('getToken', () => {
    test('requests a client-credentials token and returns the access token', async () => {
      await expect(getToken('id', 'secret')).resolves.toBe('token-123');

      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.method).toBe('POST');
      expect(await request.json()).toEqual({
        grant_type: 'client_credentials',
        client_id: 'id',
        client_secret: 'secret',
      });
    });

    test.each([
      ['error field', { error: 'invalid_client' }],
      ['code field', { code: 'invalid_client' }],
      ['CMS test AUTHENTICATION_ERROR', { code: 'AUTHENTICATION_ERROR' }],
    ])('reports invalid credentials for %s', async (_, body) => {
      fetchMock.mockResolvedValue(jsonResponse(body, 401));

      await expect(getToken('id', 'secret')).rejects.toBeInstanceOf(
        credentialErrors.InvalidCredentials,
      );
    });

    test('reports a generic failure for any other error response', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ code: 'SERVER_ERROR' }, 500));

      await expect(getToken('id', 'secret')).rejects.toThrow(
        'Something went wrong when trying to fetch token. Please try again',
      );
    });

    test('fails when the token endpoint responds without data', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

      await expect(getToken('id', 'secret')).rejects.toThrow(
        'The endpoint `/oauth/token` did not respond with data',
      );
    });

    test('explains how to accept self-signed certificates', async () => {
      fetchMock.mockRejectedValue(
        new TypeError('fetch failed', { cause: { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' } }),
      );

      await expect(getToken('id', 'secret')).rejects.toThrow(
        'Please set NODE_TLS_REJECT_UNAUTHORIZED=0',
      );
    });

    test('rethrows other network errors unchanged', async () => {
      const networkError = new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
      fetchMock.mockRejectedValue(networkError);

      await expect(getToken('id', 'secret')).rejects.toBe(networkError);
    });
  });

  describe('URL resolution', () => {
    const resolveUrls = async (host?: string) => {
      const client = await createRestApiClient({ clientId: 'id', clientSecret: 'secret', host });
      fetchMock.mockResolvedValue(jsonResponse({ items: [] }));
      await client.GET('/contenttypes');
      return requestedUrls();
    };

    test.each([
      ['default gateway', undefined, 'https://api.cms.optimizely.com'],
      ['test gateway', 'https://api.cmstest.optimizely.com', 'https://api.cmstest.optimizely.com'],
      [
        'tenant gateway',
        'https://api-acme.cms.optimizely.com',
        'https://api-acme.cms.optimizely.com',
      ],
      [
        'tenant test gateway',
        'https://api-acme.cmstest.optimizely.com',
        'https://api-acme.cmstest.optimizely.com',
      ],
    ])('uses the SaaS %s with an unversioned token endpoint', async (_, host, base) => {
      expect(await resolveUrls(host)).toEqual([
        `${base}/oauth/token`,
        `${base}/v1/contenttypes`,
      ]);
    });

    test('prefixes PaaS hosts with /_cms/v1 for every request', async () => {
      expect(await resolveUrls('https://my-site.example.com')).toEqual([
        'https://my-site.example.com/_cms/v1/oauth/token',
        'https://my-site.example.com/_cms/v1/contenttypes',
      ]);
    });

    test('strips a trailing slash from the host', async () => {
      expect(await resolveUrls('https://my-site.example.com/')).toEqual([
        'https://my-site.example.com/_cms/v1/oauth/token',
        'https://my-site.example.com/_cms/v1/contenttypes',
      ]);
    });

    test('falls back to OPTIMIZELY_CMS_API_URL when no host is given', async () => {
      vi.stubEnv('OPTIMIZELY_CMS_API_URL', 'https://env-site.example.com');

      expect(await resolveUrls()).toEqual([
        'https://env-site.example.com/_cms/v1/oauth/token',
        'https://env-site.example.com/_cms/v1/contenttypes',
      ]);
    });

    test('prefers the host over OPTIMIZELY_CMS_API_URL', async () => {
      vi.stubEnv('OPTIMIZELY_CMS_API_URL', 'https://env-site.example.com');

      expect((await resolveUrls('https://api.cms.optimizely.com'))[0]).toBe(
        'https://api.cms.optimizely.com/oauth/token',
      );
    });

    test('sends the fetched token as a bearer token', async () => {
      await resolveUrls();

      const request = fetchMock.mock.calls[1][0] as Request;
      expect(request.headers.get('authorization')).toBe('Bearer token-123');
    });
  });

  describe('createApiClient', () => {
    test('authenticates with the credentials from the environment', async () => {
      vi.stubEnv('OPTIMIZELY_CMS_CLIENT_ID', 'env-id');
      vi.stubEnv('OPTIMIZELY_CMS_CLIENT_SECRET', 'env-secret');

      await createApiClient('https://my-site.example.com');

      const request = fetchMock.mock.calls[0][0] as Request;
      expect(request.url).toBe('https://my-site.example.com/_cms/v1/oauth/token');
      expect(await request.json()).toMatchObject({
        client_id: 'env-id',
        client_secret: 'env-secret',
      });
    });

    test('fails before any request when credentials are missing', async () => {
      vi.stubEnv('OPTIMIZELY_CMS_CLIENT_ID', '');
      vi.stubEnv('OPTIMIZELY_CMS_CLIENT_SECRET', '');

      await expect(createApiClient()).rejects.toBeInstanceOf(
        credentialErrors.MissingCredentials,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
