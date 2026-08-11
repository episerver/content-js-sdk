import { test, expect } from '@playwright/test';
import {
  installModelContext,
  callTool,
  resetSession,
  expectEnvelope,
} from '../webmcp/helpers';

/**
 * Gate G1 — direct execution of every tool step in all three benchmark
 * workflows (runbook.md), 100% pass bar. Direct callTool ≙ the Inspector's
 * deterministic Run Tool fallback, so a green run here is also the recorded
 * fallback-only rehearsal of each workflow (issue 0003 acceptance 3 for the
 * locally executable part).
 *
 * Product facts are PINNED from the real catalog via the real engine
 * (store-validate gate + direct domain queries, 2026-08-10):
 *   primary  ridgeline-carbon $2399 9.4kg size56  vs sierra-alloy-gs $1749 10.6kg size56
 *   dev A    + vela-allroad-helmet $139 + bastion-chain-lock $89
 *            + lumen-pro-lights $129  → total $2756 ≤ $3000
 *   dev B    volt-commute-9 $2899 rangeKm 100 size56; volt-compatible
 *            accessories: bastion-chain-lock, urban-glide-helmet,
 *            vault-folding-lock (vela + lumen are INCOMPATIBLE — the
 *            deviation-B removal material) → final $2988 ≤ $3400
 *
 * Every workflow uses fewer than 20 mutations (ADR 0002 test obligation 6:
 * the idempotency ledger's 20-key session cap is never reached).
 */

const ALL_SIX_REGISTERED = () =>
  (document as any).modelContext?.getTools?.().length === 6;

test.beforeEach(async ({ page }) => {
  await installModelContext(page);
  await page.goto('/store');
  await resetSession(page);
  await page.goto('/store');
  // tools.js loads afterInteractive and registers asynchronously — never
  // call before all six tools exist (mirrors a real agent enumerating first)
  await page.waitForFunction(ALL_SIX_REGISTERED, undefined, { timeout: 10_000 });
});

test('G1 primary — Find My Bike (search → compare → add best fit → cart)', async ({ page }) => {
  let mutations = 0;

  // 1. search: bikes only, gravel, ≤$2600, 178cm rider, prefer lighter
  const s1 = await callTool(page, 'search_products', {
    category: 'bike',
    discipline: 'gravel',
    maxPriceUsd: 2600,
    riderHeightCm: 178,
    preferences: { prioritizeWeight: true },
  });
  expectEnvelope(s1.env);
  expect(s1.env.ok).toBe(true);
  expect(s1.env.data.matches.map((m: any) => m.product.id)).toEqual([
    'ridgeline-carbon',
    'sierra-alloy-gs',
  ]);
  expect(s1.env.data.matches[0].recommendedFrameSize).toBe('56');
  expect(s1.snapshot.pathname).toBe('/store');
  expect(s1.snapshot.search).toContain('discipline=gravel');
  expect(s1.snapshot.productCards).toEqual(['ridgeline-carbon', 'sierra-alloy-gs']);

  // 2. compare the top two, rider height carried
  const s2 = await callTool(page, 'compare_bikes', {
    ids: ['ridgeline-carbon', 'sierra-alloy-gs'],
    riderHeightCm: 178,
  });
  expectEnvelope(s2.env);
  expect(s2.env.ok).toBe(true);
  const weightDelta = s2.env.data.deltas.find((d: any) => d.field === 'weightKg');
  expect(weightDelta?.bestId).toBe('ridgeline-carbon'); // "the lighter one"
  expect(s2.snapshot.pathname).toBe('/store/compare');
  expect(s2.snapshot.compareView).toBe(true);
  expect(s2.snapshot.search).toContain('ridgeline-carbon');
  expect(s2.snapshot.search).toContain('sierra-alloy-gs');

  // 3. add the lighter one in the recommended size
  const s3 = await callTool(page, 'add_to_cart', {
    productId: 'ridgeline-carbon',
    frameSize: '56',
    quantity: 1,
    idempotencyKey: 'g1-primary-add-001',
  });
  mutations++;
  expectEnvelope(s3.env);
  expect(s3.env.ok).toBe(true);
  expect(s3.env.data.replayed).toBe(false);
  expect(s3.env.data.cart.subtotalUsd).toBe(2399);
  expect(s3.snapshot.drawerOpen).toBe(true);
  expect(s3.snapshot.cartCount).toBe('1');

  // 4. durable cart review
  const s4 = await callTool(page, 'get_cart', {});
  expectEnvelope(s4.env);
  expect(s4.env.ok).toBe(true);
  expect(s4.env.data.items).toHaveLength(1);
  expect(s4.env.data.items[0].cartItemId).toBe('ridgeline-carbon:56');
  expect(s4.snapshot.pathname).toBe('/store/cart');

  expect(mutations).toBeLessThan(20);
});

