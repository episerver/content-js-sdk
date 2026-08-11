import { describe, expect, it } from 'vitest';
import {
  StoreErrorException,
  addToCart,
  getCart,
  removeFromCart,
  resetSession,
  updateCartItem,
} from '../domain';
import type { StoreState } from '../domain';

const KEY = 'test-key-0001';

function codeOf(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof StoreErrorException) return e.code;
    throw e;
  }
  throw new Error('expected a StoreError');
}

describe('idempotency (acceptance 7, ADR 0002)', () => {
  it('replay with same key + same args applies exactly once', () => {
    const s0 = resetSession();
    const first = addToCart(s0, { productId: 'bastion-chain-lock', quantity: 2 }, KEY);
    expect(first.result.replayed).toBe(false);
    expect(first.result.cart.itemCount).toBe(2);

    const replay = addToCart(first.state, { productId: 'bastion-chain-lock', quantity: 2 }, KEY);
    expect(replay.result.replayed).toBe(true);
    expect(replay.result.cart.itemCount).toBe(2); // nothing re-applied
    expect(replay.state).toBe(first.state); // no state change
    expect(replay.result.changed).toMatchObject({ cartItemId: 'bastion-chain-lock', quantity: 2 });
  });

  it('missing key is rejected with no state change', () => {
    const s0 = resetSession();
    expect(codeOf(() => addToCart(s0, { productId: 'bastion-chain-lock' }, ''))).toBe(
      'IDEMPOTENCY_KEY_REQUIRED',
    );
    expect(codeOf(() => addToCart(s0, { productId: 'bastion-chain-lock' }, undefined as never))).toBe(
      'IDEMPOTENCY_KEY_REQUIRED',
    );
    expect(getCart(s0).items).toHaveLength(0);
  });

  it('malformed key is INVALID_ARGS', () => {
    const s0 = resetSession();
    expect(codeOf(() => addToCart(s0, { productId: 'bastion-chain-lock' }, 'short'))).toBe(
      'INVALID_ARGS',
    );
    expect(codeOf(() => addToCart(s0, { productId: 'bastion-chain-lock' }, 'has spaces!!'))).toBe(
      'INVALID_ARGS',
    );
  });

  it('same key + different args → IDEMPOTENCY_CONFLICT', () => {
    const s0 = resetSession();
    const { state } = addToCart(s0, { productId: 'bastion-chain-lock' }, KEY);
    expect(codeOf(() => addToCart(state, { productId: 'vault-folding-lock' }, KEY))).toBe(
      'IDEMPOTENCY_CONFLICT',
    );
  });

  it('failed mutations do not consume the key', () => {
    const s0 = resetSession();
    expect(codeOf(() => addToCart(s0, { productId: 'boulder-hardtail', frameSize: '54' }, KEY))).toBe(
      'OUT_OF_STOCK',
    );
    // key still usable for a corrected call
    const ok = addToCart(s0, { productId: 'bastion-chain-lock' }, KEY);
    expect(ok.result.replayed).toBe(false);
  });

  it('hard 20-key cap: new key refused with Reset hint, existing keys still replay (no eviction)', () => {
    let state: StoreState = resetSession();
    const usedCalls: { key: string; quantity: number }[] = [];

    const add = addToCart(state, { productId: 'bastion-chain-lock' }, 'seed-key-000');
    state = add.state;
    usedCalls.push({ key: 'seed-key-000', quantity: 1 });

    for (let i = 1; i < 20; i++) {
      const key = `filler-key-${String(i).padStart(3, '0')}`;
      const quantity = (i % 8) + 1;
      const res = updateCartItem(state, 'bastion-chain-lock', quantity, key);
      expect(res.result.replayed).toBe(false);
      state = res.state;
      usedCalls.push({ key, quantity });
    }
    expect(state.ledger).toHaveLength(20);

    // New key on a full ledger → 409-class refusal, no state change, Reset hint.
    let full: StoreErrorException | null = null;
    try {
      addToCart(state, { productId: 'vela-allroad-helmet' }, 'brand-new-key-x');
    } catch (e) {
      full = e as StoreErrorException;
    }
    expect(full?.code).toBe('IDEMPOTENCY_LEDGER_FULL');
    expect(full?.hint).toContain('Reset demo');
    expect(state.ledger).toHaveLength(20);
    expect(getCart(state).items.map(i => i.cartItemId)).toEqual(['bastion-chain-lock']);

    // Every recorded key remains replayable — nothing was evicted.
    const seedReplay = addToCart(state, { productId: 'bastion-chain-lock' }, 'seed-key-000');
    expect(seedReplay.result.replayed).toBe(true);
    const mid = usedCalls[10];
    const midReplay = updateCartItem(state, 'bastion-chain-lock', mid.quantity, mid.key);
    expect(midReplay.result.replayed).toBe(true);
    expect(midReplay.state).toBe(state);
  });

  it('remove replay reports removed and stays removed', () => {
    let state = resetSession();
    state = addToCart(state, { productId: 'beacon-usb-set' }, 'add-key-0001').state;
    const removed = removeFromCart(state, 'beacon-usb-set', 'rm-key-00001');
    expect(removed.result.changed).toEqual({ cartItemId: 'beacon-usb-set', removed: true });
    const replay = removeFromCart(removed.state, 'beacon-usb-set', 'rm-key-00001');
    expect(replay.result.replayed).toBe(true);
    expect(replay.result.changed).toEqual({ cartItemId: 'beacon-usb-set', removed: true });
    expect(replay.result.cart.items).toHaveLength(0);
  });
});
