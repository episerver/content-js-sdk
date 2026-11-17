import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleGraphWebhook, homePagePaths, type OriginCache } from './handleWebhook.js';

const mocks = vi.hoisted(() => ({
  resolveDocPaths: vi.fn(),
  purgeCdnPaths: vi.fn(),
  remembered: new Map<string, string[]>(),
}));

// The status suffix does not matter, as in docPaths.ts
const keyOf = (docId: string) => docId.split('_').slice(0, -1).join('_');

vi.mock('./graph.js', async importOriginal => ({
  ...(await importOriginal<typeof import('./graph.js')>()),
  resolveDocPaths: mocks.resolveDocPaths,
}));
vi.mock('./cdn.js', () => ({ purgeCdnPaths: mocks.purgeCdnPaths }));
vi.mock('./docPaths.js', () => ({
  rememberDocPaths: async (docId: string, paths: string[]) =>
    void mocks.remembered.set(keyOf(docId), paths),
  recallDocPaths: async (docId: string) => mocks.remembered.get(keyOf(docId)) ?? [],
  forgetDocPaths: async (docIds: string[]) =>
    docIds.forEach(docId => mocks.remembered.delete(keyOf(docId))),
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

const bulkEvent = (items: Record<string, string>) => ({
  type: { subject: 'bulk', action: 'completed' },
  data: { items },
});

let events: string[];
let cache: OriginCache;

const invalidated = () => events.filter(it => it.startsWith('invalidate'));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.remembered.clear();
  vi.stubEnv('OPTIMIZELY_GRAPH_CALLBACK_APIKEY', 'callback-key');
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  events = [];
  cache = {
    invalidate: vi.fn(async path => void events.push(`invalidate ${path}`)),
    clear: vi.fn(async () => void events.push('clear')),
  };
  mocks.purgeCdnPaths.mockImplementation(
    async paths => void events.push(`purge ${paths}`),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('handleGraphWebhook requests', () => {
  it.each([
    ['a missing key', null, 'no x-api-key header'],
    ['a wrong key', 'wrong-key', 'wrong x-api-key'],
    ['a key of another length', 'callback-key-2', 'wrong x-api-key'],
  ])('rejects %s with 401 and logs why', async (_, apiKey, reason) => {
    const response = await handleGraphWebhook(
      webhook(docEvent('updated'), apiKey),
      cache,
    );

    expect(response.status).toBe(401);
    expect(cache.invalidate).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      `[cms-hosting] Rejected a Graph webhook: ${reason}`,
    );
  });

  it('rejects every request when no callback key is configured', async () => {
    vi.stubEnv('OPTIMIZELY_GRAPH_CALLBACK_APIKEY', undefined);

    const response = await handleGraphWebhook(webhook(docEvent('updated'), ''), cache);

    expect(response.status).toBe(401);
    expect(console.warn).toHaveBeenCalledWith(
      '[cms-hosting] Rejected a Graph webhook: OPTIMIZELY_GRAPH_CALLBACK_APIKEY is not set',
    );
  });

  it.each(['not json', '[1]', 'null'])('rejects the body %s with 400', async body => {
    const response = await handleGraphWebhook(webhook(body), cache);

    expect(response.status).toBe(400);
    expect(console.warn).toHaveBeenCalledWith(
      '[cms-hosting] Rejected a Graph webhook: the body is not a JSON object',
    );
  });

  it.each([
    ['a bulk change without deletions', bulkEvent({ a_en_Published: 'indexed' })],
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

describe('handleGraphWebhook on a publish', () => {
  it.each(['updated', 'expired'])(
    'refreshes the page, the site root and the locale home on doc.%s, origin first',
    async action => {
      mocks.resolveDocPaths.mockResolvedValue(['/en/about']);

      const response = await handleGraphWebhook(webhook(docEvent(action)), cache);

      expect(await response.json()).toEqual({ received: true });
      expect(mocks.resolveDocPaths).toHaveBeenCalledWith('abc_en_Published');
      expect(events).toEqual([
        'invalidate /en/about',
        'invalidate /',
        'invalidate /en',
        'purge /en/about,/,/en',
      ]);
    },
  );

  it('logs the webhook and what it refreshed', async () => {
    mocks.resolveDocPaths.mockResolvedValue(['/en/about']);

    await handleGraphWebhook(webhook(docEvent('updated')), cache);

    expect(console.info).toHaveBeenCalledWith(
      '[cms-hosting] Received the Graph webhook doc.updated for abc_en_Published',
    );
    expect(console.info).toHaveBeenCalledWith(
      '[cms-hosting] Refreshed /en/about, /, /en in the origin cache',
    );
  });

  it('refreshes both URLs of a page with a simple address', async () => {
    mocks.resolveDocPaths.mockResolvedValue(['/about', '/en/about']);

    await handleGraphWebhook(webhook(docEvent('updated')), cache);

    expect(invalidated()).toEqual([
      'invalidate /about',
      'invalidate /en/about',
      'invalidate /',
      'invalidate /en',
    ]);
  });

  it('answers 200 when the CDN purge fails', async () => {
    mocks.resolveDocPaths.mockResolvedValue(['/en']);
    mocks.purgeCdnPaths.mockRejectedValue(new Error('403'));

    const response = await handleGraphWebhook(webhook(docEvent('updated')), cache);

    expect(response.status).toBe(200);
    expect(console.error).toHaveBeenCalled();
  });

  it('logs the paths whose origin refresh failed instead of reporting success', async () => {
    mocks.resolveDocPaths.mockResolvedValue(['/en/about']);
    vi.mocked(cache.invalidate).mockImplementation(async path => {
      if (path === '/en/about') throw new Error('CLUSTERDOWN');
    });

    const response = await handleGraphWebhook(webhook(docEvent('updated')), cache);

    expect(response.status).toBe(200);
    expect(console.info).toHaveBeenCalledWith(
      '[cms-hosting] Refreshed /, /en in the origin cache',
    );
    expect(console.error).toHaveBeenCalledWith(
      '[cms-hosting] Refreshing /en/about failed, the old page stays cached:',
      'CLUSTERDOWN',
    );
    expect(mocks.purgeCdnPaths).toHaveBeenCalledWith(['/en/about', '/', '/en']);
  });
});

describe('handleGraphWebhook with remembered paths', () => {
  it('refreshes the last known URLs of content that expired', async () => {
    mocks.resolveDocPaths.mockResolvedValueOnce(['/en/about']).mockResolvedValueOnce([]);

    await handleGraphWebhook(webhook(docEvent('updated')), cache);
    events = [];
    await handleGraphWebhook(webhook(docEvent('updated')), cache);

    expect(invalidated()).toEqual([
      'invalidate /en/about',
      'invalidate /',
      'invalidate /en',
    ]);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('refreshes the old URL of content that moved', async () => {
    mocks.resolveDocPaths
      .mockResolvedValueOnce(['/en/old'])
      .mockResolvedValueOnce(['/en/new']);

    await handleGraphWebhook(webhook(docEvent('updated')), cache);
    events = [];
    await handleGraphWebhook(webhook(docEvent('updated')), cache);

    expect(invalidated()).toEqual([
      'invalidate /en/new',
      'invalidate /en/old',
      'invalidate /',
      'invalidate /en',
    ]);
    expect(mocks.remembered.get('abc_en')).toEqual(['/en/new']);
  });

  it.each([
    ['has no URL', () => mocks.resolveDocPaths.mockResolvedValue([])],
    [
      'cannot be resolved',
      () => mocks.resolveDocPaths.mockRejectedValue(new Error('down')),
    ],
  ])('refreshes only the site root when unknown content %s', async (_, arrange) => {
    arrange();

    const response = await handleGraphWebhook(webhook(docEvent('expired')), cache);

    expect(response.status).toBe(200);
    expect(events).toEqual(['invalidate /', 'purge /']);
    expect(console.warn).toHaveBeenCalledWith(
      '[cms-hosting] No URL known for abc_en_Published',
    );
  });
});

describe('handleGraphWebhook on a bulk deletion', () => {
  it('refreshes and forgets the last known URLs of deleted content', async () => {
    mocks.resolveDocPaths.mockResolvedValueOnce(['/en/about']);
    await handleGraphWebhook(webhook(docEvent('updated')), cache);
    events = [];

    await handleGraphWebhook(
      webhook(bulkEvent({ abc_en_Published: 'deleted', def_en_Published: 'indexed' })),
      cache,
    );

    expect(cache.clear).not.toHaveBeenCalled();
    expect(invalidated()).toEqual([
      'invalidate /en/about',
      'invalidate /',
      'invalidate /en',
    ]);
    expect(events.at(-1)).toBe('purge /en/about,/,/en');
    expect(mocks.remembered.has('abc_en')).toBe(false);
  });

  it('does not clear for other locales or versions of content with a known URL', async () => {
    mocks.resolveDocPaths.mockResolvedValueOnce(['/en/about']);
    await handleGraphWebhook(webhook(docEvent('updated')), cache);
    events = [];

    // What Graph sent in the manual test when a page was deleted from the trash
    await handleGraphWebhook(
      webhook(
        bulkEvent({
          abc_983_en_Previous: 'deleted',
          abc_de_Published: 'deleted',
          'abc_en-US_Published': 'deleted',
          abc_en_Published: 'deleted',
        }),
      ),
      cache,
    );

    expect(cache.clear).not.toHaveBeenCalled();
    expect(invalidated().sort()).toEqual([
      'invalidate /',
      'invalidate /en',
      'invalidate /en/about',
    ]);
  });

  it('ignores deleted drafts and previous versions', async () => {
    await handleGraphWebhook(
      webhook(bulkEvent({ abc_983_en_Previous: 'deleted', abc_en_Draft: 'deleted' })),
      cache,
    );

    expect(events).toEqual([]);
  });

  it('clears the origin cache when a deleted item has no known URL', async () => {
    await handleGraphWebhook(webhook(bulkEvent({ abc_en_Published: 'deleted' })), cache);

    expect(events).toEqual(['clear', 'invalidate /', 'purge /']);
    expect(console.info).toHaveBeenCalledWith(
      '[cms-hosting] Cleared the origin cache, no URL known for deleted abc_en_Published',
    );
  });
});

describe('alsoRefresh', () => {
  it('replaces the home pages through the options', async () => {
    mocks.resolveDocPaths.mockResolvedValue(['/en/about']);
    const alsoRefresh = vi.fn(() => ['/news']);

    await handleGraphWebhook(webhook(docEvent('updated')), cache, { alsoRefresh });

    expect(alsoRefresh).toHaveBeenCalledWith({
      docId: 'abc_en_Published',
      locale: 'en',
      paths: ['/en/about'],
    });
    expect(invalidated()).toEqual(['invalidate /en/about', 'invalidate /news']);
  });

  it('normalizes the paths it returns', async () => {
    mocks.resolveDocPaths.mockResolvedValue(['/en/about']);

    await handleGraphWebhook(webhook(docEvent('updated')), cache, {
      alsoRefresh: () => [
        '/news/',
        '/en/about/',
        'en/blog',
        'https://www.mysite.com/en/faq/',
      ],
    });

    expect(invalidated()).toEqual([
      'invalidate /en/about',
      'invalidate /news',
      'invalidate /en/blog',
      'invalidate /en/faq',
    ]);
  });

  it.each([
    ['en', ['/en/news/article'], ['/', '/en']],
    ['en', ['/EN/about'], ['/', '/EN']],
    ['zh_Hans', ['/zh-hans/about'], ['/', '/zh-hans']],
    ['en', ['/news/article'], ['/']],
    ['en', [], ['/']],
  ])('defaults, for locale %s and paths %j, to %j', (locale, paths, expected) => {
    expect(homePagePaths({ docId: 'abc', locale, paths })).toEqual(expected);
  });
});
