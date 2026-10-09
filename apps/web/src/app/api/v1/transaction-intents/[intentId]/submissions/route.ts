import { randomUUID } from 'node:crypto';
import { authContext } from '../../../../../../server/auth/context';
import { marketContext } from '../../../../../../server/market/context';
import {
  apiError,
  boundedJson,
  RequestBudget,
} from '../../../../../../server/http';
import {
  TransactionIntents,
  idempotencyKey,
} from '../../../../../../server/transactions/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const budget = new RequestBudget(20);
export async function POST(
  request: Request,
  context: { params: Promise<{ intentId: string }> },
) {
  const requestId = randomUUID();
  try {
    const auth = await authContext();
    auth.service.assertOrigin(request.headers.get('origin'));
    const { verified } = await auth.session();
    budget.take(verified.userId);
    const { db, reader } = await marketContext(),
      { intentId } = await context.params;
    const result = await new TransactionIntents(db, reader).submit(
      verified,
      intentId,
      idempotencyKey(request.headers.get('idempotency-key')),
      await boundedJson(request),
    );
    return Response.json(
      {
        meta: {
          schemaVersion: '1.0',
          requestId,
          observedAt: Math.floor(Date.now() / 1000),
        },
        data: result.status,
      },
      {
        status: result.verified ? 200 : 202,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (e) {
    return apiError(e, requestId);
  }
}
