import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveDocPath } from './graph.js';

const graph = vi.hoisted(() => ({ constructor: vi.fn(), request: vi.fn() }));

vi.mock('@optimizely/cms-sdk', () => ({
  GraphClient: vi.fn(function (...args: unknown[]) {
    graph.constructor(...args);
    return { request: graph.request };
  }),
}));

const respondWithUrl = (url: string | null) =>
  graph.request.mockResolvedValue({
    _Content: { item: { _metadata: { url: { default: url } } } },
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('OPTIMIZELY_GRAPH_SINGLE_KEY', 'single-key');
  vi.stubEnv('OPTIMIZELY_GRAPH_GATEWAY', 'https://cg.optimizely.com/content/v2');
});

afterEach(() => vi.unstubAllEnvs());

describe('resolveDocPath', () => {
  it('queries Graph uncached with the id and locale from the docId', async () => {
    respondWithUrl('/en/about/');

    expect(
      await resolveDocPath('3f2b1c4d-aaaa-bbbb-cccc-1234567890ab_en_Published'),
    ).toBe('/en/about');
    expect(graph.constructor).toHaveBeenCalledWith('single-key', {
      graphUrl: 'https://cg.optimizely.com',
    });
    expect(graph.request).toHaveBeenCalledWith(
      expect.stringContaining('_Content(ids: [$id], locale: [$locale])'),
      { id: '3f2b1c4daaaabbbbcccc1234567890ab', locale: 'en' },
      undefined,
      false,
    );
  });

  it.each([
    ['zh_Hans', 'zh_Hans'],
    ['zh-Hans', 'zh_Hans'],
  ])('keeps locale %s as the Graph locale %s', async (docLocale, locale) => {
    respondWithUrl('/zh/');

    await resolveDocPath(`abc_${docLocale}_Published`);

    expect(graph.request.mock.calls[0][1]).toEqual({ id: 'abc', locale });
  });

  it.each([
    ['https://www.mysite.com/en/about/', '/en/about'],
    ['/', '/'],
    ['https://www.mysite.com/', '/'],
  ])('turns %s into the path %s', async (url, path) => {
    respondWithUrl(url);

    expect(await resolveDocPath('abc_en_Published')).toBe(path);
  });

  it('returns undefined when Graph has no URL', async () => {
    respondWithUrl(null);

    expect(await resolveDocPath('abc_en_Published')).toBeUndefined();
  });

  it('throws without a single key', async () => {
    vi.stubEnv('OPTIMIZELY_GRAPH_SINGLE_KEY', undefined);

    await expect(resolveDocPath('abc_en_Published')).rejects.toThrow(
      'OPTIMIZELY_GRAPH_SINGLE_KEY is not set',
    );
  });
});
