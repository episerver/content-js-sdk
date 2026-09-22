import { OptimizelyGraphError } from './error.js';
import { isBrowser } from './environment.js';
import { md5 } from './md5.js';
import type { AuthMode } from '../telemetry/spans.js';
import type {
  GraphAuth,
  GraphAuthContext,
  GraphAuthHeaders,
  GraphImpersonation,
  GraphAuthMode,
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

const basicHeader = (appKey: string, secret: string): string =>
  `Basic ${toBase64(`${appKey}:${secret}`)}`;

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

const impersonationHeaders = (impersonate?: GraphImpersonation): GraphAuthHeaders =>
  !impersonate ?
    {}
  : {
      ...(impersonate.username ? { 'cg-username': impersonate.username } : {}),
      // Graph takes the roles as one comma-separated header value.
      ...(impersonate.roles?.length ? { 'cg-roles': impersonate.roles.join(',') } : {}),
    };

async function modeHeaders(
  mode: GraphAuthMode,
  request: GraphAuthContext,
): Promise<GraphAuthHeaders> {
  switch (mode.type) {
    case 'basic':
      return {
        Authorization: basicHeader(mode.appKey, mode.secret),
        ...impersonationHeaders(mode.impersonate),
      };

    case 'hmac':
      return {
        Authorization: await hmacHeader(mode.appKey, mode.secret, request),
        ...impersonationHeaders(mode.impersonate),
      };

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

// Only the modes that take an app secret are refused in a browser. `bearer` forwards a token
// the caller already holds and a resolver is the caller's own code, so neither can leak a
// secret the SDK was handed.
const carriesSecret = (auth: GraphAuth): auth is Extract<GraphAuthMode, { secret: string }> =>
  typeof auth !== 'function' && (auth.type === 'basic' || auth.type === 'hmac');

const requireText = (type: string, value: unknown, field: string): void => {
  if (typeof value !== 'string' || value.trim().length === 0)
    throw new OptimizelyGraphError(
      `Invalid \`auth\` option: '${type}' requires a non-empty \`${field}\`.`,
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
): Promise<GraphAuthHeaders> {
  // A preview token is itself a credential, so it replaces the others.
  if (previewToken) return { Authorization: `Bearer ${previewToken}` };

  const singleKey = { Authorization: `epi-single ${apiKey}` };
  if (!auth) return singleKey;

  if (carriesSecret(auth) && isBrowser())
    throw new OptimizelyGraphError(
      `The '${auth.type}' auth mode was used in a browser. Its app secret must never reach client code. ` +
        'Fetch from a server component, route handler or API route instead, or use `bearer` to ' +
        'forward a token the browser already holds.',
    );

  const headers =
    typeof auth === 'function' ?
      await resolverHeaders(auth, request)
    : await modeHeaders(auth, request);

  // A resolver may contribute only impersonation headers, leaving the single key in place.
  return { ...singleKey, ...headers };
}

/** Rejects a malformed `auth` option at configuration time rather than on the first query. */
export function validateAuth(auth: GraphAuth | undefined): void {
  if (auth === undefined || typeof auth === 'function') return;

  if (!auth || typeof auth !== 'object')
    throw new OptimizelyGraphError(
      'Invalid `auth` option: expected a resolver function or an object with a `type` of ' +
        "'basic', 'hmac' or 'bearer'.",
    );

  switch (auth.type) {
    case 'basic':
    case 'hmac':
      requireText(auth.type, auth.appKey, 'appKey');
      requireText(auth.type, auth.secret, 'secret');
      return;

    case 'bearer':
      if (typeof auth.token !== 'function') requireText(auth.type, auth.token, 'token');
      return;

    default:
      throw new OptimizelyGraphError(
        `Invalid \`auth\` option: unknown type '${(auth as { type: string }).type}'. ` +
          "Expected 'basic', 'hmac' or 'bearer'.",
      );
  }
}

