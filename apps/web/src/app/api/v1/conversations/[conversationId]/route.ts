import { randomUUID } from 'node:crypto';
import { authContext } from '../../../../../server/auth/context';
import { historyContext } from '../../../../../server/history/context';
import { apiError } from '../../../../../server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function DELETE(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const requestId = randomUUID();
  try {
    const auth = await authContext();
    auth.service.assertOrigin(request.headers.get('origin'));
    const { verified } = await auth.session(),
      { conversationId } = await context.params;
    await (await historyContext()).remove(verified, conversationId);
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return apiError(e, requestId);
  }
}
