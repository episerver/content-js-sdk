import { test, expect } from '@playwright/test';
import {
  installModelContext,
  callTool,
  apiCart,
  resetSession,
  expectEnvelope,
  findBikes,
  findAccessory,
} from './helpers';

/**
 * ADR 0002 obligations (a), (b), (c) + issue 0002 acceptance criterion 6:
 * per tool, BOTH channels are asserted at the moment the tool promise
 * resolves, with no added waits (the snapshot is captured synchronously at
 * resolution inside the page — see helpers.callTool). Failures change no
 * API/cart/URL state AND render the Stride error notice matching the
 * structured error. Empty search is ok:true + URL update + empty state.
 */

test.beforeEach(async ({ page }) => {
  await installModelContext(page);
  await page.goto('/');
  await resetSession(page);
});

test.describe('(a) both channels at resolution, per tool', () => {
  test('search_products: envelope + URL/results grid at resolution', async ({ page }) => {
    const { env, snapshot } = await callTool(page, 'search_products', { category: 'bike' });
    expectEnvelope(env);
    expect(env.ok).toBe(true);
    expect(env.data.matches.length).toBeGreaterThan(0);
    // visible channel, captured with zero added waits:
    expect(snapshot.pathname).toBe('/store');
    expect(snapshot.productCards.length).toBeGreaterThan(0);
    expect(snapshot.productCards).toContain(env.data.matches[0].product.id);
  });

  test('compare_bikes: envelope + /store/compare URL + view at resolution', async ({ page }) => {
    const [a, b] = await findBikes(page, 2);
    const { env, snapshot } = await callTool(page, 'compare_bikes', {
      ids: [a.product.id, b.product.id],
    });
    expectEnvelope(env);
    expect(env.ok).toBe(true);
    expect(env.data.products).toHaveLength(2);
    expect(snapshot.pathname).toBe('/store/compare');
    expect(snapshot.search).toContain('ids=');
    expect(snapshot.compareView).toBe(true);
  });

  test('get_cart: envelope + cart page surface at resolution', async ({ page }) => {
    const { env, snapshot } = await callTool(page, 'get_cart', {});
    expectEnvelope(env);
    expect(env.ok).toBe(true);
    expect(env.data).toMatchObject({ items: [], itemCount: 0, subtotalUsd: 0 });
    expect(typeof env.data.sessionId).toBe('string');
    expect(snapshot.pathname).toBe('/store/cart');
  });

  test('add_to_cart: envelope + open drawer + cart count at resolution + API state', async ({ page }) => {
    const acc = await findAccessory(page);
    const { env, snapshot } = await callTool(page, 'add_to_cart', {
      productId: acc.product.id,
      idempotencyKey: 'dual-add-0001',
    });
    expectEnvelope(env);
    expect(env.ok).toBe(true);
    expect(env.data.cart.itemCount).toBe(1);
    expect(snapshot.drawerOpen).toBe(true);
    expect(snapshot.cartCount).toBe('1');
    const cart = await apiCart(page);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe(acc.product.id);
  });

  test('update_cart_item: absolute quantity + drawer at resolution + API state', async ({ page }) => {
    const acc = await findAccessory(page);
    await callTool(page, 'add_to_cart', { productId: acc.product.id, idempotencyKey: 'dual-add-0002' });
    const cartItemId = (await apiCart(page)).items[0].cartItemId;

    const { env, snapshot } = await callTool(page, 'update_cart_item', {
      cartItemId,
      quantity: 3,
      idempotencyKey: 'dual-upd-0001',
    });
    expectEnvelope(env);
    expect(env.ok).toBe(true);
    expect(snapshot.drawerOpen).toBe(true);
    const cart = await apiCart(page);
    expect(cart.items[0].quantity).toBe(3); // absolute, not incremental
  });

  test('remove_from_cart: envelope + drawer at resolution + API state', async ({ page }) => {
    const acc = await findAccessory(page);
    await callTool(page, 'add_to_cart', { productId: acc.product.id, idempotencyKey: 'dual-add-0003' });
    const cartItemId = (await apiCart(page)).items[0].cartItemId;

    const { env, snapshot } = await callTool(page, 'remove_from_cart', {
      cartItemId,
      idempotencyKey: 'dual-rem-0001',
    });
    expectEnvelope(env);
    expect(env.ok).toBe(true);
    expect(env.data.changed).toMatchObject({ cartItemId, removed: true });
    expect(snapshot.drawerOpen).toBe(true);
    expect((await apiCart(page)).items).toHaveLength(0);
  });
});

