import { NextRequest } from 'next/server';
import { resetSession } from '../../../../../lib/store/domain';
import { withStoreSession } from '../../../../../lib/store/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/store/session/reset — fresh sessionId, empty cart + ledger; telemetry untouched. */
export async function POST(req: NextRequest) {
  return withStoreSession(req, () => {
    const next = resetSession();
    return { body: { sessionId: next.sessionId }, state: next };
  });
}
