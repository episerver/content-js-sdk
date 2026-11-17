import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getToken = vi.hoisted(() => vi.fn());

vi.mock('@azure/identity', () => ({
  ManagedIdentityCredential: vi.fn(function () {
    return { getToken };
  }),
}));

const API_URL = 'https://platform.test';
const HOUR_MS = 60 * 60 * 1000;

const loadCdn = async () => {
  const cdn = await import('./cdn.js');
  const { ManagedIdentityCredential } = await import('@azure/identity');
  return { ...cdn, ManagedIdentityCredential };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const hostnames = (...names: [string, boolean?][]) =>
  json({
    items: names.map(([hostname, isCustomHostname]) => ({ hostname, isCustomHostname })),
  });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  fetchMock = vi.fn(async () => json({ operationId: 'op-1' }, 202));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('OPTIMIZELY_CLOUDPLATFORM_API_URL', `${API_URL}/`);
  vi.stubEnv('OPTIMIZELY_CLOUDPLATFORM_API_RESOURCE_ID', 'api://platform');
  vi.stubEnv('AZURE_CLIENT_ID', 'client-id');
  vi.stubEnv('OPTIMIZELY_SITE_HOSTNAME', 'https://mysite.dxcloud.test/');
  getToken.mockResolvedValue({
    token: 'token-1',
    expiresOnTimestamp: Date.now() + HOUR_MS,
  });
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('purgeCdnCache', () => {
  it('purges the URLs with a managed identity token', async () => {
    const { purgeCdnCache, ManagedIdentityCredential } = await loadCdn();

    await purgeCdnCache(['https://mysite.test/en']);

    expect(ManagedIdentityCredential).toHaveBeenCalledWith({ clientId: 'client-id' });
    expect(getToken).toHaveBeenCalledWith('api://platform/.default');
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/v1/edge-cache/purge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-1' },
      body: JSON.stringify({ urls: ['https://mysite.test/en'] }),
      signal: expect.any(AbortSignal),
    });
    expect(console.info).toHaveBeenCalledWith(
      '[cms-hosting] CDN purge accepted (operation op-1)',
    );
  });

  it('reuses the token until five minutes before it expires', async () => {
    vi.useFakeTimers({ now: 0, toFake: ['Date'] });
    getToken.mockResolvedValue({ token: 'token-1', expiresOnTimestamp: HOUR_MS });
    const { purgeCdnCache } = await loadCdn();

    await purgeCdnCache(['https://mysite.test/a']);
    vi.setSystemTime(HOUR_MS - 6 * 60 * 1000);
    await purgeCdnCache(['https://mysite.test/b']);
    expect(getToken).toHaveBeenCalledTimes(1);

    vi.setSystemTime(HOUR_MS - 4 * 60 * 1000);
    await purgeCdnCache(['https://mysite.test/c']);
    expect(getToken).toHaveBeenCalledTimes(2);
  });

  it('skips with a warning when the Cloud Platform API is not configured', async () => {
    vi.stubEnv('OPTIMIZELY_CLOUDPLATFORM_API_RESOURCE_ID', undefined);
    const { purgeCdnCache } = await loadCdn();

    await purgeCdnCache(['https://mysite.test/en']);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it('throws when the purge is rejected', async () => {
    fetchMock.mockResolvedValue(new Response('forbidden', { status: 403 }));
    const { purgeCdnCache } = await loadCdn();

    await expect(purgeCdnCache(['https://mysite.test/en'])).rejects.toThrow(
      '/v1/edge-cache/purge failed (403): forbidden',
    );
  });

  it('purges the root of every site hostname by default', async () => {
    fetchMock.mockResolvedValueOnce(
      hostnames(
        ['www.mysite.com', true],
        ['mysite.dxcloud.test'],
        ['mysite-slot.dxcloud.test'],
      ),
    );
    const { purgeCdnCache } = await loadCdn();

    await purgeCdnCache();

    expect(fetchMock).toHaveBeenLastCalledWith(
      `${API_URL}/v1/edge-cache/purge`,
      expect.objectContaining({
        body: JSON.stringify({
          urls: ['https://www.mysite.com/', 'https://mysite.dxcloud.test/'],
        }),
      }),
    );
  });
});

describe('purgeCdnPaths', () => {
  it('purges each path on every site hostname, with and without the trailing slash', async () => {
    fetchMock.mockResolvedValueOnce(
      hostnames(['www.mysite.com', true], ['mysite.dxcloud.test']),
    );
    const { purgeCdnPaths } = await loadCdn();

    await purgeCdnPaths(['/en/about', '/']);

    expect(fetchMock).toHaveBeenLastCalledWith(
      `${API_URL}/v1/edge-cache/purge`,
      expect.objectContaining({
        body: JSON.stringify({
          urls: [
            'https://www.mysite.com/en/about',
            'https://www.mysite.com/en/about/',
            'https://www.mysite.com/',
            'https://mysite.dxcloud.test/en/about',
            'https://mysite.dxcloud.test/en/about/',
            'https://mysite.dxcloud.test/',
          ],
        }),
      }),
    );
  });
});

describe('getSiteHostnames', () => {
  it('returns the non-slot hostnames and looks them up once', async () => {
    fetchMock.mockResolvedValue(
      hostnames(['www.mysite.com', true], ['mysite-slot.dxcloud.test']),
    );
    const { getSiteHostnames } = await loadCdn();

    expect(await getSiteHostnames()).toEqual(['www.mysite.com']);
    expect(await getSiteHostnames()).toEqual(['www.mysite.com']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/v1/environment/hostnames`, {
      headers: { Authorization: 'Bearer token-1' },
      signal: expect.any(AbortSignal),
    });
  });

  it('shares one lookup between concurrent calls', async () => {
    fetchMock.mockResolvedValue(hostnames(['www.mysite.com']));
    const { getSiteHostnames } = await loadCdn();

    await Promise.all([getSiteHostnames(), getSiteHostnames()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses OPTIMIZELY_SITE_HOSTNAME without the Cloud Platform API', async () => {
    vi.stubEnv('OPTIMIZELY_CLOUDPLATFORM_API_URL', undefined);
    const { getSiteHostnames } = await loadCdn();

    expect(await getSiteHostnames()).toEqual(['mysite.dxcloud.test']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses OPTIMIZELY_SITE_HOSTNAME when the lookup fails, and retries later', async () => {
    fetchMock.mockResolvedValueOnce(new Response('down', { status: 503 }));
    fetchMock.mockResolvedValueOnce(hostnames(['www.mysite.com']));
    const { getSiteHostnames } = await loadCdn();

    expect(await getSiteHostnames()).toEqual(['mysite.dxcloud.test']);
    expect(console.error).toHaveBeenCalled();
    expect(await getSiteHostnames()).toEqual(['www.mysite.com']);
  });

  it('returns nothing when no hostname is known', async () => {
    vi.stubEnv('OPTIMIZELY_CLOUDPLATFORM_API_URL', undefined);
    vi.stubEnv('OPTIMIZELY_SITE_HOSTNAME', undefined);
    const { getSiteHostnames } = await loadCdn();

    expect(await getSiteHostnames()).toEqual([]);
  });
});
