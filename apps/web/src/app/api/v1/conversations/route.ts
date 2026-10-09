import { randomUUID } from 'node:crypto';
import { authContext } from '../../../../server/auth/context';
import { historyContext } from '../../../../server/history/context';
import { apiError, boundedJson, RequestBudget } from '../../../../server/http';
import { idempotencyKey } from '../../../../server/transactions/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const budget = new RequestBudget(30);
const headers = { 'Cache-Control': 'no-store' };
export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const { session } = await authContext(),
      { verified } = await session();
    budget.take(verified.userId);
    const result = await (
      await historyContext()
    ).list(verified, new URL(request.url).searchParams);
    return Response.json(
      {
        meta: {
          schemaVersion: '1.0',
          requestId,
          observedAt: Math.floor(Date.now() / 1000),
        },
        ...result,
      },
      { headers },
    );
  } catch (e) {
    return apiError(e, requestId);
  }
}
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const auth = await authContext();
    auth.service.assertOrigin(request.headers.get('origin'));
    const { verified } = await auth.session();
    budget.take(verified.userId);
    const result = await (
      await historyContext()
    ).create(
      verified,
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
        data: result.data,
      },
      { status: result.created ? 201 : 200, headers },
    );
  } catch (e) {
    return apiError(e, requestId);
  }
}
