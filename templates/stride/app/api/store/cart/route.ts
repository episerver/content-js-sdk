import { NextRequest } from 'next/server';
import { getCart } from '../../../../lib/store/domain';
import { withStoreSession } from '../../../../lib/store/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/store/cart — derived view, prices/names joined from the catalog. */
export async function GET(req: NextRequest) {
  return withStoreSession(req, state => ({ body: getCart(state) }));
}
