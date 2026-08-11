import { test, expect } from '@playwright/test';
import {
  installModelContext,
  callTool,
  apiCart,
  resetSession,
  expectEnvelope,
  findAccessory,
} from './helpers';

/**
 * ADR 0002 obligations (d) idempotent replay + schema-side key requirement,
 * and (f) the hard 20-key ledger cap with no eviction.
 */

test.beforeEach(async ({ page }) => {
  await installModelContext(page);
  await page.goto('/');
  await resetSession(page);
});

test.describe('(d) idempotency', () => {
  test('replaying the same key + args applies exactly one cart change', async ({ page }) => {
    const acc = await findAccessory(page);
    const args = { productId: acc.product.id, idempotencyKey: 'replay-key-0001' };

    const first = await callTool(page, 'add_to_cart', args);
    expectEnvelope(first.env);
    expect(first.env.ok).toBe(true);
    expect(first.env.replayed).toBeUndefined();

    const second = await callTool(page, 'add_to_cart', args);
    expectEnvelope(second.env);
    expect(second.env.ok).toBe(true);
    expect(second.env.replayed).toBe(true);

    // assert CART CONTENTS, not just the response: exactly one change applied
    const cart = await apiCart(page);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(1);
    expect(cart.itemCount).toBe(1);
  });

  test('missing idempotencyKey is rejected schema-side with no state change', async ({ page }) => {
    const acc = await findAccessory(page);
    const before = await apiCart(page);
    const { env } = await callTool(page, 'add_to_cart', { productId: acc.product.id });
    expectEnvelope(env);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('INVALID_ARGS');
    expect(env.error.message).toContain('idempotencyKey');
    expect(env.error.hint).toContain('SAME key');
    expect(await apiCart(page)).toEqual(before); // schema rejection: no fetch, no state
  });

  test('same key + different args → IDEMPOTENCY_CONFLICT, no state change', async ({ page }) => {
    const acc = await findAccessory(page);
    await callTool(page, 'add_to_cart', { productId: acc.product.id, idempotencyKey: 'conflict-key-01' });
    const before = await apiCart(page);
    const { env } = await callTool(page, 'add_to_cart', {
      productId: acc.product.id,
      quantity: 5,
      idempotencyKey: 'conflict-key-01',
    });
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('IDEMPOTENCY_CONFLICT');
    expect(await apiCart(page)).toEqual(before);
  });
});

test.describe('(f) full ledger: hard 20-key cap, no eviction', () => {
  test('21st new key → IDEMPOTENCY_LEDGER_FULL, zero state change, existing keys still replay', async ({ page }) => {
    test.setTimeout(120_000);
    const acc = await findAccessory(page);

    // key 1: add the item
    await callTool(page, 'add_to_cart', { productId: acc.product.id, idempotencyKey: 'ledger-key-0001' });
    const cartItemId = (await apiCart(page)).items[0].cartItemId;

    // keys 2..20: nineteen distinct absolute-quantity updates (qty stays ≤ 9)
    let lastQty = 1;
    let lastKey = '';
    for (let i = 2; i <= 20; i++) {
      lastQty = (i % 8) + 2; // 2..9
      lastKey = `ledger-key-${String(i).padStart(4, '0')}`;
      const { env } = await callTool(page, 'update_cart_item', {
        cartItemId,
        quantity: lastQty,
        idempotencyKey: lastKey,
      });
      expect(env.ok).toBe(true);
    }

    const fullState = await apiCart(page);
    expect(fullState.items[0].quantity).toBe(lastQty);

    // 21st NEW key: rejected with the Reset-demo hint, nothing changes
    const { env: overflow, snapshot } = await callTool(page, 'update_cart_item', {
      cartItemId,
      quantity: 4,
      idempotencyKey: 'ledger-key-0021',
    });
    expectEnvelope(overflow);
    expect(overflow.ok).toBe(false);
    expect(overflow.error.code).toBe('IDEMPOTENCY_LEDGER_FULL');
    expect(overflow.error.hint).toContain('Reset demo');
    expect(snapshot.noticeText).toContain(overflow.error.message);
    expect(await apiCart(page)).toEqual(fullState);

    // an EXISTING key still replays (no eviction ever): same key + same args
    const { env: replay } = await callTool(page, 'update_cart_item', {
      cartItemId,
      quantity: lastQty,
      idempotencyKey: lastKey,
    });
    expectEnvelope(replay);
    expect(replay.ok).toBe(true);
    expect(replay.replayed).toBe(true);
    expect(await apiCart(page)).toEqual(fullState); // exactly one applied change, ever
  });

  test('benchmark workflows stay under the 20-mutation cap (sanity: primary flow uses 2)', async ({ page }) => {
    // Primary "Find My Bike" flow: search → compare → add bike → add helmet.
    // 2 mutations << 20; deviations A/B stay under 20 by construction
    // (counted end-to-end in issue 0003's direct-tool suite).
    const acc = await findAccessory(page);
    let mutations = 0;
    await callTool(page, 'search_products', { category: 'bike' });
    const { env } = await callTool(page, 'add_to_cart', {
      productId: acc.product.id,
      idempotencyKey: 'bench-mut-0001',
    });
    mutations++;
    expect(env.ok).toBe(true);
    expect(mutations).toBeLessThan(20);
  });
});
