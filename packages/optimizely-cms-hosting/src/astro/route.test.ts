import type { APIContext } from 'astro';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OriginCache } from '../shared/handleWebhook.js';

const mocks = vi.hoisted(() => ({ handleGraphWebhook: vi.fn(), clear: vi.fn() }));

vi.mock('../shared/handleWebhook.js', () => ({
  handleGraphWebhook: mocks.handleGraphWebhook,
}));
vi.mock('../shared/redis.js', () => ({
  createCacheStore: () => ({ clear: mocks.clear }),
}));

const { POST } = await import('./route.js');

const request = new Request('https://site.test/hooks/graph', { method: 'POST' });
const invalidate = vi.fn();
const context = { request, cache: { invalidate } } as unknown as APIContext;

beforeEach(() => vi.clearAllMocks());

describe('POST', () => {
  it('passes the request to the webhook handler', async () => {
    const response = Response.json({ received: true });
    mocks.handleGraphWebhook.mockResolvedValue(response);

    expect(await POST(context)).toBe(response);
    expect(mocks.handleGraphWebhook).toHaveBeenCalledWith(request, expect.anything());
  });

  it('invalidates paths through the configured cache provider', async () => {
    await POST(context);
    const cache: OriginCache = mocks.handleGraphWebhook.mock.calls[0][1];

    await cache.invalidate('/en/about');
    await cache.clear();

    expect(invalidate).toHaveBeenCalledWith({ path: '/en/about' });
    expect(mocks.clear).toHaveBeenCalled();
  });
});
