#!/usr/bin/env node
/**
 * Post-deploy verification for Stride Storefront v2 (issue 0004).
 *
 * Usage:
 *   node scripts/verify-deploy.mjs <BASE_URL>
 *   node scripts/verify-deploy.mjs https://localhost:3000        # local `npm run dev`
 *   node scripts/verify-deploy.mjs https://<project>.vercel.app  # deployed origin
 *
 * Plain Node (>= 18, uses global fetch), zero dependencies.
 *
 * Checks (each reports PASS / FAIL / SKIP):
 *   1. GET  /store                 -> 200
 *   2. GET  /webmcp-tools.js       -> 200, JavaScript content
 *   3. GET  /api/store/cart        -> 200 + X-Stride-Session response header
 *   4. Signed-cookie roundtrip     -> POST cart item (Idempotency-Key) then
 *                                     GET cart with the returned cookie:
 *                                     mutation persists across requests
 *   5. Origin-Trial header         -> present when ORIGIN_TRIAL_TOKEN is set
 *                                     in this shell; SKIP otherwise
 *
 * A route answering 404 is reported SKIP (not FAIL): the store may not be
 * integrated on the target yet. Anything else unexpected is FAIL.
 * Exit code: 0 when no FAILs, 1 otherwise.
 *
 * TLS note: `npm run dev` serves https with a self-signed certificate. For
 * localhost/127.0.0.1 targets this script disables TLS verification for its
 * own process (NODE_TLS_REJECT_UNAUTHORIZED=0). Never needed for Vercel.
 */

const baseArg = process.argv[2];
if (!baseArg) {
  console.error('Usage: node scripts/verify-deploy.mjs <BASE_URL>');
  process.exit(2);
}

