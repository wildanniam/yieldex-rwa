import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  aiConfig,
  assistantIdentity,
  principalOf,
} from '../../../../server/assistant/context';
import {
  assertChatOrigin,
  CHAT_COOKIE,
  issueTicket,
  verifyTicket,
} from '../../../../server/assistant/security';
import {
  ApiFailure,
  apiError,
  boundedJson,
  clientBucket,
} from '../../../../server/http';
import {
  assistantState,
  assertSavedStore,
  stateError,
  type AssistantMessage,
} from '../../../../server/assistant/state';
import { History } from '../../../../server/history/service';
import { HistoryCursor } from '../../../../server/history/cursor';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const inputSchema = z.union([
  z.object({}).strict(),
  z.object({ ticket: z.string().min(1).max(1500) }).strict(),
  z
    .object({
      persistence: z.literal('SAVED'),
      conversationId: z.string().uuid().optional(),
    })
    .strict(),
]);
export async function POST(request: Request) {
  try {
    assertChatOrigin(request, process.env.APP_ORIGIN);
    const config = aiConfig(),
      identity = await assistantIdentity(),
      principal = principalOf(identity);
    const state = assistantState();
    await state.budget(`session:${clientBucket(request)}`, 20);
    const input = inputSchema.safeParse(
      request.body ? await boundedJson(request) : {},
    );
    if (!input.success)
      throw new ApiFailure(
        400,
        'VALIDATION_ERROR',
        'Pilihan sesi chat tidak valid.',
      );
    const jar = await cookies(),
      old = jar.get(CHAT_COOKIE)?.value;
    const browser = old && /^[0-9a-f-]{36}$/.test(old) ? old : randomUUID();
    let thread;
    if ('ticket' in input.data) {
      const ticket = verifyTicket(
        input.data.ticket,
        old,
        principal,
        config.secret,
      );
      thread = await state.get(ticket.id, principal);
      if (thread.conversationId) {
        assertSavedStore();
        if (!identity)
          throw new ApiFailure(
            401,
            'AUTH_REQUIRED',
            'Login wallet untuk riwayat tersimpan.',
          );
        await new History(state.db, new HistoryCursor(config.secret)).messages(
          identity,
          thread.conversationId,
          new URLSearchParams({ limit: '1' }),
        );
      }
    } else if ('persistence' in input.data) {
      assertSavedStore();
      if (!identity)
        throw new ApiFailure(
          401,
          'AUTH_REQUIRED',
          'Login wallet untuk menyimpan riwayat.',
        );
      const history = new History(state.db, new HistoryCursor(config.secret));
      const conversationId =
        input.data.conversationId ??
        (
          await history.create(identity, randomUUID(), {
            title: 'Yieldex Assistant',
          })
        ).data.conversationId;
      const initial: AssistantMessage[] = [];
      let cursor: string | null = null;
      do {
        const page = await history.messages(
          identity,
          conversationId,
          new URLSearchParams({ limit: '50', ...(cursor ? { cursor } : {}) }),
        );
        for (const m of page.items) {
          initial.push({ id: m.messageId, role: m.role, content: m.text });
          for (const card of m.cards) {
            const toolId = card.toolCallId;
            initial.push({
              id: `saved-call-${card.cardId}`,
              role: 'assistant',
              toolCalls: [
                {
                  id: toolId,
                  type: 'function',
                  function: { name: 'savedCard', arguments: '{}' },
                },
              ],
            });
            initial.push({
              id: `saved-result-${card.cardId}`,
              role: 'tool',
              toolCallId: toolId,
              content: JSON.stringify({
                kind: card.kind,
                payload: card.payload,
              }),
            });
          }
        }
        cursor = page.pagination.nextCursor;
        if (JSON.stringify(initial).length > 196608)
          throw new ApiFailure(
            409,
            'CHAT_LIMIT',
            'Riwayat penuh. Mulai chat tersimpan baru.',
          );
      } while (cursor);
      thread = await state.create(principal, conversationId, initial);
    } else thread = await state.create(principal);
    jar.set(CHAT_COOKIE, browser, {
      httpOnly: true,
      secure: new URL(request.url).protocol === 'https:',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600,
    });
    return Response.json(
      {
        ...issueTicket(
          browser,
          principal,
          config.secret,
          Date.now(),
          thread.id,
        ),
        authenticated: !!identity,
        persistence: thread.conversationId ? 'SAVED' : 'TEMPORARY',
        conversationId: thread.conversationId,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiError(stateError(error));
  }
}
