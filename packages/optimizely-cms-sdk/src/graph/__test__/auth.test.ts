import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GraphClient, config, getClient } from '../index.js';
import { OptimizelyGraphError } from '../error.js';
import { isBrowser } from '../environment.js';

/**
 * The `auth` resolver replaces the single key on a per-request basis, so that an
 * application can reach content CMS access rights hide from the single key.
 *
 * These assert on the `fetch` call rather than on a stubbed `client.request`: the
 * header assembly is the thing under test, and stubbing `request` would skip it.
 */

vi.mock('../environment.js', () => ({ isBrowser: vi.fn(() => false) }));

const QUERY = 'query Test { _Content { total } }';

let originalFetch: typeof global.fetch;

/** The headers of the last `fetch` call. */
const sentHeaders = (): Record<string, string> =>
  (global.fetch as any).mock.calls.at(-1)[1].headers;

/** The URL of the last `fetch` call. */
const sentUrl = (): URL => (global.fetch as any).mock.calls.at(-1)[0];

beforeEach(() => {
  vi.mocked(isBrowser).mockReturnValue(false);

  originalFetch = global.fetch;
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ data: {} }),
      text: () => Promise.resolve(''),
    } as any),
  );
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('the resolved headers', () => {
  test('falls back to the single key when no resolver is configured', async () => {
    await new GraphClient('test-key').request(QUERY, {});

    expect(sentHeaders().Authorization).toBe('epi-single test-key');
  });

  test('a resolver replaces the single key', async () => {
    const client = new GraphClient('test-key', {
      auth: () => ({ Authorization: 'epi-hmac key:1:nonce:sig' }),
    });

    await client.request(QUERY, {});

    expect(sentHeaders().Authorization).toBe('epi-hmac key:1:nonce:sig');
  });

  test('impersonation headers reach Graph alongside the credential', async () => {
    const client = new GraphClient('test-key', {
      auth: () => ({
        Authorization: 'epi-hmac key:1:nonce:sig',
        'cg-username': 'delivery',
        'cg-roles': 'WebDelivery,Members',
      }),
    });

    await client.request(QUERY, {});

    expect(sentHeaders()).toMatchObject({
      'cg-username': 'delivery',
      'cg-roles': 'WebDelivery,Members',
    });
  });

  test('an async resolver is awaited', async () => {
    const client = new GraphClient('test-key', {
      auth: async () => ({ Authorization: 'Bearer from-session' }),
    });

    await client.request(QUERY, {});

    expect(sentHeaders().Authorization).toBe('Bearer from-session');
  });

  test('the resolver runs again on every request, so a per-user value stays current', async () => {
    const auth = vi
      .fn()
      .mockReturnValueOnce({ Authorization: 'Bearer first' })
      .mockReturnValueOnce({ Authorization: 'Bearer second' });
    const client = new GraphClient('test-key', { auth });

    await client.request(QUERY, {});
    await client.request(QUERY, {});

    expect(auth).toHaveBeenCalledTimes(2);
    expect(sentHeaders().Authorization).toBe('Bearer second');
  });

  test('the resolver receives everything an HMAC signature covers', async () => {
    const auth = vi.fn(() => ({ Authorization: 'epi-hmac key:1:nonce:sig' }));
    const client = new GraphClient('test-key', { auth });

    await client.request(QUERY, { id: 42 });

    const [request] = auth.mock.calls[0] as any;
    expect(request.method).toBe('POST');
    expect(request.url).toBe(sentUrl().toString());
    // The signed bytes must be the bytes actually sent, or Graph rejects the signature.
    expect(request.body).toBe((global.fetch as any).mock.calls.at(-1)[1].body);
    expect(JSON.parse(request.body)).toEqual({ query: QUERY, variables: { id: 42 } });
  });

  test('the SDK-managed headers survive a resolver', async () => {
    const client = new GraphClient('test-key', {
      auth: () => ({ Authorization: 'epi-hmac key:1:nonce:sig' }),
    });

    await client.request(QUERY, {}, undefined, true, 'New', true);

    expect(sentHeaders()).toMatchObject({
      'Content-Type': 'application/json',
      'cg-stored-query': 'template',
      'cg-query-new': 'true',
    });
  });
});

