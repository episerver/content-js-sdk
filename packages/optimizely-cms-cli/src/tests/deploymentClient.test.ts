import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createDeploymentClient,
  signRequest,
  toLiveSiteUrl,
} from '../service/hosting/deploymentClient.js';

const credentials = {
  projectId: 'p1',
  clientKey: 'test-key',
  clientSecret: 'c3VwZXItc2VjcmV0LWJ5dGVz',
};
const startBody = '{"targetEnvironment":"Test1","packages":["site.head.app.1.0.0.zip"]}';

const jsonResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Expected signatures were computed independently with Python's hmac/hashlib
describe('signRequest', () => {
  const base = { ...credentials, timestamp: 1700000000000, nonce: 'abc123' };

  it('signs a request without a body', () => {
    expect(
      signRequest({ ...base, method: 'GET', pathAndQuery: '/api/v1.0/projects/p1/packages/location', body: '' }),
    ).toBe('epi-hmac test-key:1700000000000:abc123:cGQQPZe3DNbao1+kX8uqsiMYyUNojPcdBnpHpNY9YSA=');
  });

  it('signs a request with a JSON body', () => {
    expect(
      signRequest({ ...base, method: 'POST', pathAndQuery: '/api/v1.0/projects/p1/deployments', body: startBody }),
    ).toBe('epi-hmac test-key:1700000000000:abc123:+WZwgN0S5Xoa7ftamUaeeYJCvYrDaeljjW8OdWxthOw=');
  });
});

describe('toLiveSiteUrl', () => {
  it('drops the -slot suffix from the web app name', () => {
    expect(toLiveSiteUrl('http://opin03head9xi14t001-slot.dxcloud.episerver.net/')).toBe(
      'https://opin03head9xi14t001.dxcloud.episerver.net/',
    );
  });

  it('matches the suffix regardless of case', () => {
    expect(toLiveSiteUrl('HTTP://OPIN03HEAD-SLOT.dxcloud.episerver.net/')).toBe(
      'https://opin03head.dxcloud.episerver.net/',
    );
  });

  it('returns undefined for a URL that is not a slot URL', () => {
    expect(toLiveSiteUrl('https://site.dxcloud.episerver.net/')).toBeUndefined();
    expect(toLiveSiteUrl('https://www.slot-machine.com/')).toBeUndefined();
  });
});

describe('createDeploymentClient', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const client = createDeploymentClient(credentials, {
    apiUrl: 'https://paas.test/api/v1.0/',
    userAgent: 'optimizely-cms-cli/0.0.0',
  });
  const lastRequest = () => {
    const [url, init] = fetchMock.mock.calls.at(-1)!;

    return { url: String(url), init: init!, headers: init!.headers as Record<string, string> };
  };

  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('starts a deployment with a signed JSON request and unwraps the result', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, errors: [], result: { id: 'd1', status: 'InProgress' } }));

    await expect(client.startDeployment('Test1', 'site.head.app.1.0.0.zip')).resolves.toEqual({
      id: 'd1',
      status: 'InProgress',
    });

    const { url, init, headers } = lastRequest();

    expect(url).toBe('https://paas.test/api/v1.0/projects/p1/deployments');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(startBody);
    expect(headers.Authorization).toMatch(/^epi-hmac test-key:\d+:[0-9a-f]{32}:.+=$/);
    expect(headers['User-Agent']).toBe('optimizely-cms-cli/0.0.0');
    expect(headers.Authorization).not.toContain(credentials.clientSecret);
  });

  describe('checkEnvironmentAccess', () => {
    it('reads the environment storage containers', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: true, result: { storageContainers: [] } }));

      await client.checkEnvironmentAccess('Test1');

      expect(lastRequest().url).toBe(
        'https://paas.test/api/v1.0/projects/p1/environments/Test1/storagecontainers',
      );
    });

    it.each([
      [401, /credentials were rejected/],
      [403, /no access[\s\S]*Access denied for the environment Bogus/],
    ])('fails on HTTP %i', async (status, message) => {
      fetchMock.mockResolvedValue(
        jsonResponse({ success: false, errors: ['Access denied for the environment Bogus'] }, status),
      );

      await expect(client.checkEnvironmentAccess('Bogus')).rejects.toThrow(message);
    });

    it('leaves other failures to the deployment', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ success: false, errors: ['Not found'] }, 404));

      await expect(client.checkEnvironmentAccess('Test1')).resolves.toBeUndefined();
    });
  });

  it('sends no body or content type when completing', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, result: { id: 'd1', status: 'Completing' } }));

    await client.completeDeployment('d1');

    const { url, init, headers } = lastRequest();

    expect(url).toBe('https://paas.test/api/v1.0/projects/p1/deployments/d1/complete');
    expect(init.body).toBeUndefined();
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('returns the package upload location', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, result: { location: 'https://blob.test/packages?sv=1' } }));

    await expect(client.getPackageLocation()).resolves.toBe('https://blob.test/packages?sv=1');
  });

  it.each([
    [401, /credentials were rejected/],
    [403, /no access to this project or environment/],
  ])('maps HTTP %i to a credentials error', async (status, message) => {
    fetchMock.mockResolvedValue(jsonResponse({}, status));

    await expect(client.getDeployment('d1')).rejects.toThrow(message);
  });

  it('includes the API errors in the 403 message', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, errors: ['Access denied for the environment Production'] }, 403),
    );

    await expect(client.startDeployment('Production', 'a.zip')).rejects.toThrow(
      /no access[\s\S]*- Access denied for the environment Production/,
    );
  });

  it('lists the API errors on failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false, errors: ['Package not found'] }, 400));

    await expect(client.getDeployment('d1')).rejects.toThrow(
      /Failed to get the deployment status \(HTTP 400\)\n {2}- Package not found/,
    );
  });

  it('treats success: false on HTTP 200 as a failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false, errors: ['Environment busy'] }));

    await expect(client.startDeployment('Test1', 'a.zip')).rejects.toThrow(/Environment busy/);
  });

  describe('uploadPackage', () => {
    let dir: string;

    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), 'cli-upload-'));
      await writeFile(join(dir, 'site.zip'), 'zip-content');
    });
    afterEach(() => rm(dir, { recursive: true, force: true }));

    it('puts the blob into the SAS container without overwriting', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 201 }));

      await client.uploadPackage('https://blob.test/packages/?sv=1&sig=abc', 'site.head.app.1.0.0.zip', join(dir, 'site.zip'));

      const { url, init, headers } = lastRequest();

      expect(url).toBe('https://blob.test/packages/site.head.app.1.0.0.zip?sv=1&sig=abc');
      expect(init.method).toBe('PUT');
      expect(headers['x-ms-blob-type']).toBe('BlockBlob');
      expect(headers['If-None-Match']).toBe('*');
      expect(String(init.body)).toBe('zip-content');
    });

    it.each([409, 412])('reports an existing package on HTTP %i', async status => {
      fetchMock.mockResolvedValue(new Response(null, { status }));

      await expect(
        client.uploadPackage('https://blob.test/packages?sv=1', 'site.head.app.1.0.0.zip', join(dir, 'site.zip')),
      ).rejects.toThrow(/already uploaded.*--version/);
    });
  });
});
