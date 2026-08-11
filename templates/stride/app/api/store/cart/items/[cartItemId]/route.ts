import { NextRequest } from 'next/server';
import {
  removeFromCart,
  StoreErrorException,
  updateCartItem,
} from '../../../../../../lib/store/domain';
import {
  readJsonBody,
  requireIdempotencyKey,
  withStoreSession,
} from '../../../../../../lib/store/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ cartItemId: string }> };

/** PATCH /api/store/cart/items/{cartItemId} — { quantity } + Idempotency-Key. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { cartItemId } = await ctx.params;
  return withStoreSession(req, async state => {
    const key = requireIdempotencyKey(req);
    const body = await readJsonBody(req);
    if (
      body === null ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      typeof (body as { quantity?: unknown }).quantity !== 'number'
    ) {
      throw new StoreErrorException(
        'INVALID_ARGS',
        'body must be { quantity: number }',
        'quantity is absolute (1–9); to remove the item use DELETE',
      );
    }
    const { result, state: nextState } = updateCartItem(
      state,
      decodeURIComponent(cartItemId),
      (body as { quantity: number }).quantity,
      key,
    );
    return { body: result, state: nextState };
  });
}

/** DELETE /api/store/cart/items/{cartItemId} — Idempotency-Key header. */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { cartItemId } = await ctx.params;
  return withStoreSession(req, state => {
    const key = requireIdempotencyKey(req);
    const { result, state: nextState } = removeFromCart(
      state,
      decodeURIComponent(cartItemId),
      key,
    );
    return { body: result, state: nextState };
  });
}
