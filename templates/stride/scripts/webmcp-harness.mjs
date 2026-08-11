/**
 * Standalone verification harness for webmcp/tools.js (issue 0002
 * deliverable 5). Runs WITHOUT the store: it executes the classic script in
 * a node:vm sandbox with a fake document.modelContext, fake fetch, and fake
 * window.strideStoreBridge, and asserts the contracts.md §5/§6 behavior:
 *
 *   - registration of all six tools (names, readOnlyHint annotations,
 *     additionalProperties:false, required lists) via document.modelContext,
 *     via the deprecated navigator.modelContext fallback, and graceful no-op
 *     (zero console output) when neither exists;
 *   - schema rejection path (INVALID_ARGS envelope + corrective hint, no
 *     fetch performed);
 *   - ok:true envelope shape + bridge sync + telemetry (exactly 4 fields,
 *     sessionId from the X-Stride-Session response header);
 *   - Idempotency-Key header forwarded verbatim; replayed propagation;
 *   - API error path (showErrorNotice awaited, ok:false envelope, no cart
 *     drawer for read-only failures);
 *   - BRIDGE_UNAVAILABLE when window.strideStoreBridge never appears
 *     (real 2000 ms wait — one slow test);
 *   - partial_failure per class with the EXACT §5 warning strings, single
 *     re-sync (cart class re-fetches GET /api/store/cart), and no-hang when
 *     the re-sync also fails.
 *
 * Also re-runs the webmcp-build static validation rules (including
 * negative cases proving the validator rejects broken sources).
 *
 * Usage: npm run webmcp:harness   (exit 0 = all assertions passed)
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateToolsSource, validateToolsFile, SRC_PATH } from './webmcp-build.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(join(ROOT, 'webmcp', 'tools.js'), 'utf8');

const WARNING_MUTATION =
  'STATE CHANGED — do not repeat this mutation with a new key. Retry with the SAME idempotencyKey, or call get_cart.';
const WARNING_READONLY =
  'UI sync failed; no state changed — safe to retry this call.';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function makeFetch(handler) {
  const calls = [];
  const fn = (path, options = {}) => {
    calls.push({ path, options });
    let res;
    try {
      res = handler(path, options, calls.length);
    } catch (e) {
      return Promise.reject(e);
    }
    if (res instanceof Error) return Promise.reject(res);
    return Promise.resolve({
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      headers: {
        get: (h) =>
          h.toLowerCase() === 'x-stride-session' ? (res.sessionId ?? 'sessAAAAbbbb0000') : null,
      },
      json: () => Promise.resolve(res.body ?? null),
    });
  };
  fn.calls = calls;
  return fn;
}

function makeBridge() {
  const calls = [];
  const telemetry = [];
  let failNextSync = 0;
  const uiMethod = (name) => (...args) => {
    calls.push({ name, args });
    if (failNextSync > 0 && (name === 'showSearch' || name === 'showComparison' || name === 'showCart')) {
      failNextSync--;
      return Promise.reject(new Error('harness: forced UI-sync failure'));
    }
    return Promise.resolve();
  };
  return {
    version: 1,
    showSearch: uiMethod('showSearch'),
    showComparison: uiMethod('showComparison'),
    showCart: uiMethod('showCart'),
    showErrorNotice: uiMethod('showErrorNotice'),
    telemetry: {
      record: (e) => telemetry.push(e),
      exportJson: () => JSON.stringify({ version: 1, events: telemetry }),
      clear: () => telemetry.splice(0),
    },
    _calls: calls,
    _telemetry: telemetry,
    _failNextSync: (n = 1) => {
      failNextSync = n;
    },
  };
}

/**
 * Run tools.js in a vm sandbox.
 * target: 'document' | 'navigator' | 'none' — where modelContext lives.
 */