describe('preview takes precedence', () => {
  test('a preview token wins over the resolver and the single key', async () => {
    const auth = vi.fn(() => ({ Authorization: 'epi-hmac key:1:nonce:sig' }));
    const client = new GraphClient('test-key', { auth });

    await client.request(QUERY, {}, 'preview-token');

    expect(sentHeaders().Authorization).toBe('Bearer preview-token');
  });

  test('a preview request never pays for the resolver', async () => {
    const auth = vi.fn(() => ({ Authorization: 'epi-hmac key:1:nonce:sig' }));
    const client = new GraphClient('test-key', { auth });

    await client.request(QUERY, {}, 'preview-token');

    expect(auth).not.toHaveBeenCalled();
  });
});

describe('caching defaults', () => {
  test('stays on when only the single key is used', () => {
    const { cache, stored } = new GraphClient('test-key').queryDefaults;

    expect({ cache, stored }).toEqual({ cache: true, stored: true });
  });

  test('turns off once responses can vary per user', () => {
    const client = new GraphClient('test-key', { auth: () => ({}) });

    expect(client.queryDefaults.cache).toBe(false);
  });

  // Graph keys a stored query's cached result by the query text rather than by the
  // credential, so leaving this on hands authenticated results to the single key.
  test('stored queries are off too, since Graph shares their cache across credentials', () => {
    const client = new GraphClient('test-key', { auth: () => ({}) });

    expect(client.queryDefaults.stored).toBe(false);
  });

  test('no stored-query header or parameter is sent when a resolver is set', async () => {
    const client = new GraphClient('test-key', { auth: () => ({}) });

    await client.request(QUERY, {}, undefined, false, undefined, false);

    expect(sentUrl().searchParams.has('stored')).toBe(false);
    expect(sentHeaders()['cg-stored-query']).toBeUndefined();
  });

  test('an explicit cache setting still wins', () => {
    const client = new GraphClient('test-key', {
      auth: () => ({}),
      query: { cache: true },
    });

    expect(client.queryDefaults.cache).toBe(true);
  });

  test('a per-request cache value reaches the URL', async () => {
    const client = new GraphClient('test-key', { auth: () => ({}) });

    await client.request(QUERY, {}, undefined, false);

    expect(sentUrl().searchParams.get('cache')).toBe('false');
  });
});

describe('server-only guard', () => {
  test('refuses to resolve credentials in a browser', async () => {
    vi.mocked(isBrowser).mockReturnValue(true);
    const client = new GraphClient('test-key', {
      auth: () => ({ Authorization: 'epi-hmac key:1:nonce:sig' }),
    });

    await expect(client.request(QUERY, {})).rejects.toThrow(OptimizelyGraphError);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('leaves the single key alone in a browser', async () => {
    vi.mocked(isBrowser).mockReturnValue(true);

    await new GraphClient('test-key').request(QUERY, {});

    expect(sentHeaders().Authorization).toBe('epi-single test-key');
  });
});

describe('a misbehaving resolver', () => {
  test('a rejection surfaces as an OptimizelyGraphError keeping the cause', async () => {
    const cause = new Error('session expired');
    const client = new GraphClient('test-key', {
      auth: () => Promise.reject(cause),
    });

    await expect(client.request(QUERY, {})).rejects.toMatchObject({
      name: 'OptimizelyGraphError',
      cause,
    });
  });

  test('a synchronous throw is caught too', async () => {
    const client = new GraphClient('test-key', {
      auth: () => {
        throw new Error('no session');
      },
    });

    await expect(client.request(QUERY, {})).rejects.toThrow(OptimizelyGraphError);
  });

  test('a non-object return is rejected rather than spread into the headers', async () => {
    const client = new GraphClient('test-key', {
      auth: (() => 'epi-hmac key:1:nonce:sig') as any,
    });

    await expect(client.request(QUERY, {})).rejects.toThrow(/must return an object/);
  });
});

describe('configuration', () => {
  test('getClient() carries the resolver from the global config', async () => {
    config({
      apiKey: 'global-key',
      auth: () => ({ Authorization: 'epi-hmac global:1:nonce:sig' }),
    });

    await getClient().request(QUERY, {});

    expect(sentHeaders().Authorization).toBe('epi-hmac global:1:nonce:sig');
  });

  test('a per-request override supplies the signed-in user without touching globals', async () => {
    config({ apiKey: 'global-key' });

    await getClient({ auth: () => ({ Authorization: 'Bearer user-jwt' }) }).request(
      QUERY,
      {},
    );

    expect(sentHeaders().Authorization).toBe('Bearer user-jwt');
    // The global client is unaffected by the override.
    await getClient().request(QUERY, {});
    expect(sentHeaders().Authorization).toBe('epi-single global-key');
  });
});
