/**
 * API-layer plumbing for /api/store/* — contracts.md §3.
 *
 * Every route: verify + deserialize the signed `stride_store` cookie (fresh
 * state on tamper/oversize/unknown version — never a 500), thread StoreState
 * through the domain layer, serialize the returned state into Set-Cookie, and
 * carry `X-Stride-Session` on EVERY response.
 */
import { NextRequest, NextResponse } from 'next/server';
import { STORE_COOKIE_NAME, decodeState, encodeState, freshState } from './codec';
import type { ErrorCode, StoreState } from './engine';
import { StoreErrorException, isStoreError } from './engine';

export const ERROR_STATUS: Record<ErrorCode, number> = {
  INVALID_ARGS: 400,
  COMPARE_ARITY: 400,
  COMPARE_NOT_A_BIKE: 400,
  IDEMPOTENCY_KEY_REQUIRED: 400,
  PRODUCT_NOT_FOUND: 404,
  CART_ITEM_NOT_FOUND: 404,
  VARIANT_UNAVAILABLE: 409,
  OUT_OF_STOCK: 409,
  CART_LIMIT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  IDEMPOTENCY_LEDGER_FULL: 409,
  BRIDGE_UNAVAILABLE: 500, // never produced by domain/API (tools.js only); mapped defensively
};

type HandlerResult = {
  body: unknown;
  state?: StoreState; // next state; defaults to the incoming state
  status?: number;
};

/**
 * Wraps a route handler with cookie decode/encode, StoreError → §3 status
 * mapping, and the X-Stride-Session header.
 */
export async function withStoreSession(
  req: NextRequest,
  handler: (state: StoreState) => HandlerResult | Promise<HandlerResult>,
): Promise<NextResponse> {
  const state = decodeState(req.cookies.get(STORE_COOKIE_NAME)?.value) ?? freshState();
  try {
    const { body, state: nextState = state, status = 200 } = await handler(state);
    return respond(body, nextState, status);
  } catch (e) {
    if (isStoreError(e)) {
      return respond({ error: e.toJSON() }, state, ERROR_STATUS[e.code]);
    }
    throw e;
  }
}

function respond(body: unknown, state: StoreState, status: number): NextResponse {
  const res = NextResponse.json(body, { status });
  res.headers.set('X-Stride-Session', state.sessionId);
  res.cookies.set(STORE_COOKIE_NAME, encodeState(state), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

/** Reads the required Idempotency-Key header or throws IDEMPOTENCY_KEY_REQUIRED. */
export function requireIdempotencyKey(req: NextRequest): string {
  const key = req.headers.get('Idempotency-Key');
  if (!key) {
    throw new StoreErrorException(
      'IDEMPOTENCY_KEY_REQUIRED',
      'mutations require the Idempotency-Key header',
      'send Idempotency-Key (8–64 chars of A-Za-z0-9._-, e.g. a UUID) and reuse it verbatim on retry',
    );
  }
  return key;
}

/** Parses a JSON body, mapping malformed JSON to INVALID_ARGS. */
export async function readJsonBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new StoreErrorException(
      'INVALID_ARGS',
      'request body must be valid JSON',
      'send a JSON object with Content-Type: application/json',
    );
  }
}
