import { describe, expect, it } from 'vitest';
import {
  MAX_COOKIE_BYTES,
  decodeState,
  encodeState,
  freshState,
  mintSessionId,
  worstCaseState,
} from '../codec';
import { resetSession } from '../domain';

const SECRET = process.env.STRIDE_COOKIE_SECRET!;

describe('cookie codec (contracts §2)', () => {
  it('mints 16-char base64url session ids', () => {
    for (let i = 0; i < 20; i++) {
      expect(mintSessionId()).toMatch(/^[A-Za-z0-9_-]{16}$/);
    }
  });

  it('roundtrips StoreState through the compact signed wire format', () => {
    const state = {
      ...freshState(),
      cart: {
        items: [
          { productId: 'ridgeline-carbon', frameSize: '56' as const, quantity: 1 },
          { productId: 'bastion-chain-lock', quantity: 2 },
        ],
      },
      ledger: [{ key: 'some-key-0001', argsHash: 'A1b2C3d4' }],
    };
    const decoded = decodeState(encodeState(state, SECRET), SECRET);
    expect(decoded).toEqual(state);
  });

  it('cookie value shape is payload.signature (base64url)', () => {
    const value = encodeState(freshState(), SECRET);
    expect(value).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/);
  });

  it('tampered cookie → null (fresh state), never a throw', () => {
    const value = encodeState(freshState(), SECRET);
    const flipped = (value[10] === 'A' ? 'B' : 'A') + value.slice(1);
    expect(decodeState(value.slice(0, 10) + flipped, SECRET)).toBeNull();
    expect(decodeState(`${value}x`, SECRET)).toBeNull();
    expect(decodeState('garbage', SECRET)).toBeNull();
    expect(decodeState('', SECRET)).toBeNull();
    expect(decodeState(undefined, SECRET)).toBeNull();
  });

  it('signature from a different secret is rejected', () => {
    const value = encodeState(freshState(), 'another-secret-entirely-here');
    expect(decodeState(value, SECRET)).toBeNull();
  });

  it('unknown version → null', () => {
    const state = freshState();
    const wire = { v: 2, s: state.sessionId, c: [], l: [] };
    const payload = Buffer.from(JSON.stringify(wire)).toString('base64url');
    const { createHmac } = require('node:crypto') as typeof import('node:crypto');
    const sig = createHmac('sha256', SECRET).update(payload).digest('base64url');
    expect(decodeState(`${payload}.${sig}`, SECRET)).toBeNull();
  });

  it('oversize cookie → null', () => {
    const oversize = 'a'.repeat(MAX_COOKIE_BYTES + 1);
    expect(decodeState(oversize, SECRET)).toBeNull();
  });

  it('LITERAL worst case (20 max items + 20 max ledger entries + signature) ≤ 3800 bytes', () => {
    const worst = worstCaseState();
    expect(worst.cart.items).toHaveLength(20);
    expect(worst.ledger).toHaveLength(20);
    expect(worst.cart.items.every(i => i.productId.length === 24 && i.quantity === 9)).toBe(true);
    expect(worst.ledger.every(e => e.key.length === 32 && e.argsHash.length === 8)).toBe(true);
    const value = encodeState(worst, SECRET);
    expect(Buffer.byteLength(value, 'utf8')).toBeLessThanOrEqual(MAX_COOKIE_BYTES);
    expect(decodeState(value, SECRET)).toEqual(worst); // still a valid wire state
  });

  it('resetSession returns fresh state with a new session id', () => {
    const a = resetSession();
    const b = resetSession();
    expect(a.sessionId).not.toBe(b.sessionId);
    expect(a.cart.items).toHaveLength(0);
    expect(a.ledger).toHaveLength(0);
    expect(a.v).toBe(1);
  });
});
