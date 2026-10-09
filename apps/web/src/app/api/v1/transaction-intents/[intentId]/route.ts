import { randomUUID } from 'node:crypto';
import { authContext } from '../../../../../server/auth/context';
import { marketContext } from '../../../../../server/market/context';
import { apiError, RequestBudget } from '../../../../../server/http';
import { TransactionIntents } from '../../../../../server/transactions/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const budget = new RequestBudget(60);
export async function GET(
  _request: Request,
  context: { params: Promise<{ intentId: string }> },
) {
  const requestId = randomUUID();
  try {
    const { session } = await authContext(),
      { verified } = await session();
    budget.take(verified.userId);
    const { db, reader } = await marketContext(),
      { intentId } = await context.params;
    const data = await new TransactionIntents(db, reader).get(
      verified,
      intentId,
    );
    return Response.json(
      {
        meta: {
          schemaVersion: '1.0',
          requestId,
          observedAt: Math.floor(Date.now() / 1000),
        },
        data,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return apiError(e, requestId);
  }
}