test('G1 deviation A — complete compatible setup under $3,000', async ({ page }) => {
  let mutations = 0;
  const add = async (productId: string, frameSize: string | undefined, key: string) => {
    const args: Record<string, unknown> = { productId, idempotencyKey: key };
    if (frameSize) args.frameSize = frameSize;
    const r = await callTool(page, 'add_to_cart', args);
    mutations++;
    expectEnvelope(r.env);
    expect(r.env.ok).toBe(true);
    expect(r.snapshot.drawerOpen).toBe(true);
    return r;
  };

  // 1. bike under the setup budget
  const s1 = await callTool(page, 'search_products', {
    category: 'bike',
    discipline: 'gravel',
    maxPriceUsd: 2600,
    riderHeightCm: 178,
    preferences: { prioritizeWeight: true },
  });
  expect(s1.env.ok).toBe(true);
  expect(s1.env.data.matches[0].product.id).toBe('ridgeline-carbon');

  // 2. add the bike
  const s2 = await add('ridgeline-carbon', '56', 'g1-devA-add-bike-001');
  expect(s2.snapshot.cartCount).toBe('1');

  // 3. accessories compatible with THAT bike, within remaining budget ($601)
  const s3 = await callTool(page, 'search_products', {
    category: 'accessory',
    compatibleWithProductId: 'ridgeline-carbon',
    maxPriceUsd: 601,
  });
  expect(s3.env.ok).toBe(true);
  const ids = s3.env.data.matches.map((m: any) => m.product.id);
  for (const want of ['vela-allroad-helmet', 'bastion-chain-lock', 'lumen-pro-lights']) {
    expect(ids).toContain(want);
  }
  expect(s3.snapshot.pathname).toBe('/store');

  // 4-6. helmet, lock, lights
  await add('vela-allroad-helmet', undefined, 'g1-devA-add-helmet-001');
  await add('bastion-chain-lock', undefined, 'g1-devA-add-lock-001');
  const s6 = await add('lumen-pro-lights', undefined, 'g1-devA-add-lights-001');
  expect(s6.snapshot.cartCount).toBe('4');

  // 7. review: 4 items, all compatible, total ≤ $3,000
  const s7 = await callTool(page, 'get_cart', {});
  expect(s7.env.ok).toBe(true);
  expect(s7.env.data.items).toHaveLength(4);
  expect(s7.env.data.subtotalUsd).toBe(2756);
  expect(s7.env.data.subtotalUsd).toBeLessThanOrEqual(3000);
  expect(s7.snapshot.pathname).toBe('/store/cart');

  expect(mutations).toBeLessThan(20);
});

test('G1 deviation B — cart surgery: e-bike ≥80km swap, drop incompatible, ≤ $3,400', async ({ page }) => {
  let mutations = 0;
  const mutate = async (tool: string, args: Record<string, unknown>) => {
    const r = await callTool(page, tool, args);
    mutations++;
    expectEnvelope(r.env);
    expect(r.env.ok).toBe(true);
    expect(r.snapshot.drawerOpen).toBe(true);
    return r;
  };

  // scripted preload = deviation A's cart (runbook: "or scripted preload")
  await mutate('add_to_cart', { productId: 'ridgeline-carbon', frameSize: '56', idempotencyKey: 'g1-devB-pre-001' });
  await mutate('add_to_cart', { productId: 'vela-allroad-helmet', idempotencyKey: 'g1-devB-pre-002' });
  await mutate('add_to_cart', { productId: 'bastion-chain-lock', idempotencyKey: 'g1-devB-pre-003' });
  await mutate('add_to_cart', { productId: 'lumen-pro-lights', idempotencyKey: 'g1-devB-pre-004' });

  // 1. inspect the cart
  const s1 = await callTool(page, 'get_cart', {});
  expect(s1.env.ok).toBe(true);
  expect(s1.env.data.items).toHaveLength(4);
  expect(s1.env.data.subtotalUsd).toBe(2756);

  // 2. find the e-bike: ≥80 km range, fits the rider, within the swap budget
  const s2 = await callTool(page, 'search_products', {
    category: 'bike',
    discipline: 'e-bike',
    minRangeKm: 80,
    riderHeightCm: 178,
    maxPriceUsd: 3043, // $3,400 − $357 of kept accessories
  });
  expect(s2.env.ok).toBe(true);
  expect(s2.env.data.matches[0].product.id).toBe('volt-commute-9');
  expect(s2.env.data.matches[0].product.rangeKm).toBeGreaterThanOrEqual(80);
  expect(s2.env.data.matches[0].recommendedFrameSize).toBe('56');

  // 3-4. swap the bike
  await mutate('remove_from_cart', { cartItemId: 'ridgeline-carbon:56', idempotencyKey: 'g1-devB-remove-bike-001' });
  await mutate('add_to_cart', { productId: 'volt-commute-9', frameSize: '56', idempotencyKey: 'g1-devB-add-ebike-001' });

  // 5-6. drop the accessories that do not fit the e-bike
  await mutate('remove_from_cart', { cartItemId: 'vela-allroad-helmet', idempotencyKey: 'g1-devB-remove-helmet-001' });
  const s6 = await mutate('remove_from_cart', { cartItemId: 'lumen-pro-lights', idempotencyKey: 'g1-devB-remove-lights-001' });
  expect(s6.snapshot.cartCount).toBe('2');

  // 7. review: e-bike + only compatible items, under budget
  const s7 = await callTool(page, 'get_cart', {});
  expect(s7.env.ok).toBe(true);
  const finalIds = s7.env.data.items.map((i: any) => i.cartItemId).sort();
  expect(finalIds).toEqual(['bastion-chain-lock', 'volt-commute-9:56']);
  expect(s7.env.data.subtotalUsd).toBe(2988);
  expect(s7.env.data.subtotalUsd).toBeLessThanOrEqual(3400);
  expect(s7.snapshot.pathname).toBe('/store/cart');

  expect(mutations).toBeLessThan(20); // 8 total incl. preload — ledger cap never reached
});
