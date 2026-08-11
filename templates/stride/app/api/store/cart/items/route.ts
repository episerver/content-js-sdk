import { NextRequest } from 'next/server';
import { addToCart, StoreErrorException } from '../../../../../lib/store/domain';
import type { FrameSize, ProductId } from '../../../../../lib/store/catalog/types';
import {
  readJsonBody,
  requireIdempotencyKey,
  withStoreSession,
} from '../../../../../lib/store/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/store/cart/items — { productId, frameSize?, quantity? } + Idempotency-Key. */
export async function POST(req: NextRequest) {
  return withStoreSession(req, async state => {
    const key = requireIdempotencyKey(req);
    const body = await readJsonBody(req);
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw new StoreErrorException(
        'INVALID_ARGS',
        'request body must be an object',
        'shape: { productId, frameSize?, quantity? }',
      );
    }
    const { productId, frameSize, quantity, ...rest } = body as {
      productId?: ProductId;
      frameSize?: FrameSize;
      quantity?: number;
    };
    if (Object.keys(rest).length > 0) {
      throw new StoreErrorException(
        'INVALID_ARGS',
        `unknown fields: ${Object.keys(rest).join(', ')}`,
        'allowed: productId, frameSize, quantity',
      );
    }
    if (typeof productId !== 'string' || productId.length === 0) {
      throw new StoreErrorException(
        'INVALID_ARGS',
        'productId is required',
        'pass a catalog product id, e.g. "ridgeline-carbon"',
      );
    }
    const { result, state: nextState } = addToCart(
      state,
      { productId, frameSize, quantity },
      key,
    );
    return { body: result, state: nextState };
  });
}
