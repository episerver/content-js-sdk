import { NextRequest } from 'next/server';
import { compareProducts, StoreErrorException } from '../../../../lib/store/domain';
import { withStoreSession } from '../../../../lib/store/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/store/compare?ids=a,b[,c]&riderHeightCm= */
export async function GET(req: NextRequest) {
  return withStoreSession(req, () => {
    const idsParam = req.nextUrl.searchParams.get('ids');
    if (!idsParam) {
      throw new StoreErrorException(
        'COMPARE_ARITY',
        'the ids query parameter is required',
        'pass 2–3 comma-separated bike ids, e.g. ?ids=ridgeline-carbon,sierra-alloy-gs',
      );
    }
    const ids = idsParam
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const heightParam = req.nextUrl.searchParams.get('riderHeightCm');
    let riderHeightCm: number | undefined;
    if (heightParam !== null && heightParam !== '') {
      riderHeightCm = Number(heightParam);
      if (!Number.isFinite(riderHeightCm)) {
        throw new StoreErrorException(
          'INVALID_ARGS',
          `riderHeightCm must be a number, got "${heightParam}"`,
          'pass the rider height in centimeters, e.g. riderHeightCm=178',
        );
      }
    }
    return { body: compareProducts(ids, riderHeightCm) };
  });
}
