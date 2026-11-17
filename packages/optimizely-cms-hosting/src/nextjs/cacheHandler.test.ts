import { beforeEach, describe, expect, it, vi } from 'vitest';
import CacheHandler from './cacheHandler.js';

const store = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }));

vi.mock('../shared/redis.js', () => ({ createCacheStore: () => store }));

type SetContext = Parameters<CacheHandler['set']>[2];
type CacheValue = Parameters<CacheHandler['set']>[1];

const page = { kind: 'APP_PAGE', html: '<html></html>' } as unknown as CacheValue;

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('CacheHandler', () => {
  const handler = new CacheHandler();

  it('reads entries from the store', async () => {
    const entry = { value: page, lastModified: 1 };
    store.get.mockResolvedValue(entry);

    expect(await handler.get('/en')).toBe(entry);
    expect(store.get).toHaveBeenCalledWith('/en');
  });

  it('stores pages with lastModified and the expire time as TTL', async () => {
    vi.useFakeTimers({ now: 1000 });

    await handler.set('/en', page, {
      cacheControl: { revalidate: 60, expire: 3600 },
    } as SetContext);

    expect(store.set).toHaveBeenCalledWith(
      '/en',
      { value: page, lastModified: 1000 },
      3600,
    );
    vi.useRealTimers();
  });

  it.each([
    ['pages without an expire time', { cacheControl: { revalidate: false } }],
    ['fetch entries', { fetchCache: true }],
  ])('keeps %s for a year', async (_, ctx) => {
    await handler.set('/en', page, ctx as SetContext);

    expect(store.set).toHaveBeenCalledWith('/en', expect.anything(), 365 * 24 * 60 * 60);
  });

  it('keeps build-time-only fetch entries for an hour', async () => {
    await handler.set('hash', page, {
      fetchCache: true,
      isImplicitBuildTimeCache: true,
    } as SetContext);

    expect(store.set).toHaveBeenCalledWith('hash', expect.anything(), 3600);
  });

  it.each([
    ['_N_T_/en/about', '/en/about'],
    ['_N_T_/', '/index'],
  ])('deletes the page for path tag %s', async (tag, key) => {
    await handler.revalidateTag(tag);

    expect(store.delete).toHaveBeenCalledWith([key]);
  });

  it.each([
    ['_N_T_/en/news/page', ['/en/news/page', '/en/news']],
    ['_N_T_/page', ['/page', '/index']],
  ])('deletes both readings of the typed tag %s', async (tag, keys) => {
    await handler.revalidateTag(tag);

    expect(store.delete).toHaveBeenCalledWith(keys);
  });

  it('refreshes only the page of a layout tag, with a warning', async () => {
    await handler.revalidateTag('_N_T_/en/layout');

    expect(store.delete).toHaveBeenCalledWith(['/en/layout', '/en']);
    expect(console.warn).toHaveBeenCalledWith(
      '[cms-hosting] Refreshing only the page itself for _N_T_/en/layout',
    );
  });

  it('ignores the layout tag that comes with every revalidatePath', async () => {
    await handler.revalidateTag(['_N_T_/layout', '_N_T_/en']);

    expect(store.delete).toHaveBeenCalledWith(['/en']);
  });

  it('warns about and ignores custom tags', async () => {
    await handler.revalidateTag(['header', '_N_T_/en']);

    expect(store.delete).toHaveBeenCalledWith(['/en']);
    expect(console.warn).toHaveBeenCalledWith(
      '[cms-hosting] Ignoring unsupported tags: header',
    );
  });
});
