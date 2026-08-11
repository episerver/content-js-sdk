import { NextRequest } from 'next/server';
import { searchProducts } from '../../../../lib/store/domain';
import type { SearchArgs } from '../../../../lib/store/domain';
import { readJsonBody, withStoreSession } from '../../../../lib/store/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/store/search — semantically read-only, always retry-safe. */
export async function POST(req: NextRequest) {
  return withStoreSession(req, async () => {
    const args = (await readJsonBody(req)) as SearchArgs;
    return { body: searchProducts(args) };
  });
}
