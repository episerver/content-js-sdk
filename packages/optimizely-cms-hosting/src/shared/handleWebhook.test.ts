import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleGraphWebhook, type OriginCache } from './handleWebhook.js';

const mocks = vi.hoisted(() => ({
  resolveDocPath: vi.fn(),
  purgeCdnCache: vi.fn(),
  getSiteHostnames: vi.fn(),
}));

vi.mock('./graph.js', () => ({ resolveDocPath: mocks.resolveDocPath }));
vi.mock('./cdn.js', () => ({
  purgeCdnCache: mocks.purgeCdnCache,
  getSiteHostnames: mocks.getSiteHostnames,
}));

const webhook = (body: unknown, apiKey: string | null = 'callback-key') =>
  new Request('https://site.test/hooks/graph', {
    method: 'POST',
    headers: { 'content-type': 'text/plain', ...(apiKey && { 'x-api-key': apiKey }) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const docEvent = (action: string, docId = 'abc_en_Published') => ({
  type: { subject: 'doc', action },
  data: { docId },
});

let events: string[];
let cache: OriginCache;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('OPTIMIZELY_GRAPH_CALLBACK_APIKEY', 'callback-key');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  events = [];
  cache = {
    invalidate: vi.fn(async path => void events.push(`invalidate ${path}`)),
    clear: vi.fn(async () => void events.push('clear')),
  };
  mocks.getSiteHostnames.mockResolvedValue(['www.mysite.com']);
  mocks.purgeCdnCache.mockImplementation(
    async urls => void events.push(`purge ${urls ?? 'roots'}`),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('handleGraphWebhook', () => {
  it.each([
    ['a missing key', null],
    ['a wrong key', 'wrong-key'],
    ['a key of another length', 'callback-key-2'],
  ])('rejects %s with 401', async (_, apiKey) => {
    const response = await handleGraphWebhook(
      webhook(docEvent('updated'), apiKey),
      cache,
    );

    expect(response.status).toBe(401);
    expect(cache.invalidate).not.toHaveBeenCalled();
  });

  it('rejects every request when no callback key is configured', async () => {
    vi.stubEnv('OPTIMIZELY_GRAPH_CALLBACK_APIKEY', undefined);

    const response = await handleGraphWebhook(webhook(docEvent('updated'), ''), cache);

    expect(response.status).toBe(401);
  });

  it.each(['not json', '[1]', 'null'])('rejects the body %s with 400', async body => {
    const response = await handleGraphWebhook(webhook(body), cache);

    expect(response.status).toBe(400);
  });

  it.each(['updated', 'expired'])(
    'refreshes the page and the home page on doc.%s, origin first',
    async action => {
      mocks.resolveDocPath.mockResolvedValue('/en/about');

      const response = await handleGraphWebhook(webhook(docEvent(action)), cache);

      expect(await response.json()).toEqual({ received: true });
      expect(mocks.resolveDocPath).toHaveBeenCalledWith('abc_en_Published');
      expect(events).toEqual([
        'invalidate /en/about',
        'invalidate /',
        `purge ${[
          'https://www.mysite.com/en/about',
          'https://www.mysite.com/en/about/',
          'https://www.mysite.com/',
        ]}`,
      ]);
    },
  );

  it('purges the paths on every site hostname', async () => {
    mocks.resolveDocPath.mockResolvedValue('/en');
    mocks.getSiteHostnames.mockResolvedValue(['www.mysite.com', 'mysite.dxcloud.test']);

    await handleGraphWebhook(webhook(docEvent('updated')), cache);

    expect(mocks.purgeCdnCache).toHaveBeenCalledWith([
      'https://www.mysite.com/en',
      'https://www.mysite.com/en/',
      'https://www.mysite.com/',
      'https://mysite.dxcloud.test/en',
      'https://mysite.dxcloud.test/en/',
      'https://mysite.dxcloud.test/',
    ]);
  });

  it.each([
    ['has no URL', () => mocks.resolveDocPath.mockResolvedValue(undefined)],
    [
      'cannot be resolved',
      () => mocks.resolveDocPath.mockRejectedValue(new Error('down')),
    ],
  ])('refreshes only the home page when the content %s', async (_, arrange) => {
    arrange();

    const response = await handleGraphWebhook(webhook(docEvent('expired')), cache);

    expect(response.status).toBe(200);
    expect(events).toEqual(['invalidate /', 'purge https://www.mysite.com/']);
  });

  it('answers 200 when the CDN purge fails', async () => {
    mocks.resolveDocPath.mockResolvedValue('/en');
    mocks.purgeCdnCache.mockRejectedValue(new Error('403'));

    const response = await handleGraphWebhook(webhook(docEvent('updated')), cache);

    expect(response.status).toBe(200);
    expect(console.error).toHaveBeenCalled();
  });

  it('clears the deployment and purges the site roots on a bulk deletion', async () => {
    const bulk = {
      type: { subject: 'bulk', action: 'completed' },
      data: { items: { a_en_Published: 'indexed', b_en_Published: 'deleted' } },
    };

    await handleGraphWebhook(webhook(bulk), cache);

    expect(events).toEqual(['clear', 'purge roots']);
  });

  it.each([
    [
      'a bulk change without deletions',
      {
        type: { subject: 'bulk', action: 'completed' },
        data: { items: { a: 'indexed' } },
      },
    ],
    ['another doc action', docEvent('created')],
    [
      'a doc event without docId',
      { type: { subject: 'doc', action: 'updated' }, data: {} },
    ],
  ])('ignores %s', async (_, body) => {
    const response = await handleGraphWebhook(webhook(body), cache);

    expect(response.status).toBe(200);
    expect(events).toEqual([]);
  });
});
