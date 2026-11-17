import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerWebhook } from './webhooks.js';

const ENDPOINT = 'https://cg.optimizely.com/api/webhooks';
const CALLBACK_URL = 'https://mysite.dxcloud.test/hooks/graph';
const AUTHORIZATION = `Basic ${btoa('app-key:secret')}`;

const webhook = (
  id: string,
  url = CALLBACK_URL,
  { apiKey = 'callback-key', disabled = false } = {},
) => ({ id, disabled, request: { url, headers: { 'x-api-key': apiKey } } });
const json = (body: unknown) => new Response(JSON.stringify(body));

let fetchMock: ReturnType<typeof vi.fn>;

const calls = () =>
  fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${url}`);

beforeEach(() => {
  fetchMock = vi.fn(async () => json([]));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('OPTIMIZELY_GRAPH_GATEWAY', undefined);
  vi.stubEnv('OPTIMIZELY_GRAPH_APP_KEY', 'app-key');
  vi.stubEnv('OPTIMIZELY_GRAPH_SECRET', 'secret');
  vi.stubEnv('OPTIMIZELY_GRAPH_CALLBACK_APIKEY', 'callback-key');
  vi.stubEnv('OPTIMIZELY_SITE_HOSTNAME', 'mysite.dxcloud.test');
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('registerWebhook', () => {
  it('creates the webhook when it does not exist', async () => {
    fetchMock.mockResolvedValueOnce(
      json([webhook('a', 'https://other.test/hooks/graph')]),
    );

    await registerWebhook();

    expect(calls()).toEqual([`GET ${ENDPOINT}`, `POST ${ENDPOINT}`]);
    const [, init] = fetchMock.mock.calls[1];
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: AUTHORIZATION,
    });
    expect(JSON.parse(init.body)).toEqual({
      disabled: false,
      request: {
        url: CALLBACK_URL,
        method: 'post',
        headers: { 'x-api-key': 'callback-key' },
      },
      topic: ['*.*'],
      filters: [{ status: { eq: 'Published' } }],
    });
  });

  it('does nothing when the webhook exists', async () => {
    fetchMock.mockResolvedValueOnce(json([webhook('a')]));

    await registerWebhook();

    expect(calls()).toEqual([`GET ${ENDPOINT}`]);
    expect(console.info).toHaveBeenCalledWith(
      `[cms-hosting] The Graph webhook for ${CALLBACK_URL} is already registered`,
    );
  });

  it('keeps the webhook with the highest id and deletes the duplicates', async () => {
    fetchMock.mockResolvedValueOnce(json([webhook('b'), webhook('c'), webhook('a')]));

    await registerWebhook();

    expect(calls()).toEqual([
      `GET ${ENDPOINT}`,
      `DELETE ${ENDPOINT}/b`,
      `DELETE ${ENDPOINT}/a`,
    ]);
  });

  it.each([
    ['an outdated API key', webhook('a', CALLBACK_URL, { apiKey: 'old-key' })],
    ['a disabled webhook', webhook('a', CALLBACK_URL, { disabled: true })],
  ])('replaces %s', async (_, existing) => {
    fetchMock.mockResolvedValueOnce(json([existing]));

    await registerWebhook();

    expect(calls()).toEqual([
      `GET ${ENDPOINT}`,
      `DELETE ${ENDPOINT}/a`,
      `POST ${ENDPOINT}`,
    ]);
  });

  it('uses the callback path and the gateway origin', async () => {
    vi.stubEnv('OPTIMIZELY_GRAPH_GATEWAY', 'https://cg.staging.test/content/v2/');
    vi.stubEnv('OPTIMIZELY_SITE_HOSTNAME', 'https://mysite.dxcloud.test/');

    await registerWebhook({ callbackPath: '/api/graph' });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://cg.staging.test/api/webhooks');
    expect(JSON.parse(init.body).request.url).toBe(
      'https://mysite.dxcloud.test/api/graph',
    );
  });

  it.each([
    'OPTIMIZELY_GRAPH_APP_KEY',
    'OPTIMIZELY_GRAPH_SECRET',
    'OPTIMIZELY_GRAPH_CALLBACK_APIKEY',
    'OPTIMIZELY_SITE_HOSTNAME',
  ])('skips registration without %s', async variable => {
    vi.stubEnv(variable, undefined);

    await registerWebhook();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      `[cms-hosting] Graph webhook not registered, missing ${variable}`,
    );
  });

  it('logs instead of throwing when Graph fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('unauthorized', { status: 401 }));

    await expect(registerWebhook()).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      '[cms-hosting] Graph webhook registration failed:',
      'GET /api/webhooks failed (401)',
    );
  });

  it('logs instead of throwing when Graph cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    await expect(registerWebhook()).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });
});
