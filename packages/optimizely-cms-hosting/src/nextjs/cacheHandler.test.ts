import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CacheHandler, { invalidatePage } from './cacheHandler.js';

const store = vi.hoisted(() => {
  const entries = new Map<string, unknown>();
  return {
    entries,
    get: vi.fn(async (key: string) => entries.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown, _ttl?: number) => {
      entries.set(key, value);
    }),
    setOrThrow: vi.fn(async (key: string, value: unknown, _ttl?: number) => {
      entries.set(key, value);
    }),
  };
});

vi.mock('../shared/redis.js', () => ({ createCacheStore: () => store }));

type Handler = InstanceType<typeof CacheHandler>;
type GetContext = Parameters<Handler['get']>[1];
type SetContext = Parameters<Handler['set']>[2];
type CacheValue = Parameters<Handler['set']>[1];

// The key Next.js 16.3.8+ uses for a page; earlier versions use the path itself
const PAGE_KEY = '/route-cache/APP_PAGE/0a1b2c/$/en/about';
const PAGE_TAGS =
  '_N_T_/layout,_N_T_/[...slug]/layout,_N_T_/[...slug]/page,_N_T_/en/about';

const pageContext = { kind: 'APP_PAGE' } as GetContext;
const pageSetContext = { cacheControl: { revalidate: false } } as SetContext;
const page = (tags = PAGE_TAGS) =>
  ({
    kind: 'APP_PAGE',
    html: '<html></html>',
    headers: { 'x-next-cache-tags': tags },
  }) as unknown as CacheValue;
const fetchContext = (tags: string[]) =>
  ({ kind: 'FETCH', tags, softTags: [] }) as GetContext;
const fetchValue = { kind: 'FETCH', data: {} } as unknown as CacheValue;

const handler = new CacheHandler();

const storeAt = async (
  time: number,
  key: string,
  value: CacheValue,
  ctx = pageSetContext,
) => {
  vi.setSystemTime(time);
  await handler.set(key, value, ctx);
};

beforeEach(() => {
  store.entries.clear();
  vi.clearAllMocks();
  vi.useFakeTimers({ now: 1000, toFake: ['Date'] });
});

afterEach(() => vi.useRealTimers());

describe('CacheHandler', () => {
  it('serves an entry that no tag has invalidated', async () => {
    await storeAt(1000, PAGE_KEY, page());

    expect(await handler.get(PAGE_KEY, pageContext)).toEqual({
      value: page(),
      lastModified: 1000,
    });
  });

  it('stores pages with the expire time as TTL', async () => {
    await handler.set(PAGE_KEY, page(), {
      cacheControl: { revalidate: 60, expire: 3600 },
    } as SetContext);

    expect(store.set).toHaveBeenCalledWith(PAGE_KEY, expect.anything(), 3600);
  });

  it.each([
    ['pages without an expire time', { cacheControl: { revalidate: false } }],
    ['fetch entries', { fetchCache: true }],
  ])('keeps %s for a year', async (_, ctx) => {
    await handler.set('key', page(), ctx as SetContext);

    expect(store.set).toHaveBeenCalledWith('key', expect.anything(), 365 * 24 * 60 * 60);
  });

  it('keeps build-time-only fetch entries for an hour', async () => {
    await handler.set('hash', fetchValue, {
      fetchCache: true,
      isImplicitBuildTimeCache: true,
    } as SetContext);

    expect(store.set).toHaveBeenCalledWith('hash', expect.anything(), 3600);
  });

  it('misses a page whose path was invalidated after it was stored, whatever its key', async () => {
    await storeAt(1000, PAGE_KEY, page());
    vi.setSystemTime(2000);

    await invalidatePage('/en/about');

    expect(await handler.get(PAGE_KEY, pageContext)).toBeNull();
    expect(store.setOrThrow).toHaveBeenCalledWith(
      'tags/_N_T_/en/about',
      2000,
      365 * 24 * 60 * 60,
    );
  });

  it('serves the page again once it is stored after the invalidation', async () => {
    await storeAt(1000, PAGE_KEY, page());
    vi.setSystemTime(2000);
    await invalidatePage('/en/about');

    await storeAt(3000, PAGE_KEY, page());

    expect(await handler.get(PAGE_KEY, pageContext)).not.toBeNull();
  });

  it('keeps serving pages with other paths', async () => {
    await storeAt(1000, '/en/news', page('_N_T_/layout,_N_T_/en/news'));
    vi.setSystemTime(2000);

    await invalidatePage('/en/about');

    expect(await handler.get('/en/news', pageContext)).not.toBeNull();
  });

  it('misses every page below a revalidated layout', async () => {
    await storeAt(1000, PAGE_KEY, page());
    await storeAt(1000, '/en/news', page('_N_T_/layout,_N_T_/en/news'));
    vi.setSystemTime(2000);

    await handler.revalidateTag('_N_T_/layout');

    expect(await handler.get(PAGE_KEY, pageContext)).toBeNull();
    expect(await handler.get('/en/news', pageContext)).toBeNull();
  });

  it('misses a fetch entry whose custom tag was revalidated', async () => {
    await storeAt(1000, 'hash', fetchValue, { fetchCache: true } as SetContext);
    vi.setSystemTime(2000);

    await handler.revalidateTag(['products', 'other']);

    expect(await handler.get('hash', fetchContext(['products']))).toBeNull();
  });

  it('fails the invalidation when the stamp cannot be written', async () => {
    store.setOrThrow.mockRejectedValueOnce(new Error('CLUSTERDOWN'));

    await expect(invalidatePage('/en/about')).rejects.toThrow('CLUSTERDOWN');
  });
});
