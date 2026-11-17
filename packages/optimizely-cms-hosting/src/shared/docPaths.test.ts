import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORE_STATE = Symbol.for('@optimizely/cms-hosting/redis');
const DAY_MS = 24 * 60 * 60 * 1000;

const loadDocPaths = () => import('./docPaths.js');

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

describe('docPaths', () => {
  it('recalls paths for the same content and locale, whatever the status', async () => {
    const { rememberDocPaths, recallDocPaths } = await loadDocPaths();

    await rememberDocPaths('3f2b-1c4d_en_Published', ['/en/about']);

    expect(await recallDocPaths('3f2b1c4d_en_Expired')).toEqual(['/en/about']);
    expect(await recallDocPaths('3f2b1c4d_983_en_Published')).toEqual(['/en/about']);
    expect(await recallDocPaths('3f2b1c4d_sv_Published')).toEqual([]);
  });

  it('keeps paths across deployments', async () => {
    vi.stubEnv('OPTIMIZELY_DXP_DEPLOYMENT_ID', 'slot1');
    await (await loadDocPaths()).rememberDocPaths('abc_en_Published', ['/en/about']);
    vi.resetModules();
    vi.stubEnv('OPTIMIZELY_DXP_DEPLOYMENT_ID', 'slot2');

    expect(await (await loadDocPaths()).recallDocPaths('abc_en_Published')).toEqual([
      '/en/about',
    ]);
  });

  it('forgets deleted content', async () => {
    const { rememberDocPaths, recallDocPaths, forgetDocPaths } = await loadDocPaths();

    await rememberDocPaths('abc_en_Published', ['/en/about']);
    await forgetDocPaths(['abc_en_Published']);

    expect(await recallDocPaths('abc_en_Published')).toEqual([]);
  });

  it('keeps paths for longer than the CDN keeps a page', async () => {
    vi.useFakeTimers({ now: 0, toFake: ['Date'] });
    const { rememberDocPaths, recallDocPaths } = await loadDocPaths();

    await rememberDocPaths('abc_en_Published', ['/en/about']);
    vi.setSystemTime(366 * DAY_MS);
    expect(await recallDocPaths('abc_en_Published')).toEqual(['/en/about']);

    vi.setSystemTime(401 * DAY_MS);
    expect(await recallDocPaths('abc_en_Published')).toEqual([]);
  });
});
