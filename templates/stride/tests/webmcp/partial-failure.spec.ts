import { test, expect } from '@playwright/test';
import {
  installModelContext,
  callTool,
  apiCart,
  resetSession,
  expectEnvelope,
  findBikes,
  findAccessory,
  WARNING_MUTATION,
  WARNING_READONLY,
} from './helpers';

/**
 * ADR 0002 obligation (e): with UI sync artificially broken via the
 * StoreProvider test hook `window.__strideBridgeFailNext = true` (contract
 * in docs/storefront-v2/integration-notes-0002.md §3 — the NEXT
 * showSearch/showComparison/showCart call rejects once, then the flag
 * clears, so the tool's single re-sync succeeds), each tool class re-syncs
 * its OWN surface, returns partial_failure with its EXACT class warning,
 * the API state shows the operation applied exactly once, and a subsequent
 * get_cart reconciles the UI.
 */

test.beforeEach(async ({ page }) => {
  await installModelContext(page);
  await page.goto('/');
  await resetSession(page);
});

test('search_products: read-only warning, search surface re-synced', async ({ page }) => {
  const { env, snapshot } = await callTool(
    page,
    'search_products',
    { category: 'bike' },
    { failNextBridge: true },
  );
  expectEnvelope(env);
  expect(env.ok).toBe('partial_failure');
  expect(env.warning).toBe(WARNING_READONLY);
  expect(env.data.matches.length).toBeGreaterThan(0);
  // the single re-sync (same result) succeeded: search surface is current
  expect(snapshot.pathname).toBe('/store');
  expect(snapshot.productCards.length).toBeGreaterThan(0);
});

test('compare_bikes: read-only warning, comparison re-synced', async ({ page }) => {
  const [a, b] = await findBikes(page, 2);
  const { env, snapshot } = await callTool(
    page,
    'compare_bikes',
    { ids: [a.product.id, b.product.id] },
    { failNextBridge: true },
  );
  expectEnvelope(env);
  expect(env.ok).toBe('partial_failure');
  expect(env.warning).toBe(WARNING_READONLY);
  expect(snapshot.pathname).toBe('/store/compare');
  expect(snapshot.compareView).toBe(true);
});

test('get_cart: read-only warning, cart re-fetched and re-synced', async ({ page }) => {
  const { env, snapshot } = await callTool(page, 'get_cart', {}, { failNextBridge: true });
  expectEnvelope(env);
  expect(env.ok).toBe('partial_failure');
  expect(env.warning).toBe(WARNING_READONLY);
  expect(snapshot.pathname).toBe('/store/cart');
});

test('mutation: mutation warning, applied EXACTLY once, get_cart reconciles', async ({ page }) => {
  const acc = await findAccessory(page);
  const { env, snapshot } = await callTool(
    page,
    'add_to_cart',
    { productId: acc.product.id, idempotencyKey: 'pfail-add-0001' },
    { failNextBridge: true },
  );
  expectEnvelope(env);
  expect(env.ok).toBe('partial_failure');
  expect(env.warning).toBe(WARNING_MUTATION);
  expect(env.data.cart.itemCount).toBe(1);
  // re-sync path re-fetched the authoritative cart and showed it
  expect(snapshot.drawerOpen).toBe(true);
  expect(snapshot.cartCount).toBe('1');

  // API state: the operation applied exactly once
  const cart = await apiCart(page);
  expect(cart.items).toHaveLength(1);
  expect(cart.items[0].quantity).toBe(1);

  // retrying with the SAME key (per the warning) does not double-apply
  const retry = await callTool(page, 'add_to_cart', {
    productId: acc.product.id,
    idempotencyKey: 'pfail-add-0001',
  });
  expect(retry.env.ok).toBe(true);
  expect(retry.env.replayed).toBe(true);
  expect((await apiCart(page)).items[0].quantity).toBe(1);

  // and a subsequent get_cart reconciles the UI
  const reconcile = await callTool(page, 'get_cart', {});
  expectEnvelope(reconcile.env);
  expect(reconcile.env.ok).toBe(true);
  expect(reconcile.env.data.itemCount).toBe(1);
  expect(reconcile.snapshot.pathname).toBe('/store/cart');
  expect(reconcile.snapshot.cartCount).toBe('1');
});
