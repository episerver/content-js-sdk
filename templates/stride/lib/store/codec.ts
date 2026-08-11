/**
 * StoreState ⇄ WireState cookie codec — contracts.md §2.
 *
 * cookie value = base64url(JSON(WireState)) + '.' + base64url(HMAC-SHA256(payload))
 * Tamper / oversize / parse failure / unknown version → fresh state, never a 500.
 * Server-only (node:crypto).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { FrameSize, ProductId } from './catalog/types';
import { FRAME_SIZES, PRODUCT_ID_MAX, PRODUCT_ID_PATTERN } from './catalog/types';
import type { StoreState } from './engine';
import {
  CART_MAX_DISTINCT_ITEMS,
  CART_MAX_QUANTITY,
  IDEMPOTENCY_KEY_MAX,
  IDEMPOTENCY_KEY_MIN,
  IDEMPOTENCY_KEY_PATTERN,
  LEDGER_MAX_KEYS,
} from './engine';

export const STORE_COOKIE_NAME = 'stride_store';
/** Normative budget: the final encoded, signed cookie value as sent on the wire. */
export const MAX_COOKIE_BYTES = 3800;

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{16}$/;
const DIGEST8_PATTERN = /^[A-Za-z0-9_-]{8}$/;

/** WireState: short keys + tuples, nothing else (private to this codec). */
export type WireState = {
  v: 1;
  s: string; // sessionId (16 chars)
  c: [id: string, size: string, qty: number][]; // cart tuples; size '' when absent
  l: [key: string, digest8: string][]; // ledger tuples
};

export function getCookieSecret(): string {
  const secret = process.env.STRIDE_COOKIE_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'STRIDE_COOKIE_SECRET is not configured (expected ≥16 chars in the environment)',
    );
  }
  return secret;
}

/** EXACTLY 16 base64url chars, minted server-side. */
export function mintSessionId(): string {
  return randomBytes(12).toString('base64url'); // 12 bytes → 16 base64url chars
}

export function freshState(): StoreState {
  return { v: 1, sessionId: mintSessionId(), cart: { items: [] }, ledger: [] };
}

// ---------------------------------------------------------------------------
// StoreState ⇄ WireState
// ---------------------------------------------------------------------------

export function toWire(state: StoreState): WireState {
  return {
    v: 1,
    s: state.sessionId,
    c: state.cart.items.map(
      i => [i.productId, i.frameSize ?? '', i.quantity] as [string, string, number],
    ),
    l: state.ledger.map(e => [e.key, e.argsHash] as [string, string]),
  };
}

export function fromWire(wire: WireState): StoreState {
  return {
    v: 1,
    sessionId: wire.s,
    cart: {
      items: wire.c.map(([id, size, qty]) => ({
        productId: id as ProductId,
        ...(size !== '' ? { frameSize: size as FrameSize } : {}),
        quantity: qty,
      })),
    },
    ledger: wire.l.map(([key, argsHash]) => ({ key, argsHash })),
  };
}

// ---------------------------------------------------------------------------
// Sign / verify
// ---------------------------------------------------------------------------

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Serialize + sign a StoreState into the cookie value. */
export function encodeState(state: StoreState, secret: string = getCookieSecret()): string {
  const payload = Buffer.from(JSON.stringify(toWire(state)), 'utf8').toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

/**
 * Verify + deserialize a cookie value. Returns null on ANY problem —
 * missing, oversize, bad signature, parse failure, unknown version, or
 * out-of-bounds fields — so the caller mints fresh state.
 */
export function decodeState(
  cookieValue: string | undefined,
  secret: string = getCookieSecret(),
): StoreState | null {
  if (!cookieValue) return null;
  if (Buffer.byteLength(cookieValue, 'utf8') > MAX_COOKIE_BYTES) return null;
  const dot = cookieValue.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = cookieValue.slice(0, dot);
  const signature = cookieValue.slice(dot + 1);
  const expected = sign(payload, secret);
  const a = Buffer.from(signature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let wire: unknown;
  try {
    wire = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!isValidWire(wire)) return null;
  return fromWire(wire);
}

function isValidWire(wire: unknown): wire is WireState {
  if (wire === null || typeof wire !== 'object' || Array.isArray(wire)) return false;
  const w = wire as Record<string, unknown>;
  if (w.v !== 1) return false;
  if (typeof w.s !== 'string' || !SESSION_ID_PATTERN.test(w.s)) return false;
  if (!Array.isArray(w.c) || w.c.length > CART_MAX_DISTINCT_ITEMS) return false;
  for (const t of w.c) {
    if (!Array.isArray(t) || t.length !== 3) return false;
    const [id, size, qty] = t as unknown[];
    if (typeof id !== 'string' || id.length > PRODUCT_ID_MAX || !PRODUCT_ID_PATTERN.test(id)) {
      return false;
    }
    if (typeof size !== 'string' || (size !== '' && !FRAME_SIZES.includes(size as FrameSize))) {
      return false;
    }
    if (!Number.isInteger(qty) || (qty as number) < 1 || (qty as number) > CART_MAX_QUANTITY) {
      return false;
    }
  }
  if (!Array.isArray(w.l) || w.l.length > LEDGER_MAX_KEYS) return false;
  for (const t of w.l) {
    if (!Array.isArray(t) || t.length !== 2) return false;
    const [key, hash] = t as unknown[];
    if (
      typeof key !== 'string' ||
      key.length < IDEMPOTENCY_KEY_MIN ||
      key.length > IDEMPOTENCY_KEY_MAX ||
      !IDEMPOTENCY_KEY_PATTERN.test(key)
    ) {
      return false;
    }
    if (typeof hash !== 'string' || !DIGEST8_PATTERN.test(hash)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Worst-case construction (build-time assertion material, contracts §2)
// ---------------------------------------------------------------------------

/** The LITERAL worst case: 20 max-bound max-quantity items + 20 max-bound ledger entries. */
export function worstCaseState(): StoreState {
  const items = Array.from({ length: CART_MAX_DISTINCT_ITEMS }, (_, i) => ({
    // 24-char kebab-case ids, distinct, with a 2-char frame size and qty 9
    productId: `${'wxyz'.repeat(5)}-a${String(i).padStart(2, '0')}` as ProductId, // 20+1+3 = 24 chars
    frameSize: '62' as FrameSize,
    quantity: CART_MAX_QUANTITY,
  }));
  const ledger = Array.from({ length: LEDGER_MAX_KEYS }, (_, i) => ({
    key: `K${String(i).padStart(2, '0')}${'x'.repeat(IDEMPOTENCY_KEY_MAX - 3)}`, // IDEMPOTENCY_KEY_MAX chars
    argsHash: 'A1b2C3d4'.slice(0, 8),
  }));
  return { v: 1, sessionId: mintSessionId(), cart: { items }, ledger };
}
