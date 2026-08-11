import { describe, expect, it } from 'vitest';
import {
  StoreErrorException,
  addToCart,
  compareProducts,
  getCart,
  resetSession,
  updateCartItem,
} from '../domain';
import type { StoreState } from '../domain';

function errOf(fn: () => unknown): StoreErrorException {
  try {
    fn();
  } catch (e) {
    if (e instanceof StoreErrorException) return e;
    throw e;
  }
  throw new Error('expected a StoreError');
}

describe('cart rules (contracts §2)', () => {
  it('bikes require an in-stock variant; hint lists in-stock sizes', () => {
    const s0 = resetSession();
    const err = errOf(() =>
      addToCart(s0, { productId: 'ridgeline-carbon', frameSize: '60' }, 'key-000000001'),
    );
    expect(err.code).toBe('VARIANT_UNAVAILABLE');
    expect(err.hint).toBe('size 60 unavailable for ridgeline-carbon; in stock: 52, 54, 56, 58');

    const missing = errOf(() => addToCart(s0, { productId: 'ridgeline-carbon' }, 'key-000000002'));
    expect(missing.code).toBe('INVALID_ARGS');
    expect(missing.hint).toContain('52, 54, 56, 58');
  });

  it('accessories reject frameSize; unknown product is PRODUCT_NOT_FOUND', () => {
    const s0 = resetSession();
    expect(
      errOf(() =>
        addToCart(s0, { productId: 'bastion-chain-lock', frameSize: '54' }, 'key-000000003'),
      ).code,
    ).toBe('INVALID_ARGS');
    expect(errOf(() => addToCart(s0, { productId: 'ghost-bike-99' }, 'key-000000004')).code).toBe(
      'PRODUCT_NOT_FOUND',
    );
  });

  it('quantity caps at 9 per item (CART_LIMIT, no state change)', () => {
    const s0 = resetSession();
    const added = addToCart(s0, { productId: 'bastion-chain-lock', quantity: 9 }, 'key-000000005');
    const err = errOf(() =>
      addToCart(added.state, { productId: 'bastion-chain-lock', quantity: 1 }, 'key-000000006'),
    );
    expect(err.code).toBe('CART_LIMIT');
    expect(getCart(added.state).itemCount).toBe(9);

    const patchErr = errOf(() =>
      updateCartItem(added.state, 'bastion-chain-lock', 10, 'key-000000007'),
    );
    expect(patchErr.code).toBe('CART_LIMIT');
  });

  it('cart caps at 20 distinct items (CART_LIMIT)', () => {
    const s0 = resetSession();
    const items = Array.from({ length: 20 }, (_, i) => ({
      productId: `filler-item-${String(i).padStart(2, '0')}`,
      quantity: 1,
    }));
    const full: StoreState = { ...s0, cart: { items } };
    const err = errOf(() => addToCart(full, { productId: 'bastion-chain-lock' }, 'key-000000008'));
    expect(err.code).toBe('CART_LIMIT');
    expect(err.message).toContain('20');
  });

  it('cartItemId is deterministic: productId[:frameSize]', () => {
    let state = resetSession();
    state = addToCart(state, { productId: 'ridgeline-carbon', frameSize: '56' }, 'key-00000000a')
      .state;
    state = addToCart(state, { productId: 'bastion-chain-lock' }, 'key-00000000b').state;
    expect(getCart(state).items.map(i => i.cartItemId)).toEqual([
      'ridgeline-carbon:56',
      'bastion-chain-lock',
    ]);
  });

  it('derives prices, line totals and subtotal from the catalog', () => {
    let state = resetSession();
    state = addToCart(state, { productId: 'ridgeline-carbon', frameSize: '56' }, 'key-00000000c')
      .state;
    state = addToCart(state, { productId: 'bastion-chain-lock', quantity: 2 }, 'key-00000000d')
      .state;
    const cart = getCart(state);
    expect(cart.subtotalUsd).toBe(2399 + 2 * 89);
    expect(cart.itemCount).toBe(3);
    expect(cart.items[0].name).toBe('Ridgeline Carbon');
  });
});

describe('compareProducts (contracts §2)', () => {
  it('rejects wrong arity and non-bikes', () => {
    expect(errOf(() => compareProducts(['ridgeline-carbon'])).code).toBe('COMPARE_ARITY');
    expect(
      errOf(() =>
        compareProducts(['aero-strada-rs', 'paceline-105', 'corsa-endurance', 'ridgeline-carbon']),
      ).code,
    ).toBe('COMPARE_ARITY');
    expect(errOf(() => compareProducts(['ridgeline-carbon', 'bastion-chain-lock'])).code).toBe(
      'COMPARE_NOT_A_BIKE',
    );
    expect(errOf(() => compareProducts(['ridgeline-carbon', 'ghost-bike-99'])).code).toBe(
      'PRODUCT_NOT_FOUND',
    );
  });

  it('computes deltas with bestId and reason codes', () => {
    const c = compareProducts(['ridgeline-carbon', 'sierra-alloy-gs'], 178);
    const byField = Object.fromEntries(c.deltas.map(d => [d.field, d]));
    expect(byField.priceUsd.bestId).toBe('sierra-alloy-gs');
    expect(byField.priceUsd.reasonCode).toBe('DELTA_CHEAPER');
    expect(byField.weightKg.bestId).toBe('ridgeline-carbon');
    expect(byField.weightKg.reasonCode).toBe('DELTA_LIGHTER');
    expect(byField.fit.values['ridgeline-carbon']).toBe('56');
    expect(byField.rangeKm).toBeUndefined(); // no e-bike in this comparison
  });

  it('includes rangeKm delta when an e-bike participates', () => {
    const c = compareProducts(['volt-commute-9', 'pulse-ebike-45', 'ridgeline-carbon']);
    const range = c.deltas.find(d => d.field === 'rangeKm')!;
    expect(range.values['ridgeline-carbon']).toBeNull();
    expect(range.bestId).toBe('volt-commute-9');
    expect(range.reasonCode).toBe('DELTA_RANGE_LONGER');
  });
});