async function boot({ bridge = null, fetchImpl = makeFetch(() => ({ status: 500 })), target = 'document' } = {}) {
  const tools = new Map();
  const mcObj = {
    registerTool(def) {
      tools.set(def.name, def);
      return Promise.resolve({ name: def.name });
    },
    getTools: () => [...tools.values()],
    callTool(name, args) {
      const def = tools.get(name);
      if (!def) return Promise.reject(new Error(`unknown tool: ${name}`));
      return Promise.resolve(def.execute(args));
    },
  };
  const consoleLog = [];
  const fakeConsole = {
    log: (...a) => consoleLog.push(['log', ...a]),
    warn: (...a) => consoleLog.push(['warn', ...a]),
    error: (...a) => consoleLog.push(['error', ...a]),
  };
  const windowObj = {};
  if (bridge) windowObj.strideStoreBridge = bridge;
  const sandbox = {
    document: target === 'document' ? { modelContext: mcObj } : {},
    navigator: target === 'navigator' ? { modelContext: mcObj } : {},
    window: windowObj,
    fetch: fetchImpl,
    setTimeout,
    clearTimeout,
    Date,
    console: fakeConsole,
    encodeURIComponent,
    Promise,
    JSON,
    Math,
    RegExp,
    Error,
    Object,
    Array,
  };
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: 'webmcp/tools.js' });
  // registration chain is async
  await new Promise((r) => setTimeout(r, 20));
  return { mc: mcObj, tools, sandbox, consoleLog, windowObj };
}

const sampleSearchResult = { matches: [], total: 0, args: {} };
const sampleCart = { sessionId: 'sessAAAAbbbb0000', items: [], itemCount: 0, subtotalUsd: 0 };
const sampleMutation = (replayed = false) => ({
  cart: {
    sessionId: 'sessAAAAbbbb0000',
    items: [
      {
        cartItemId: 'traverse-gravel-sl:56',
        productId: 'traverse-gravel-sl',
        name: 'Traverse Gravel SL',
        frameSize: '56',
        quantity: 1,
        unitPriceUsd: 2499,
        lineTotalUsd: 2499,
      },
    ],
    itemCount: 1,
    subtotalUsd: 2499,
  },
  changed: { cartItemId: 'traverse-gravel-sl:56' },
  replayed,
});

function isPureEnvelope(env) {
  if (!env || typeof env !== 'object') return false;
  const keys = Object.keys(env).filter((k) => k !== 'content');
  if (env.ok === true) return keys.every((k) => ['ok', 'data', 'replayed'].includes(k)) && 'data' in env;
  if (env.ok === false) {
    return (
      keys.every((k) => ['ok', 'error'].includes(k)) &&
      env.error &&
      typeof env.error.code === 'string' &&
      typeof env.error.message === 'string' &&
      typeof env.error.hint === 'string'
    );
  }
  if (env.ok === 'partial_failure') {
    return keys.every((k) => ['ok', 'data', 'warning'].includes(k)) && 'data' in env && typeof env.warning === 'string';
  }
  return false;
}

