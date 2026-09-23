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

const FIXED_NONCE = '11111111-2222-3333-4444-555555555555';
const FIXED_TIMESTAMP = 1700000000000;

/** A URL with a path, so the signed `pathAndQuery` is not just `/`. */
const GRAPH_URL = 'https://graph.example.com/content/v2';

let originalFetch: typeof global.fetch;

/** The headers of the last `fetch` call. */
const sentHeaders = (): Record<string, string> =>
  (global.fetch as any).mock.calls.at(-1)[1].headers;

/** The URL of the last `fetch` call. */
const sentUrl = (): URL => (global.fetch as any).mock.calls.at(-1)[0];

beforeEach(() => {
  vi.mocked(isBrowser).mockReturnValue(false);

  // Only the nonce is pinned; the digests stay real so the signature vectors below mean
  // something. `Date.now` is pinned per test rather than here.
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(FIXED_NONCE);

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
  // The guard covers the app secret, not authentication in general: a browser may hold a
  // token of its own, and a resolver's headers are the caller's to account for.
  test.each([
    ['basic', { type: 'basic', appKey: 'app-key', secret: 'c2VjcmV0' }],
    ['hmac', { type: 'hmac', appKey: 'app-key', secret: 'c2VjcmV0' }],
  ] as const)('refuses %s in a browser', async (_name, auth) => {
    vi.mocked(isBrowser).mockReturnValue(true);

    await expect(
      new GraphClient('test-key', { auth }).request(QUERY, {}),
    ).rejects.toThrow(OptimizelyGraphError);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('allows a bearer token in a browser', async () => {
    vi.mocked(isBrowser).mockReturnValue(true);

    await new GraphClient('test-key', {
      auth: { type: 'bearer', token: 'user-jwt' },
    }).request(QUERY, {});

    expect(sentHeaders().Authorization).toBe('Bearer user-jwt');
  });

  test('allows a resolver in a browser', async () => {
    vi.mocked(isBrowser).mockReturnValue(true);

    await new GraphClient('test-key', {
      auth: () => ({ Authorization: 'Bearer resolved-jwt' }),
    }).request(QUERY, {});

    expect(sentHeaders().Authorization).toBe('Bearer resolved-jwt');
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

// TYPED MODES

describe('the basic mode', () => {
  test('sends the app key and secret base64-encoded', async () => {
    const client = new GraphClient('test-key', {
      auth: { type: 'basic', appKey: 'app-key', secret: 'c2VjcmV0' },
    });

    await client.request(QUERY, {});

    expect(sentHeaders().Authorization).toBe('Basic YXBwLWtleTpjMlZqY21WMA==');
  });

  test('carries impersonation headers', async () => {
    const client = new GraphClient('test-key', {
      auth: {
        type: 'basic',
        appKey: 'app-key',
        secret: 'c2VjcmV0',
        impersonate: { username: 'delivery', roles: ['WebDelivery', 'Members'] },
      },
    });

    await client.request(QUERY, {});

    expect(sentHeaders()).toMatchObject({
      'cg-username': 'delivery',
      'cg-roles': 'WebDelivery,Members',
    });
  });
});

describe('the hmac mode', () => {
  const hmacClient = (impersonate?: { username?: string; roles?: string[] }) =>
    new GraphClient('test-key', {
      graphUrl: GRAPH_URL,
      auth: { type: 'hmac', appKey: 'app-key', secret: 'c2VjcmV0', impersonate },
    });

  // Pinned against a signature computed outside the SDK, so a change to the message
  // component order fails here rather than only against a live tenant.
  test('matches a known-answer signature', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_TIMESTAMP);

    await hmacClient().request(QUERY, {}, undefined, false);

    expect(sentHeaders().Authorization).toBe(
      `epi-hmac app-key:${FIXED_TIMESTAMP}:${FIXED_NONCE}:` +
        'mvsrSrf8X8PvJwXReuXGiBJf+Wh+8669A4Sd2kW70DA=',
    );
  });

  test('signs the exact body that is sent', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_TIMESTAMP);

    await hmacClient().request(QUERY, {}, undefined, false);

    const [, init] = (global.fetch as any).mock.calls.at(-1);
    expect(init.body).toBe(JSON.stringify({ query: QUERY, variables: {} }));
  });

  // A replayed timestamp or nonce would let a captured request be resent.
  test('uses a fresh timestamp on every request', async () => {
    const client = hmacClient();

    vi.spyOn(Date, 'now').mockReturnValue(FIXED_TIMESTAMP);
    await client.request(QUERY, {}, undefined, false);
    const first = sentHeaders().Authorization;

    vi.spyOn(Date, 'now').mockReturnValue(FIXED_TIMESTAMP + 1000);
    await client.request(QUERY, {}, undefined, false);

    expect(sentHeaders().Authorization).not.toBe(first);
  });

  test('carries impersonation headers alongside the signature', async () => {
    await hmacClient({ roles: ['WebDelivery'] }).request(QUERY, {}, undefined, false);

    expect(sentHeaders()['cg-roles']).toBe('WebDelivery');
    expect(sentHeaders().Authorization).toMatch(/^epi-hmac app-key:/);
  });

  test('omits impersonation headers when none are configured', async () => {
    await hmacClient().request(QUERY, {}, undefined, false);

    expect(sentHeaders()['cg-roles']).toBeUndefined();
    expect(sentHeaders()['cg-username']).toBeUndefined();
  });
});

/**
 * Graph decodes these headers but documents plain ASCII as working unencoded, and a tenant
 * measured on 2026-09-22 did not decode at all. Encoding an ASCII username anyway turns
 * `a@b.com` into `a%40b.com`, which matched nothing there — so ASCII has to go out raw.
 */
describe('impersonation encoding', () => {
  const sendAs = async (impersonate: {
    username?: string;
    roles?: string[];
  }): Promise<Record<string, string>> => {
    await new GraphClient('test-key', {
      auth: { type: 'basic', appKey: 'app-key', secret: 'c2VjcmV0', impersonate },
    }).request(QUERY, {}, undefined, false);

    return sentHeaders();
  };

  test.each([
    ['an email-shaped username', 'marin.karamihalev@optimizely.com'],
    ['a plain username', 'Tom'],
    ['punctuation and spaces', "Tom O'Brien (admin)"],
  ])('leaves %s untouched', async (_name, username) => {
    expect((await sendAs({ username }))['cg-username']).toBe(username);
  });

  // The example from Graph's own HMAC documentation.
  test('percent-encodes a non-ASCII username whole', async () => {
    const headers = await sendAs({ username: 'förnamn@optimizely.com' });

    expect(headers['cg-username']).toBe('f%C3%B6rnamn%40optimizely.com');
  });

  test('encodes only the roles that need it', async () => {
    const headers = await sendAs({ roles: ['WebDelivery', 'Team Alpha', 'Redaktör'] });

    expect(headers['cg-roles']).toBe('WebDelivery,Team Alpha,Redakt%C3%B6r');
  });

  test('encodes a comma inside a role rather than splitting it', async () => {
    const headers = await sendAs({ roles: ['Editors, Reviewers', 'Authors'] });

    expect(headers['cg-roles']).toBe('Editors%2C%20Reviewers,Authors');
  });

  // A raw CR or LF in a header value is how a header-injection attempt gets in.
  test('encodes control characters', async () => {
    const headers = await sendAs({ username: 'admin\r\ncg-roles: Administrators' });

    expect(headers['cg-username']).not.toMatch(/[\r\n]/);
  });
});

describe('deleted and expired content', () => {
  const sendWith = async (
    visibility: { includeDeleted?: boolean; includeExpired?: boolean } = {},
  ): Promise<Record<string, string>> => {
    await new GraphClient('test-key', {
      auth: { type: 'basic', appKey: 'app-key', secret: 'c2VjcmV0', ...visibility },
    }).request(QUERY, {}, undefined, false);

    return sentHeaders();
  };

  // Sent even when unset, so the response does not depend on a Graph-side default.
  test('excludes both by default', async () => {
    expect(await sendWith()).toMatchObject({
      'cg-include-deleted': 'false',
      'cg-include-expired': 'false',
    });
  });

  test.each([
    ['cg-include-deleted', { includeDeleted: true }],
    ['cg-include-expired', { includeExpired: true }],
  ])('sends %s when opted into', async (header, visibility) => {
    expect((await sendWith(visibility))[header]).toBe('true');
  });

  test('sends both on an hmac request too', async () => {
    await new GraphClient('test-key', {
      auth: {
        type: 'hmac',
        appKey: 'app-key',
        secret: 'c2VjcmV0',
        includeDeleted: true,
        includeExpired: true,
      },
    }).request(QUERY, {}, undefined, false);

    expect(sentHeaders()).toMatchObject({
      'cg-include-deleted': 'true',
      'cg-include-expired': 'true',
    });
  });

  // Graph ignores them without a privileged credential, so sending them would only mislead.
  test.each([
    ['the single key', undefined],
    ['a bearer token', { type: 'bearer', token: 'user-jwt' } as const],
  ])('omits both for %s', async (_name, auth) => {
    await new GraphClient('test-key', { auth }).request(QUERY, {}, undefined, false);

    expect(sentHeaders()['cg-include-deleted']).toBeUndefined();
    expect(sentHeaders()['cg-include-expired']).toBeUndefined();
  });
});

describe('the bearer mode', () => {
  test('forwards a static token', async () => {
    const client = new GraphClient('test-key', {
      auth: { type: 'bearer', token: 'user-jwt' },
    });

    await client.request(QUERY, {});

    expect(sentHeaders().Authorization).toBe('Bearer user-jwt');
  });

  test('awaits a token callback and calls it per request', async () => {
    const token = vi.fn(async () => 'fresh-jwt');
    const client = new GraphClient('test-key', { auth: { type: 'bearer', token } });

    await client.request(QUERY, {});
    await client.request(QUERY, {});

    expect(sentHeaders().Authorization).toBe('Bearer fresh-jwt');
    expect(token).toHaveBeenCalledTimes(2);
  });

  test('rejects a callback that returns nothing usable', async () => {
    const client = new GraphClient('test-key', {
      auth: { type: 'bearer', token: (() => undefined) as any },
    });

    await expect(client.request(QUERY, {})).rejects.toThrow(/non-empty string/);
  });
});

describe('typed modes and the rest of the client', () => {
  const MODES = [
    ['basic', { type: 'basic', appKey: 'app-key', secret: 'c2VjcmV0' }],
    ['hmac', { type: 'hmac', appKey: 'app-key', secret: 'c2VjcmV0' }],
    ['bearer', { type: 'bearer', token: 'user-jwt' }],
  ] as const;

  test.each(MODES)('%s turns both caches off by default', (_name, auth) => {
    const { cache, stored } = new GraphClient('test-key', { auth }).queryDefaults;

    expect({ cache, stored }).toEqual({ cache: false, stored: false });
  });

  test.each(MODES)('%s still yields to an explicit cache setting', (_name, auth) => {
    const client = new GraphClient('test-key', { auth, query: { cache: true } });

    expect(client.queryDefaults.cache).toBe(true);
  });

  test.each(MODES)('a preview token takes precedence over %s', async (_name, auth) => {
    await new GraphClient('test-key', { auth }).request(QUERY, {}, 'preview-token');

    expect(sentHeaders().Authorization).toBe('Bearer preview-token');
  });
});

describe('configuration validation', () => {
  const invalid: [string, any][] = [
    ['an unknown type', { type: 'oauth' }],
    ['basic without an appKey', { type: 'basic', secret: 'c2VjcmV0' }],
    ['basic without a secret', { type: 'basic', appKey: 'app-key' }],
    ['hmac with a blank secret', { type: 'hmac', appKey: 'app-key', secret: '  ' }],
    ['bearer with an empty token', { type: 'bearer', token: '' }],
  ];

  test.each(invalid)('rejects %s when the client is built', (_name, auth) => {
    expect(() => new GraphClient('test-key', { auth })).toThrow(OptimizelyGraphError);
  });

  // config() runs at application start-up, so a typo surfaces there rather than on
  // whichever request happens to build the first client.
  test.each(invalid)('rejects %s in config()', (_name, auth) => {
    expect(() => config({ apiKey: 'global-key', auth })).toThrow(OptimizelyGraphError);
  });

  test('accepts a bearer callback without inspecting its result', () => {
    expect(
      () =>
        new GraphClient('test-key', {
          auth: { type: 'bearer', token: () => 'later' },
        }),
    ).not.toThrow();
  });
});
