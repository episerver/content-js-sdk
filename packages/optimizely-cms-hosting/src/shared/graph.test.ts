import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveDocPaths } from './graph.js';

const graph = vi.hoisted(() => ({ constructor: vi.fn(), request: vi.fn() }));

vi.mock('@optimizely/cms-sdk', () => ({
  GraphClient: vi.fn(function (...args: unknown[]) {
    graph.constructor(...args);
    return { request: graph.request };
  }),
}));

const respondWithUrls = (url: string | null, hierarchical: string | null = url) =>
  graph.request.mockResolvedValue({
    _Content: { item: { _metadata: { url: { default: url, hierarchical } } } },
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('OPTIMIZELY_GRAPH_SINGLE_KEY', 'single-key');
  vi.stubEnv('OPTIMIZELY_GRAPH_GATEWAY', 'https://cg.optimizely.com/content/v2');
});

afterEach(() => vi.unstubAllEnvs());

describe('resolveDocPaths', () => {
  it('queries Graph uncached with the id and locale from the docId', async () => {
    respondWithUrls('/en/about/');

    expect(
      await resolveDocPaths('3f2b1c4d-aaaa-bbbb-cccc-1234567890ab_en_Published'),
    ).toEqual(['/en/about']);
    expect(graph.constructor).toHaveBeenCalledWith('single-key', {
      graphUrl: 'https://cg.optimizely.com',
    });
    expect(graph.request).toHaveBeenCalledWith(
      expect.stringContaining('url { default hierarchical }'),
      { id: '3f2b1c4daaaabbbbcccc1234567890ab', locale: 'en' },
      undefined,
      false,
    );
  });

  it('returns both the simple address and the hierarchical URL', async () => {
    respondWithUrls('/about', '/en/about/');

    expect(await resolveDocPaths('abc_en_Published')).toEqual(['/about', '/en/about']);
  });

  it.each([
    ['zh_Hans', 'zh_Hans'],
    ['zh-Hans', 'zh_Hans'],
  ])('keeps locale %s as the Graph locale %s', async (docLocale, locale) => {
    respondWithUrls('/zh/');

    await resolveDocPaths(`abc_${docLocale}_Published`);

    expect(graph.request.mock.calls[0][1]).toEqual({ id: 'abc', locale });
  });

  it.each([
    ['https://www.mysite.com/en/about/', '/en/about'],
    ['/', '/'],
    ['https://www.mysite.com/', '/'],
  ])('turns %s into the path %s', async (url, path) => {
    respondWithUrls(url);

    expect(await resolveDocPaths('abc_en_Published')).toEqual([path]);
  });

  it('returns no paths when Graph has no URL', async () => {
    respondWithUrls(null);

    expect(await resolveDocPaths('abc_en_Published')).toEqual([]);
  });

  it('throws without a single key', async () => {
    vi.stubEnv('OPTIMIZELY_GRAPH_SINGLE_KEY', undefined);

    await expect(resolveDocPaths('abc_en_Published')).rejects.toThrow(
      'OPTIMIZELY_GRAPH_SINGLE_KEY is not set',
    );
  });
});