let base;
try {
  base = new URL(baseArg);
} catch {
  console.error(`Not a valid URL: ${baseArg}`);
  process.exit(2);
}
const origin = base.origin;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
if (base.protocol === 'https:' && LOCAL_HOSTS.has(base.hostname)) {
  // Tolerate the dev server's self-signed certificate (this process only).
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const results = [];
function report(name, status, detail) {
  results.push({ name, status });
  const icon = status === 'PASS' ? 'PASS' : status === 'SKIP' ? 'SKIP' : 'FAIL';
  console.log(`[${icon}] ${name}${detail ? ` — ${detail}` : ''}`);
}

/** fetch that never throws; returns { res } or { err }. */
async function tryFetch(path, init) {
  try {
    const res = await fetch(origin + path, { redirect: 'manual', ...init });
    return { res };
  } catch (err) {
    return { err };
  }
}

/** Minimal cookie jar: fold Set-Cookie headers into a Cookie request header. */
function harvestCookies(res, jar) {
  const setCookies =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : res.headers.get('set-cookie')
        ? [res.headers.get('set-cookie')]
        : [];
  for (const sc of setCookies) {
    const pair = sc.split(';', 1)[0];
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}
const cookieHeader = (jar) =>
  [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');

// ── 1. /store returns 200 ───────────────────────────────────────────────────
async function checkStore() {
  const { res, err } = await tryFetch('/store');
  if (err) return report('/store returns 200', 'FAIL', String(err));
  if (res.status === 200) return report('/store returns 200', 'PASS');
  if (res.status === 404)
    return report('/store returns 200', 'SKIP', 'route not implemented yet (404)');
  report('/store returns 200', 'FAIL', `unexpected status ${res.status}`);
}

// ── 2. /webmcp-tools.js is served ───────────────────────────────────────────
async function checkToolsScript() {
  const name = '/webmcp-tools.js served';
  const { res, err } = await tryFetch('/webmcp-tools.js');
  if (err) return report(name, 'FAIL', String(err));
  if (res.status === 404)
    return report(name, 'SKIP', 'not built yet on this target (404)');
  if (res.status !== 200)
    return report(name, 'FAIL', `unexpected status ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  const body = await res.text();
  if (/javascript|ecmascript/i.test(type) || body.length > 0)
    return report(name, 'PASS', `content-type: ${type || 'n/a'}, ${body.length} bytes`);
  report(name, 'FAIL', `200 but empty body and content-type ${type}`);
}

// ── 3. /api/store/cart sets X-Stride-Session ────────────────────────────────
// Returns the session id (or null) so later checks can reuse knowledge.
async function checkCartHeader() {
  const name = 'GET /api/store/cart — 200 + X-Stride-Session header';
  const { res, err } = await tryFetch('/api/store/cart');
  if (err) {
    report(name, 'FAIL', String(err));
    return { available: false };
  }
  if (res.status === 404) {
    report(name, 'SKIP', 'route not implemented yet (404)');
    return { available: false };
  }
  if (res.status !== 200) {
    report(name, 'FAIL', `unexpected status ${res.status}`);
    return { available: true };
  }
  const session = res.headers.get('x-stride-session');
  if (session) report(name, 'PASS', `session ${session}`);
  else report(name, 'FAIL', '200 but X-Stride-Session header missing');
  return { available: true };
}

// ── 4. Signed-cookie roundtrip: POST item, then GET cart persists ───────────
async function checkCookieRoundtrip(cartAvailable) {
  const name = 'signed-cookie roundtrip (POST item + Idempotency-Key, GET persists)';
  if (!cartAvailable)
    return report(name, 'SKIP', 'cart API not implemented yet');

  // Discover a real productId via the search route (catalog is fixture data).
  let productId = null;
  const search = await tryFetch('/api/store/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ limit: 1 }),
  });
  if (search.res?.status === 200) {
    try {
      const data = await search.res.json();
      productId = data?.matches?.[0]?.product?.id ?? null;
    } catch {
      /* fall through */
    }
  }
  if (!productId)
    return report(name, 'SKIP', 'no productId discoverable via /api/store/search yet');

  const jar = new Map();
  const idempotencyKey = `verify-${Date.now().toString(36)}`;
  const post = await tryFetch('/api/store/cart/items', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  if (post.err) return report(name, 'FAIL', String(post.err));
  if (post.res.status === 404)
    return report(name, 'SKIP', 'cart mutation route not implemented yet (404)');
  if (post.res.status !== 200) {
    // Sized products may require frameSize; retry once with a discovered size.
    let retried = false;
    try {
      const body = await post.res.clone().json();
      const hint = body?.error?.hint ?? '';
      const size = /\b(4[89]|5[02468]|6[02])\b/.exec(hint)?.[0];
      if (size) {
        retried = true;
        const retry = await tryFetch('/api/store/cart/items', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'Idempotency-Key': idempotencyKey + '-s',
          },
          body: JSON.stringify({ productId, frameSize: size, quantity: 1 }),
        });
        if (retry.res?.status === 200) {
          harvestCookies(retry.res, jar);
          return finishRoundtrip(name, jar, productId);
        }
      }
    } catch {
      /* fall through */
    }
    return report(
      name,
      'FAIL',
      `POST /api/store/cart/items -> ${post.res.status}${retried ? ' (frameSize retry also failed)' : ''}`,
    );
  }
  harvestCookies(post.res, jar);
  return finishRoundtrip(name, jar, productId);
}

async function finishRoundtrip(name, jar, productId) {
  if (!jar.has('stride_store'))
    return report(name, 'FAIL', 'mutation response set no stride_store cookie');
  const get = await tryFetch('/api/store/cart', {
    headers: { cookie: cookieHeader(jar) },
  });
  if (get.err || get.res.status !== 200)
    return report(name, 'FAIL', `follow-up GET failed (${get.err ?? get.res.status})`);
  let cart;
  try {
    cart = await get.res.json();
  } catch {
    return report(name, 'FAIL', 'GET /api/store/cart returned non-JSON');
  }
  const found = cart?.items?.some((i) => i.productId === productId);
  if (found) report(name, 'PASS', `item ${productId} persisted across requests`);
  else report(name, 'FAIL', `item ${productId} missing from follow-up GET cart`);
}

// ── 5. Origin-Trial header (only when a token is expected) ──────────────────
async function checkOriginTrial() {
  const name = 'Origin-Trial response header';
  const expected = process.env.ORIGIN_TRIAL_TOKEN;
  const { res, err } = await tryFetch('/store');
  if (err) return report(name, 'FAIL', String(err));
  const served = res.headers.get('origin-trial');
  if (!expected) {
    return report(
      name,
      'SKIP',
      served
        ? `token served (${served.slice(0, 16)}…) but ORIGIN_TRIAL_TOKEN not set in this shell to compare`
        : 'ORIGIN_TRIAL_TOKEN not set (enrollment is Mario-only; header intentionally absent)',
    );
  }
  if (served === expected) return report(name, 'PASS');
  report(name, 'FAIL', served ? 'header present but token mismatch' : 'header missing');
}

// ── run ─────────────────────────────────────────────────────────────────────
console.log(`Verifying ${origin}\n`);
await checkStore();
await checkToolsScript();
const { available } = await checkCartHeader();
await checkCookieRoundtrip(available);
await checkOriginTrial();

const fails = results.filter((r) => r.status === 'FAIL').length;
const passes = results.filter((r) => r.status === 'PASS').length;
const skips = results.filter((r) => r.status === 'SKIP').length;
console.log(`\n${passes} passed, ${fails} failed, ${skips} skipped.`);
process.exit(fails > 0 ? 1 : 0);
