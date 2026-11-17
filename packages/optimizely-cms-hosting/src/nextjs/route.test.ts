import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OriginCache } from '../shared/handleWebhook.js';

const mocks = vi.hoisted(() => ({
  handleGraphWebhook: vi.fn(),
  revalidatePath: vi.fn(),
  invalidatePage: vi.fn(),
  clearPages: vi.fn(),
}));

vi.mock('next/cache.js', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('../shared/handleWebhook.js', () => ({
  handleGraphWebhook: mocks.handleGraphWebhook,
}));
vi.mock('./cacheHandler.js', () => ({
  invalidatePage: mocks.invalidatePage,
  clearPages: mocks.clearPages,
}));

const { POST, createWebhookRoute } = await import('./route.js');

const originCache = async () => {
  await POST(new Request('https://site.test/hooks/graph', { method: 'POST' }));
  return mocks.handleGraphWebhook.mock.calls[0][1] as OriginCache;
};

beforeEach(() => vi.clearAllMocks());

describe('POST', () => {
  it('passes the request to the webhook handler', async () => {
    const response = Response.json({ received: true });
    mocks.handleGraphWebhook.mockResolvedValue(response);
    const request = new Request('https://site.test/hooks/graph', { method: 'POST' });

    expect(await POST(request)).toBe(response);
    expect(mocks.handleGraphWebhook).toHaveBeenCalledWith(request, expect.anything(), {});
  });

  it('passes the options of createWebhookRoute to the webhook handler', async () => {
    const options = { alsoRefresh: () => ['/news'] };
    const request = new Request('https://site.test/hooks/graph', { method: 'POST' });

    await createWebhookRoute(options)(request);

    expect(mocks.handleGraphWebhook).toHaveBeenCalledWith(
      request,
      expect.anything(),
      options,
    );
  });

  it('revalidates the path and deletes the page before resolving', async () => {
    let deleted = false;
    mocks.invalidatePage.mockImplementation(async () => {
      await Promise.resolve();
      deleted = true;
    });
    const cache = await originCache();

    await cache.invalidate('/en/about');

    expect(mocks.revalidatePath).toHaveBeenCalledWith('/en/about');
    expect(mocks.invalidatePage).toHaveBeenCalledWith('/en/about');
    expect(deleted).toBe(true);
  });

  it('clears the Next.js pages', async () => {
    const cache = await originCache();

    await cache.clear();

    expect(mocks.clearPages).toHaveBeenCalled();
  });
});
