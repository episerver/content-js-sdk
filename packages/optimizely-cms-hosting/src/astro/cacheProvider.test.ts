import type { CacheProvider } from 'astro';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type RequestContext = Parameters<NonNullable<CacheProvider['onRequest']>>[0];

const CACHE_FOR_A_MINUTE = 'max-age=60, stale-while-revalidate=120';
const STORE_STATE = Symbol.for('@optimizely/cms-hosting/redis');

const loadProvider = async () => {
  const { default: factory } = await import('./cacheProvider.js');
  const provider = factory(undefined);
  return { provider, onRequest: provider.onRequest! };
};

const page = (body: string, headers: HeadersInit = {}, status = 200) =>
  new Response(body, {
    status,
    headers: {
      'content-type': 'text/html',
      'CDN-Cache-Control': CACHE_FOR_A_MINUTE,
      ...headers,
    },
  });

const requestTo = (url: string, method = 'GET') =>
  ({
    request: new Request(url, { method }),
    url: new URL(url),
    waitUntil: vi.fn(),
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  }) as RequestContext;

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
  vi.resetModules();
  // The store keeps its state on globalThis, which resetModules does not reset
  delete (globalThis as Record<symbol, unknown>)[STORE_STATE];
  vi.stubEnv('REDIS_URL', undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('setHeaders', () => {
  it('writes the provider signal and a CDN-only Cache-Control', async () => {
    const { provider } = await loadProvider();
    const headers = provider.setHeaders!(
      { maxAge: 600, swr: 1800, tags: ['a', 'b'], etag: '"1"' },
      new Request('https://site.test/'),
    );

    expect(headers.get('CDN-Cache-Control')).toBe(
      'max-age=600, stale-while-revalidate=1800',
    );
    expect(headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=600, stale-while-revalidate=1800',
    );
    expect(headers.get('Cache-Tag')).toBe('a, b');
    expect(headers.get('ETag')).toBe('"1"');
  });

  it('writes no cache headers without maxAge', async () => {
    const { provider } = await loadProvider();
    const headers = provider.setHeaders!({}, new Request('https://site.test/'));

    expect(headers.has('CDN-Cache-Control')).toBe(false);
    expect(headers.has('Cache-Control')).toBe(false);
  });
});

describe('onRequest', () => {
  it('stores a miss when the adapter has no waitUntil, as @astrojs/node', async () => {
    const { onRequest } = await loadProvider();
    const next = vi.fn(async () => page('v1'));
    const withoutWaitUntil = () => ({
      ...requestTo('https://site.test/en'),
      waitUntil: undefined,
    });

    await onRequest(withoutWaitUntil(), next);
    const hit = await onRequest(withoutWaitUntil(), next);

    expect(hit.headers.get('X-Astro-Cache')).toBe('HIT');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('stores a miss and serves the next request from the cache', async () => {
    vi.useFakeTimers({ now: 0, toFake: ['Date'] });
    const { onRequest } = await loadProvider();
    const next = vi.fn(async () => page('v1'));

    const miss = await onRequest(requestTo('https://site.test/en/about'), next);
    vi.setSystemTime(30_000);
    const hit = await onRequest(requestTo('https://site.test/en/about/'), next);

    expect(miss.headers.get('X-Astro-Cache')).toBe('MISS');
    expect(hit.headers.get('X-Astro-Cache')).toBe('HIT');
    expect(hit.headers.get('Age')).toBe('30');
    expect(await hit.text()).toBe('v1');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('serves a stale page and refreshes it once in the background', async () => {
    vi.useFakeTimers({ now: 0, toFake: ['Date'] });
    const { onRequest } = await loadProvider();
    await onRequest(requestTo('https://site.test/en'), async () => page('v1'));
    vi.setSystemTime(90_000);

    const next = vi.fn(async () => page('v2'));
    const first = requestTo('https://site.test/en');
    const stale = await onRequest(first, next);
    await onRequest(requestTo('https://site.test/en'), next);
    await flush();
    const fresh = await onRequest(requestTo('https://site.test/en'), next);

    expect(stale.headers.get('X-Astro-Cache')).toBe('STALE');
    expect(await stale.text()).toBe('v1');
    expect(first.waitUntil).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(await fresh.text()).toBe('v2');
  });

  it('drops the stale page when the refresh is not cacheable', async () => {
    vi.useFakeTimers({ now: 0, toFake: ['Date'] });
    const { onRequest } = await loadProvider();
    await onRequest(requestTo('https://site.test/en'), async () => page('v1'));
    vi.setSystemTime(90_000);

    await onRequest(requestTo('https://site.test/en'), async () => page('gone', {}, 404));
    await flush();
    const response = await onRequest(requestTo('https://site.test/en'), async () =>
      page('v2'),
    );

    expect(response.headers.get('X-Astro-Cache')).toBe('MISS');
    expect(await response.text()).toBe('v2');
  });

  it('renders again once the stale window has passed', async () => {
    vi.useFakeTimers({ now: 0, toFake: ['Date'] });
    const { onRequest } = await loadProvider();
    await onRequest(requestTo('https://site.test/en'), async () => page('v1'));
    vi.setSystemTime(181_000);

    const response = await onRequest(requestTo('https://site.test/en'), async () =>
      page('v2'),
    );

    expect(response.headers.get('X-Astro-Cache')).toBe('MISS');
    expect(await response.text()).toBe('v2');
  });

  it('caches pages whose query only has tracking parameters', async () => {
    const { onRequest } = await loadProvider();
    const next = vi.fn(async () => page('v1'));

    await onRequest(requestTo('https://site.test/en?utm_source=mail'), next);
    await onRequest(requestTo('https://site.test/en?gclid=1&UTM_Medium=x'), next);
    await onRequest(requestTo('https://site.test/en?oly_anon_id=1'), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each<[string, () => RequestContext, () => Response]>([
    ['POST requests', () => requestTo('https://site.test/en', 'POST'), () => page('v1')],
    [
      'requests with a query',
      () => requestTo('https://site.test/search?q=a'),
      () => page('v1'),
    ],
    [
      'routes without a cache rule',
      () => requestTo('https://site.test/en'),
      () => page('v1', { 'CDN-Cache-Control': '' }),
    ],
    [
      'non-200 responses',
      () => requestTo('https://site.test/en'),
      () => page('v1', {}, 404),
    ],
    [
      'responses that set cookies',
      () => requestTo('https://site.test/en'),
      () => page('v1', { 'set-cookie': 'a=1' }),
    ],
    [
      'responses that vary by cookie',
      () => requestTo('https://site.test/en'),
      () => page('v1', { vary: 'Cookie' }),
    ],
  ])('does not cache %s', async (_, request, response) => {
    const { onRequest } = await loadProvider();
    const next = vi.fn(async () => response());

    await onRequest(request(), next);
    await onRequest(request(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('does not cache responses with cookies from Astro.cookies', async () => {
    const { onRequest } = await loadProvider();
    const withCookies = () => {
      const response = page('v1');
      Reflect.set(response, Symbol.for('astro.cookies'), {
        headers: () => ['a=1'][Symbol.iterator](),
      });
      return response;
    };
    const next = vi.fn(async () => withCookies());

    await onRequest(requestTo('https://site.test/en'), next);
    await onRequest(requestTo('https://site.test/en'), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('caches responses that only vary by Accept-Encoding', async () => {
    const { onRequest } = await loadProvider();
    const next = vi.fn(async () => page('v1', { vary: 'Accept-Encoding' }));

    await onRequest(requestTo('https://site.test/en'), next);
    await onRequest(requestTo('https://site.test/en'), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('invalidate', () => {
  it('deletes the entry for a path, with or without a trailing slash', async () => {
    const { provider, onRequest } = await loadProvider();
    const next = vi.fn(async () => page('v1'));
    await onRequest(requestTo('https://site.test/en/about'), next);

    await provider.invalidate({ path: '/en/about/' });
    await onRequest(requestTo('https://site.test/en/about'), next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('warns about tags', async () => {
    const { provider } = await loadProvider();

    await provider.invalidate({ tags: ['header'] });

    expect(console.warn).toHaveBeenCalledWith(
      '[cms-hosting] Ignoring unsupported tags: header',
    );
  });
});
