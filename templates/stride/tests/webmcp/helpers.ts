import type { Page } from '@playwright/test';

/**
 * Shared helpers for the ADR 0002 enforcement suite.
 *
 * The suite runs on stock Chromium: a minimal modelContext TEST DOUBLE
 * (registry + callTool) is installed via addInitScript BEFORE any page
 * script runs, so /webmcp-tools.js registers into it. This is Playwright
 * scaffolding only — the shipped tools.js contains NO polyfill and no-ops
 * when modelContext is absent (asserted in enumeration.spec.ts).
 *
 * Required integration hooks (implemented by issue 0001's StoreProvider —
 * see docs/storefront-v2/integration-notes-0002.md §3):
 *   - window.__strideBridgeFailNext
 *   - data-testid attributes (as implemented by issue 0001):
 *     store-error-notice, store-empty, product-card-<id> (prefix match),
 *     store-compare, cart-drawer (+ data-open)
 *     (+ data-open="true"), cart-count.
 */

export const MODEL_CONTEXT_SHIM = `
  if (!document.modelContext && !navigator.modelContext) {
    const tools = new Map();
    document.modelContext = {
      registerTool(def) { tools.set(def.name, def); return Promise.resolve({ name: def.name }); },
      unregisterTool(name) { tools.delete(name); },
      getTools() {
        return Array.from(tools.values()).map(({ name, description, inputSchema, annotations }) =>
          ({ name, description, inputSchema, annotations }));
      },
      callTool(name, args) {
        const def = tools.get(name);
        if (!def) return Promise.reject(new Error('unknown tool: ' + name));
        return Promise.resolve(def.execute(args));
      },
    };
  }
`;

export async function installModelContext(page: Page): Promise<void> {
  await page.addInitScript(MODEL_CONTEXT_SHIM);
}

export interface DomSnapshot {
  url: string;
  pathname: string;
  search: string;
  productCards: (string | null)[];
  emptyState: boolean;
  compareView: boolean;
  drawerOpen: boolean;
  cartCount: string | null;
  noticeText: string | null;
}

export interface CallOutcome {
  env: any;
  snapshot: DomSnapshot;
}

/**
 * Invoke a tool via document.modelContext.callTool and capture the DOM/URL
 * snapshot SYNCHRONOUSLY at promise resolution — zero added waits, which is
 * exactly what makes ADR 0002 rule 2 (resolve only after the visible commit)
 * testable. Set failNextBridge to arm the StoreProvider UI-sync failure hook
 * just before the call.
 */
export async function callTool(
  page: Page,
  name: string,
  args: Record<string, unknown>,
  opts: { failNextBridge?: boolean } = {},
): Promise<CallOutcome> {
  return page.evaluate(
    async ({ name, args, failNextBridge }) => {
      const snap = () => ({
        url: location.href,
        pathname: location.pathname,
        search: location.search,
        productCards: Array.from(document.querySelectorAll('[data-testid^="product-card-"]')).map((e) =>
          e.getAttribute('data-product-id'),
        ),
        emptyState: !!document.querySelector('[data-testid="store-empty"]'),
        compareView: !!document.querySelector('[data-testid="store-compare"]'),
        drawerOpen: !!document.querySelector('[data-testid="cart-drawer"][data-open="true"]'),
        cartCount:
          document.querySelector('[data-testid="cart-count"]')?.textContent?.trim() ?? null,
        noticeText:
          document.querySelector('[data-testid="store-error-notice"]')?.textContent ?? null,
      });
      if (failNextBridge) (window as any).__strideBridgeFailNext = true;
      const env = await (document as any).modelContext.callTool(name, args);
      // Captured in the same task as resolution — NO waits of any kind.
      return { env, snapshot: snap() };
    },
    { name, args, failNextBridge: opts.failNextBridge ?? false },
  );
}

/** Read authoritative cart state through the page's own session cookie. */
export async function apiCart(page: Page): Promise<any> {
  return page.evaluate(() => fetch('/api/store/cart').then((r) => r.json()));
}

/** Fresh session (empty cart + empty idempotency ledger). */
export async function resetSession(page: Page): Promise<void> {
  await page.evaluate(() => fetch('/api/store/session/reset', { method: 'POST' }).then((r) => r.json()));
}

/** Exact class-specific partial_failure warnings (contracts §5). */
export const WARNING_MUTATION =
  'STATE CHANGED — do not repeat this mutation with a new key. Retry with the SAME idempotencyKey, or call get_cart.';
export const WARNING_READONLY =
  'UI sync failed; no state changed — safe to retry this call.';

export const ALL_TOOLS = [
  'search_products',
  'compare_bikes',
  'get_cart',
  'add_to_cart',
  'update_cart_item',
  'remove_from_cart',
] as const;

export const READ_ONLY_TOOLS = ['search_products', 'compare_bikes', 'get_cart'] as const;

/**
 * Validate the contracts §5 result envelope. The MCP-host `content` text
 * mirror is the one permitted extra key (documented in webmcp/tools.js).
 */
export function expectEnvelope(env: any): void {
  if (!env || typeof env !== 'object') throw new Error('envelope is not an object');
  const keys = Object.keys(env).filter((k) => k !== 'content');
  const allow = (allowed: string[]) => {
    const extra = keys.filter((k) => !allowed.includes(k));
    if (extra.length) throw new Error(`envelope has unexpected keys: ${extra.join(', ')}`);
  };
  if (env.ok === true) {
    allow(['ok', 'data', 'replayed']);
    if (!('data' in env)) throw new Error('ok:true envelope missing data');
    if ('replayed' in env && env.replayed !== true) throw new Error('replayed must be true when present');
  } else if (env.ok === false) {
    allow(['ok', 'error']);
    const e = env.error;
    if (!e || typeof e.code !== 'string' || typeof e.message !== 'string' || typeof e.hint !== 'string') {
      throw new Error('ok:false envelope must carry error {code, message, hint}');
    }
  } else if (env.ok === 'partial_failure') {
    allow(['ok', 'data', 'warning']);
    if (!('data' in env) || typeof env.warning !== 'string') {
      throw new Error('partial_failure envelope must carry data + warning');
    }
  } else {
    throw new Error(`invalid envelope discriminant: ${JSON.stringify(env.ok)}`);
  }
}

/** Find two in-stock bikes + useful fixtures via the search tool itself. */
export async function findBikes(page: Page, count = 2): Promise<any[]> {
  const { env } = await callTool(page, 'search_products', { category: 'bike' });
  if (env.ok !== true) throw new Error(`fixture search failed: ${JSON.stringify(env)}`);
  const matches = env.data.matches;
  if (matches.length < count) throw new Error(`need ${count} bikes, got ${matches.length}`);
  return matches.slice(0, count);
}

export async function findAccessory(page: Page): Promise<any> {
  const { env } = await callTool(page, 'search_products', { category: 'accessory' });
  if (env.ok !== true || env.data.matches.length === 0) throw new Error('no accessory fixture found');
  return env.data.matches[0];
}