test.describe('(b) failure: no state change + synchronized error notice', () => {
  test('add_to_cart unknown product: PRODUCT_NOT_FOUND, notice at resolution, zero state change', async ({ page }) => {
    const before = await apiCart(page);
    const urlBefore = page.url();
    const { env, snapshot } = await callTool(page, 'add_to_cart', {
      productId: 'no-such-product-xyz',
      idempotencyKey: 'fail-add-0001',
    });
    expectEnvelope(env);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('PRODUCT_NOT_FOUND');
    expect(env.error.hint.length).toBeGreaterThan(0);
    // visible channel: the notice matches the structured error, at resolution
    expect(snapshot.noticeText).toBeTruthy();
    expect(snapshot.noticeText).toContain(env.error.message);
    // no state change: API cart, URL
    expect(await apiCart(page)).toEqual(before);
    expect(page.url()).toBe(urlBefore);
    expect(snapshot.drawerOpen).toBe(false);
  });

  test('read-only failure (compare on an accessory): notice shown, drawer never opens', async ({ page }) => {
    const acc = await findAccessory(page);
    const [bike] = await findBikes(page, 1);
    const { env, snapshot } = await callTool(page, 'compare_bikes', {
      ids: [bike.product.id, acc.product.id],
    });
    expectEnvelope(env);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('COMPARE_NOT_A_BIKE');
    expect(snapshot.noticeText).toContain(env.error.message);
    expect(snapshot.drawerOpen).toBe(false);
  });
});

test.describe('(c) empty search is success', () => {
  test('no-match search: ok:true, URL updated, empty state rendered', async ({ page }) => {
    const { env, snapshot } = await callTool(page, 'search_products', { maxPriceUsd: 1 });
    expectEnvelope(env);
    expect(env.ok).toBe(true);
    expect(env.data.total).toBe(0);
    expect(env.data.matches).toEqual([]);
    expect(snapshot.pathname).toBe('/store'); // URL still updates
    expect(snapshot.emptyState).toBe(true); // normal empty state, not an error
    expect(snapshot.noticeText).toBeNull();
  });
});

test.describe('corrective hints on every documented failure (criterion 6)', () => {
  test('unavailable frame size → VARIANT_UNAVAILABLE with in-stock hint', async ({ page }) => {
    // pick a bike + a frame size that is NOT among its in-stock variants
    const { env: search } = await callTool(page, 'search_products', { category: 'bike', inStockOnly: false });
    const allSizes = ['48', '50', '52', '54', '56', '58', '60', '62'];
    let bikeId: string | undefined;
    let missingSize: string | undefined;
    for (const m of search.data.matches) {
      const stocked = new Set(
        (m.product.variants ?? []).filter((v: any) => v.inStock).map((v: any) => v.frameSize),
      );
      const candidate = allSizes.find((s) => !stocked.has(s));
      if (candidate) {
        bikeId = m.product.id;
        missingSize = candidate;
        break;
      }
    }
    expect(bikeId, 'fixture guarantee: some bike lacks some in-stock size').toBeTruthy();
    const { env } = await callTool(page, 'add_to_cart', {
      productId: bikeId!,
      frameSize: missingSize!,
      idempotencyKey: 'hint-var-0001',
    });
    expect(env.ok).toBe(false);
    expect(['VARIANT_UNAVAILABLE', 'OUT_OF_STOCK']).toContain(env.error.code);
    expect(env.error.hint.length).toBeGreaterThan(0);
  });

  test('absent cart item → CART_ITEM_NOT_FOUND with corrective hint', async ({ page }) => {
    for (const call of [
      { name: 'update_cart_item', args: { cartItemId: 'ghost-item:56', quantity: 2, idempotencyKey: 'hint-upd-0001' } },
      { name: 'remove_from_cart', args: { cartItemId: 'ghost-item:56', idempotencyKey: 'hint-rem-0001' } },
    ]) {
      const { env, snapshot } = await callTool(page, call.name, call.args);
      expect(env.ok).toBe(false);
      expect(env.error.code).toBe('CART_ITEM_NOT_FOUND');
      expect(env.error.hint.length).toBeGreaterThan(0);
      expect(snapshot.noticeText).toContain(env.error.message);
    }
  });

  test('over-budget compatibility miss → empty ok result, never an error', async ({ page }) => {
    const [bike] = await findBikes(page, 1);
    const { env } = await callTool(page, 'search_products', {
      compatibleWithProductId: bike.product.id,
      maxPriceUsd: 1,
    });
    expect(env.ok).toBe(true); // "empty is not failure" (ADR 0002)
    expect(env.data.total).toBe(0);
  });
});