async function main() {
  console.log('— build validation rules —');
  {
    const errs = validateToolsFile(SRC_PATH);
    check('webmcp-build validation passes on the real source', errs.length === 0, errs.join('; '));
    // negative cases: the validator must reject broken sources
    check(
      'validator rejects a DOM query token',
      validateToolsSource(SRC.replace("var BRIDGE_POLL_MS = 50;", "var BRIDGE_POLL_MS = 50; var el = document.querySelector('x');")).length > 0
    );
    check(
      'validator rejects a foreign window.* access',
      validateToolsSource(SRC.replace('var BRIDGE_POLL_MS = 50;', 'var BRIDGE_POLL_MS = 50; var l = window.location;')).length > 0
    );
    check(
      'validator rejects a non-/api/store fetch path literal',
      validateToolsSource(SRC.replace("'/api/store/search'", "'/api/other/search'")).length > 0
    );
    check(
      'validator rejects a removed tool registration',
      validateToolsSource(SRC.replace("name: 'get_cart'", "name: 'got_cart'")).length > 0
    );
    check(
      'validator rejects a broken schema (idempotencyKey no longer required)',
      validateToolsSource(SRC.replace("required: ['productId', 'idempotencyKey']", "required: ['productId']")).length > 0
    );
    check(
      'validator rejects a require() call',
      validateToolsSource(SRC.replace('var BRIDGE_POLL_MS = 50;', "var BRIDGE_POLL_MS = 50; var fs = require('fs');")).length > 0
    );
    check(
      'validator rejects a polyfill assignment',
      validateToolsSource(SRC.replace('var BRIDGE_POLL_MS = 50;', 'var BRIDGE_POLL_MS = 50; document.modelContext = {};')).length > 0
    );
  }

  console.log('— registration —');
  {
    const bridge = makeBridge();
    const { tools, consoleLog } = await boot({ bridge });
    const names = [...tools.keys()];
    check(
      'all six tools registered on document.modelContext',
      JSON.stringify(names) ===
        JSON.stringify(['search_products', 'compare_bikes', 'get_cart', 'add_to_cart', 'update_cart_item', 'remove_from_cart']),
      names.join(',')
    );
    const readOnly = ['search_products', 'compare_bikes', 'get_cart'];
    check(
      'readOnlyHint annotations exactly on the three read-only tools',
      names.every((n) => {
        const hasHint = tools.get(n).annotations?.readOnlyHint === true;
        return readOnly.includes(n) ? hasHint : !hasHint;
      })
    );
    check(
      'every schema is object + additionalProperties:false',
      names.every((n) => {
        const s = tools.get(n).inputSchema;
        return s.type === 'object' && s.additionalProperties === false;
      })
    );
    check(
      'mutation schemas require idempotencyKey',
      ['add_to_cart', 'update_cart_item', 'remove_from_cart'].every((n) =>
        tools.get(n).inputSchema.required.includes('idempotencyKey')
      )
    );
    check(
      'every tool has an LLM-facing description',
      names.every((n) => (tools.get(n).description || '').length > 80)
    );
    check('no console output on successful registration', consoleLog.length === 0, JSON.stringify(consoleLog));
  }
  {
    const { tools } = await boot({ target: 'navigator' });
    check('navigator.modelContext fallback registers all six tools', tools.size === 6);
  }
  {
    const { tools, consoleLog, sandbox } = await boot({ target: 'none' });
    check(
      'graceful no-op when modelContext is absent (no tools, no console, no shim installed)',
      tools.size === 0 && consoleLog.length === 0 && !sandbox.document.modelContext && !sandbox.navigator.modelContext
    );
  }

  console.log('— schema rejection (no fetch) —');
  {
    const bridge = makeBridge();
    const fetchImpl = makeFetch(() => ({ status: 200, body: {} }));
    const { mc } = await boot({ bridge, fetchImpl });

    let env = await mc.callTool('add_to_cart', { productId: 'traverse-gravel-sl' });
    check('missing idempotencyKey → ok:false INVALID_ARGS', env.ok === false && env.error.code === 'INVALID_ARGS');
    check('missing idempotencyKey → corrective hint mentions reuse', /SAME key verbatim/i.test(env.error.hint));
    check('missing idempotencyKey → envelope shape valid', isPureEnvelope(env));
    check('missing idempotencyKey → NO fetch performed', fetchImpl.calls.length === 0);

    env = await mc.callTool('add_to_cart', { productId: 'Bad_Id!', idempotencyKey: 'retry-key-001' });
    check('out-of-pattern productId → INVALID_ARGS, no fetch', env.ok === false && env.error.code === 'INVALID_ARGS' && fetchImpl.calls.length === 0);

    env = await mc.callTool('add_to_cart', { productId: 'traverse-gravel-sl', idempotencyKey: 'short' });
    check('idempotencyKey shorter than 8 → INVALID_ARGS', env.ok === false && env.error.code === 'INVALID_ARGS');

    env = await mc.callTool('compare_bikes', { ids: ['only-one-bike'] });
    check('compare_bikes with 1 id → INVALID_ARGS (minItems 2)', env.ok === false && env.error.code === 'INVALID_ARGS');

    env = await mc.callTool('search_products', { limit: 25 });
    check('search limit 25 → INVALID_ARGS (max 24)', env.ok === false && env.error.code === 'INVALID_ARGS');

    env = await mc.callTool('search_products', { bogus: true });
    check('unknown argument → INVALID_ARGS naming the argument', env.ok === false && /bogus/.test(env.error.message));

    check('schema failures never fetched', fetchImpl.calls.length === 0);
    check(
      'schema failures showed the error notice (bridge present), never the cart drawer',
      bridge._calls.some((c) => c.name === 'showErrorNotice') && !bridge._calls.some((c) => c.name === 'showCart')
    );
    check(
      'telemetry outcomes for schema failures are INVALID_ARGS with exactly 4 fields',
      bridge._telemetry.length > 0 &&
        bridge._telemetry.every(
          (e) => e.outcome === 'INVALID_ARGS' && JSON.stringify(Object.keys(e).sort()) === JSON.stringify(['durationMs', 'outcome', 'sessionId', 'tool'])
        )
    );
  }

  console.log('— happy paths, envelope + bridge + telemetry —');
  {
    const bridge = makeBridge();
    const fetchImpl = makeFetch((path, options) => {
      if (path === '/api/store/search') return { status: 200, body: sampleSearchResult };
      if (path.startsWith('/api/store/compare')) return { status: 200, body: { products: [], deltas: [] } };
      if (path === '/api/store/cart' && (!options.method || options.method === 'GET')) return { status: 200, body: sampleCart };
      if (path === '/api/store/cart/items') return { status: 200, body: sampleMutation(false) };
      return { status: 404, body: { error: { code: 'PRODUCT_NOT_FOUND', message: 'x', hint: 'y' } } };
    });
    const { mc } = await boot({ bridge, fetchImpl });

    let env = await mc.callTool('search_products', { category: 'bike', maxPriceUsd: 2600 });
    check('search ok:true envelope with data', env.ok === true && env.data === sampleSearchResult && isPureEnvelope(env));
    check('search POSTs /api/store/search with JSON body', fetchImpl.calls[0].path === '/api/store/search' && JSON.parse(fetchImpl.calls[0].options.body).maxPriceUsd === 2600);
    check('search awaited showSearch with the result', bridge._calls.filter((c) => c.name === 'showSearch').length === 1 && bridge._calls[0].args[0] === sampleSearchResult);
    check('envelope carries MCP content mirror', Array.isArray(env.content) && JSON.parse(env.content[0].text).ok === true);

    env = await mc.callTool('compare_bikes', { ids: ['aero-road-one', 'traverse-gravel-sl'], riderHeightCm: 178 });
    check('compare GET url encodes ids + riderHeightCm', fetchImpl.calls[1].path === '/api/store/compare?ids=aero-road-one,traverse-gravel-sl&riderHeightCm=178');
    check('compare ok:true + showComparison awaited', env.ok === true && bridge._calls.some((c) => c.name === 'showComparison'));

    env = await mc.callTool('get_cart', {});
    check('get_cart ok:true + showCart(page)', env.ok === true && bridge._calls.some((c) => c.name === 'showCart' && c.args[1] === 'page'));

    env = await mc.callTool('add_to_cart', { productId: 'traverse-gravel-sl', frameSize: '56', idempotencyKey: 'wf1-add-bike-001' });
    const addCall = fetchImpl.calls[3];
    check('add_to_cart forwards Idempotency-Key verbatim', addCall.options.headers['Idempotency-Key'] === 'wf1-add-bike-001');
    check('add_to_cart POST body carries productId/frameSize', JSON.parse(addCall.options.body).frameSize === '56');
    check('add_to_cart ok:true, replayed absent when false', env.ok === true && !('replayed' in env));
    check('add_to_cart opened the drawer surface', bridge._calls.some((c) => c.name === 'showCart' && c.args[1] === 'drawer'));

    const t = bridge._telemetry;
    check('one telemetry row per call, outcome ok', t.length === 4 && t.every((e) => e.outcome === 'ok'));
    check(
      'telemetry rows: exactly 4 fields, sessionId from X-Stride-Session, numeric duration',
      t.every(
        (e) =>
          JSON.stringify(Object.keys(e).sort()) === JSON.stringify(['durationMs', 'outcome', 'sessionId', 'tool']) &&
          e.sessionId === 'sessAAAAbbbb0000' &&
          typeof e.durationMs === 'number'
      )
    );
  }

  console.log('— replay propagation —');
  {
    const bridge = makeBridge();
    const fetchImpl = makeFetch(() => ({ status: 200, body: sampleMutation(true) }));
    const { mc } = await boot({ bridge, fetchImpl });
    const env = await mc.callTool('update_cart_item', { cartItemId: 'traverse-gravel-sl:56', quantity: 2, idempotencyKey: 'wf1-upd-qty-0001' });
    check('replayed:true propagates to the envelope', env.ok === true && env.replayed === true && isPureEnvelope(env));
    check('update PATCHes the cartItemId route', fetchImpl.calls[0].path === '/api/store/cart/items/traverse-gravel-sl%3A56' && fetchImpl.calls[0].options.method === 'PATCH');
  }

  console.log('— API error path —');
  {
    const bridge = makeBridge();
    const storeError = { code: 'VARIANT_UNAVAILABLE', message: 'size 62 unavailable', hint: 'size 62 unavailable for traverse-gravel-sl; in stock: 54, 56, 58' };
    const fetchImpl = makeFetch(() => ({ status: 409, body: { error: storeError } }));
    const { mc } = await boot({ bridge, fetchImpl });
    const env = await mc.callTool('add_to_cart', { productId: 'traverse-gravel-sl', frameSize: '62', idempotencyKey: 'wf1-add-bike-002' });
    check('409 → ok:false with the API StoreError verbatim', env.ok === false && env.error === storeError && isPureEnvelope(env));
    check('error notice awaited with the structured error', bridge._calls.some((c) => c.name === 'showErrorNotice' && c.args[0] === storeError));
    check('no cart surface shown on failure', !bridge._calls.some((c) => c.name === 'showCart'));
    check('telemetry outcome is the error code', bridge._telemetry[0]?.outcome === 'VARIANT_UNAVAILABLE');

    // read-only failure never shows the cart drawer
    bridge._calls.splice(0);
    const env2 = await mc.callTool('compare_bikes', { ids: ['aero-road-one', 'no-such-bike'] });
    check('read-only failure: notice only, never the drawer', env2.ok === false && bridge._calls.every((c) => c.name === 'showErrorNotice'));
  }

  console.log('— BRIDGE_UNAVAILABLE pre-fetch guard (real 2s wait) —');
  {
    const fetchImpl = makeFetch(() => ({ status: 200, body: sampleSearchResult }));
    const { mc } = await boot({ bridge: null, fetchImpl });
    const t0 = Date.now();
    const env = await mc.callTool('search_products', {});
    const waited = Date.now() - t0;
    check('no bridge → ok:false BRIDGE_UNAVAILABLE (pre-fetch guard)', env.ok === false && env.error.code === 'BRIDGE_UNAVAILABLE' && isPureEnvelope(env));
    check('guard fired BEFORE the API: zero fetches performed', fetchImpl.calls.length === 0);
    check('guard message states no state changed', /NOT called|no state changed/i.test(env.error.message));
    check('waited ~2000ms then resolved (no hang)', waited >= 1900 && waited < 4000, `${waited}ms`);

    // mutations are guarded identically: no bridge -> no API call, ever
    const env2 = await mc.callTool('add_to_cart', { productId: 'traverse-gravel-sl', frameSize: '56', idempotencyKey: 'guard-key-001' });
    check('mutation with no bridge → BRIDGE_UNAVAILABLE, zero fetches', env2.ok === false && env2.error.code === 'BRIDGE_UNAVAILABLE' && fetchImpl.calls.length === 0);
  }

  console.log('— API_UNAVAILABLE (network-level fetch failure) —');
  {
    const bridge = makeBridge();
    const fetchImpl = makeFetch(() => { throw new Error('network down'); });
    const { mc } = await boot({ bridge, fetchImpl });
    const env = await mc.callTool('add_to_cart', { productId: 'traverse-gravel-sl', frameSize: '56', idempotencyKey: 'net-fail-001' });
    check('mutation network failure → ok:false API_UNAVAILABLE (never BRIDGE_UNAVAILABLE)', env.ok === false && env.error.code === 'API_UNAVAILABLE' && isPureEnvelope(env));
    check('mutation network hint: retry with the SAME idempotencyKey', /SAME idempotencyKey/.test(env.error.hint) && /never a new one/.test(env.error.hint));
    check('network failure showed the synchronized error notice', bridge._calls.some((c) => c.name === 'showErrorNotice' && c.args[0].code === 'API_UNAVAILABLE'));

    const env2 = await mc.callTool('search_products', { discipline: 'gravel' });
    check('read network failure → API_UNAVAILABLE with safe-to-retry hint', env2.ok === false && env2.error.code === 'API_UNAVAILABLE' && /safe to retry/i.test(env2.error.hint));
  }

  console.log('— partial_failure per class —');
  {
    // read-only class: search re-syncs its own surface with the same result
    const bridge = makeBridge();
    const fetchImpl = makeFetch(() => ({ status: 200, body: sampleSearchResult }));
    const { mc } = await boot({ bridge, fetchImpl });
    bridge._failNextSync(1);
    const env = await mc.callTool('search_products', { discipline: 'gravel' });
    const searchCalls = bridge._calls.filter((c) => c.name === 'showSearch');
    check('search partial_failure envelope + EXACT read-only warning', env.ok === 'partial_failure' && env.warning === WARNING_READONLY && isPureEnvelope(env));
    check('search re-synced once with the SAME result (2 showSearch calls)', searchCalls.length === 2 && searchCalls[1].args[0] === sampleSearchResult);
    check('search partial_failure did not re-fetch', fetchImpl.calls.length === 1);
    check('telemetry outcome partial_failure', bridge._telemetry[0]?.outcome === 'partial_failure');
  }
  {
    // mutation class: re-fetch GET /api/store/cart then showCart
    const bridge = makeBridge();
    const fetchImpl = makeFetch((path, options) => {
      if (path === '/api/store/cart' && options.method === 'GET') return { status: 200, body: sampleCart };
      return { status: 200, body: sampleMutation(false) };
    });
    const { mc } = await boot({ bridge, fetchImpl });
    bridge._failNextSync(1);
    const env = await mc.callTool('add_to_cart', { productId: 'traverse-gravel-sl', frameSize: '56', idempotencyKey: 'wf1-add-bike-003' });
    check('mutation partial_failure envelope + EXACT mutation warning', env.ok === 'partial_failure' && env.warning === WARNING_MUTATION && isPureEnvelope(env));
    check('mutation applied exactly once (single POST)', fetchImpl.calls.filter((c) => c.path === '/api/store/cart/items').length === 1);
    check('re-sync re-fetched GET /api/store/cart', fetchImpl.calls.some((c) => c.path === '/api/store/cart' && c.options.method === 'GET'));
    const cartCalls = bridge._calls.filter((c) => c.name === 'showCart');
    check('re-sync showed the FRESH cart on the drawer surface', cartCalls.length === 2 && cartCalls[1].args[0] === sampleCart && cartCalls[1].args[1] === 'drawer');
  }
  {
    // get_cart belongs to the cart re-sync class but keeps the read-only warning
    const bridge = makeBridge();
    const fetchImpl = makeFetch(() => ({ status: 200, body: sampleCart }));
    const { mc } = await boot({ bridge, fetchImpl });
    bridge._failNextSync(1);
    const env = await mc.callTool('get_cart', {});
    check('get_cart partial_failure uses the read-only warning', env.ok === 'partial_failure' && env.warning === WARNING_READONLY);
    check('get_cart re-sync re-fetched the cart (2 GETs)', fetchImpl.calls.length === 2);
  }
  {
    // re-sync ALSO fails: still resolves partial_failure, never hangs
    const bridge = makeBridge();
    const fetchImpl = makeFetch(() => ({ status: 200, body: sampleMutation(false) }));
    const { mc } = await boot({ bridge, fetchImpl });
    bridge._failNextSync(2);
    const env = await Promise.race([
      mc.callTool('remove_from_cart', { cartItemId: 'traverse-gravel-sl:56', idempotencyKey: 'wf1-rem-item-001' }),
      new Promise((r) => setTimeout(() => r('HUNG'), 8000)),
    ]);
    check('double bridge failure still resolves partial_failure (no hang, no double-apply)',
      env !== 'HUNG' && env.ok === 'partial_failure' && env.warning === WARNING_MUTATION &&
      fetchImpl.calls.filter((c) => c.options.method === 'DELETE').length === 1);
  }

  console.log('');
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('failures:', failures.join(' | '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('harness crashed:', e);
  process.exit(1);
});
