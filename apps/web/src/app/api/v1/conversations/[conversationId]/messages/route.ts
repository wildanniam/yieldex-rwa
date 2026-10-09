import { randomUUID } from 'node:crypto';
import { authContext } from '../../../../../../server/auth/context';
import { historyContext } from '../../../../../../server/history/context';
import { apiError, RequestBudget } from '../../../../../../server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const budget = new RequestBudget(60);
export async function GET(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const requestId = randomUUID();
  try {
    const { session } = await authContext(),
      { verified } = await session();
    budget.take(verified.userId);
    const { conversationId } = await context.params,
      result = await (
        await historyContext()
      ).messages(verified, conversationId, new URL(request.url).searchParams);
    return Response.json(
      {
        meta: {
          schemaVersion: '1.0',
          requestId,
          observedAt: Math.floor(Date.now() / 1000),
        },
        ...result,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return apiError(e, requestId);
  }
}
