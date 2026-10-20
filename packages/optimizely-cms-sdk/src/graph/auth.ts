import { OptimizelyGraphError } from './error.js';
import { isBrowser } from './environment.js';
import { md5 } from './md5.js';
import type { AuthMode } from '../telemetry/spans.js';
import type {
  GraphAuth,
  GraphAuthContext,
  GraphAuthHeaders,
  GraphActingUser,
  GraphAuthMode,
  GraphSecrets,
} from './options.js';

// CREDENTIALS

// `btoa`/`atob` rather than `Buffer` so these keep working on edge runtimes, which have none.
const toBase64: (text: string) => string =
  typeof btoa === 'function' ? btoa : (
    text => Buffer.from(text, 'binary').toString('base64')
  );

const bytesToBase64 = (bytes: Uint8Array): string =>
  toBase64(String.fromCharCode(...bytes));

const base64ToBytes: (text: string) => Uint8Array<ArrayBuffer> =
  typeof atob === 'function' ?
    text => Uint8Array.from(atob(text), character => character.charCodeAt(0))
  : text => new Uint8Array(Buffer.from(text, 'base64'));

/**
 * Graph's HMAC scheme: the signature covers the app key, the request line, a timestamp,
 * a nonce and an MD5 digest of the body.
 */
async function hmacHeader(
  appKey: string,
  secret: string,
  request: GraphAuthContext,
): Promise<string> {
  const { pathname, search } = new URL(request.url);
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  const bodyHash = bytesToBase64(md5(request.body));

  const message = [
    appKey,
    request.method,
    pathname + search,
    timestamp,
    nonce,
    bodyHash,
  ].join('');

  // The secret is base64 in the CMS UI; signing uses the bytes it decodes to, not the text.
  const key = await crypto.subtle.importKey(
    'raw',
    base64ToBytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  );

  return `epi-hmac ${appKey}:${timestamp}:${nonce}:${bytesToBase64(new Uint8Array(signature))}`;
}

const isPlainAscii = (value: string): boolean => /^[\x20-\x7e]*$/.test(value);

// Encoded only when it has to be. Graph documents plain ASCII as working unencoded, and
// encoding it anyway would turn `a@b.com` into `a%40b.com`, which matches no one.
const encodeUsername = (username: string): string =>
  isPlainAscii(username) ? username : encodeURIComponent(username);

// Graph splits on commas before it decodes, so a comma inside a name has to be encoded or
// the role silently becomes two.
const encodeRole = (role: string): string =>
  isPlainAscii(role) && !role.includes(',') ? role : encodeURIComponent(role);

type GraphHmacMode = Extract<GraphAuthMode, { type: 'hmac' }>;

// Rejected rather than sent as no headers at all, which would quietly widen the request to
// everything the app credential can see.
const requireActingUser = (user: unknown): GraphActingUser => {
  const { username, roles } = (user ?? {}) as GraphActingUser;

  if (!username && !roles?.length)
    throw new OptimizelyGraphError(
      'Invalid `asUser`: expected an object naming a `username`, some `roles` or both.',
    );

  return { username, roles };
};

const actingUserHeaders = async (
  asUser?: GraphHmacMode['asUser'],
): Promise<GraphAuthHeaders> => {
  if (!asUser) return {};

  const user = requireActingUser(typeof asUser === 'function' ? await asUser() : asUser);

  return {
    ...(user.username ? { 'cg-username': encodeUsername(user.username) } : {}),
    // Graph takes the roles as one comma-separated header value.
    ...(user.roles?.length ? { 'cg-roles': user.roles.map(encodeRole).join(',') } : {}),
  };
};

async function modeHeaders(
  mode: GraphAuthMode,
  request: GraphAuthContext,
  secrets?: GraphSecrets,
): Promise<GraphAuthHeaders> {
  switch (mode.type) {
    case 'hmac': {
      // `validateAuth` has already refused an `hmac` client without secrets.
      const { appKey, secret } = secrets!;
      const [authorization, actingUser] = await Promise.all([
        hmacHeader(appKey, secret, request),
        actingUserHeaders(mode.asUser),
      ]);

      return {
        Authorization: authorization,
        ...actingUser,
        // Sent even when unset, so what Graph returns does not depend on a server-side
        // default we do not control.
        'cg-include-deleted': String(mode.includeDeleted ?? false),
        'cg-include-expired': String(mode.includeExpired ?? false),
      };
    }

    case 'bearer': {
      const token = typeof mode.token === 'function' ? await mode.token() : mode.token;

      if (!token || typeof token !== 'string')
        throw new OptimizelyGraphError(
          'The `auth` bearer token callback must return a non-empty string.',
        );

      return { Authorization: `Bearer ${token}` };
    }
  }
}

