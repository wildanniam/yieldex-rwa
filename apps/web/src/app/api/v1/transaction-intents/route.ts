import { randomUUID } from 'node:crypto';
import { authContext } from '../../../../server/auth/context';
import { marketContext } from '../../../../server/market/context';
import { apiError, boundedJson, RequestBudget } from '../../../../server/http';
import {
  TransactionIntents,
  idempotencyKey,
} from '../../../../server/transactions/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const budget = new RequestBudget(20);
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const auth = await authContext();
    auth.service.assertOrigin(request.headers.get('origin'));
    const { verified } = await auth.session();
    budget.take(verified.userId);
    const key = idempotencyKey(request.headers.get('idempotency-key')),
      input = await boundedJson(request),
      { db, reader } = await marketContext();
    const result = await new TransactionIntents(db, reader).prepare(
      verified,
      key,
      input,
    );
    return Response.json(
      {
        meta: {
          schemaVersion: '1.0',
          requestId,
          observedAt: Math.floor(Date.now() / 1000),
        },
        data: result.intent,
      },
      {
        status: result.created ? 201 : 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (e) {
    return apiError(e, requestId);
  }
}