async function resolverHeaders(
  auth: Exclude<GraphAuth, GraphAuthMode>,
  request: GraphAuthContext,
): Promise<GraphAuthHeaders> {
  // `Promise.resolve().then` so a resolver that throws synchronously is caught too.
  const headers = await Promise.resolve()
    .then(() => auth(request))
    .catch(err => {
      const optiErr = new OptimizelyGraphError('The `auth` resolver threw.');
      optiErr.cause = err;
      throw optiErr;
    });

  if (!headers || typeof headers !== 'object' || Array.isArray(headers))
    throw new OptimizelyGraphError(
      'The `auth` resolver must return an object mapping header names to string values.',
    );

  return headers;
}

const requireText = (type: string, value: unknown, field: string): void => {
  if (typeof value !== 'string' || value.trim().length === 0)
    throw new OptimizelyGraphError(
      `Invalid configuration: the '${type}' auth mode requires a non-empty \`${field}\`.`,
    );
};

// PUBLIC

/** Which credential a request will carry. */
export const authModeFor = (
  auth: GraphAuth | undefined,
  previewToken: string | undefined,
): AuthMode =>
  previewToken ? 'preview'
  : !auth ? 'single'
  : typeof auth === 'function' ? 'custom'
  : auth.type;

/** The auth headers for one request: a preview token, the configured `auth`, or the single key. */
export async function resolveAuthHeaders(
  apiKey: string,
  auth: GraphAuth | undefined,
  previewToken: string | undefined,
  request: GraphAuthContext,
  secrets?: GraphSecrets,
): Promise<GraphAuthHeaders> {
  // A preview token is itself a credential, so it replaces the others.
  if (previewToken) return { Authorization: `Bearer ${previewToken}` };

  const singleKey = { Authorization: `epi-single ${apiKey}` };
  if (!auth) return singleKey;

  // `bearer` and a resolver are allowed: neither can leak a secret the SDK was handed.
  if (typeof auth !== 'function' && auth.type === 'hmac' && isBrowser())
    throw new OptimizelyGraphError(
      `The '${auth.type}' auth mode was used in a browser. Its app secret must never reach client code. ` +
        'Fetch from a server component, route handler or API route instead, or use `bearer` to ' +
        'forward a token the browser already holds.',
    );

  const headers =
    typeof auth === 'function' ?
      await resolverHeaders(auth, request)
    : await modeHeaders(auth, request, secrets);

  // A resolver may contribute only `cg-username` / `cg-roles`, leaving the single key in place.
  // Matched case-insensitively, or a resolver returning `authorization` would send both and
  // leave it to header-map insertion order which one survives.
  const authorizes = Object.keys(headers).some(
    name => name.toLowerCase() === 'authorization',
  );

  return authorizes ? headers : { ...singleKey, ...headers };
}

/** Rejects a malformed `auth` option at configuration time rather than on the first query. */
export function validateAuth(auth: GraphAuth | undefined, secrets?: GraphSecrets): void {
  if (auth === undefined || typeof auth === 'function') return;

  if (!auth || typeof auth !== 'object')
    throw new OptimizelyGraphError(
      'Invalid `auth` option: expected a resolver function or an object with a `type` of ' +
        "'hmac' or 'bearer'.",
    );

  // Graph accepts Basic, so it gets a pointed message rather than 'unknown type'.
  if ((auth.type as string) === 'basic')
    throw new OptimizelyGraphError(
      "Invalid `auth` option: the SDK has no 'basic' mode, since Basic puts the app secret " +
        "on the wire with every request. Use 'hmac', which signs instead, or an `auth` " +
        'resolver if Basic is unavoidable.',
    );

  switch (auth.type) {
    case 'hmac': {
      if (!secrets)
        throw new OptimizelyGraphError(
          "The 'hmac' auth mode needs `secrets`. Add `secrets: { appKey, secret }` to config().",
        );

      requireText(auth.type, secrets.appKey, 'secrets.appKey');
      requireText(auth.type, secrets.secret, 'secrets.secret');
      // A callback can only be checked once it has run, on the first request.
      if (auth.asUser && typeof auth.asUser !== 'function')
        requireActingUser(auth.asUser);
      return;
    }

    case 'bearer':
      if (typeof auth.token !== 'function') requireText(auth.type, auth.token, 'token');
      return;

    default:
      throw new OptimizelyGraphError(
        `Invalid \`auth\` option: unknown type '${(auth as { type: string }).type}'. ` +
          "Expected 'hmac' or 'bearer'.",
      );
  }
}
