import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { ApiFailure } from '../http';
const ticketSchema = z
  .object({
    id: z.string().uuid(),
    browser: z.string().uuid(),
    principal: z.string(),
    expiresAt: z.number().int(),
  })
  .strict();
export type ChatTicket = z.infer<typeof ticketSchema>;
export const CHAT_COOKIE = 'yieldex-chat-browser';
const deny = () =>
  new ApiFailure(
    403,
    'CHAT_SESSION_REQUIRED',
    'Buka ulang chat untuk memulai sesi yang valid.',
  );
export function signTicket(ticket: ChatTicket, secret: string) {
  if (secret.length < 32)
    throw new ApiFailure(503, 'AI_UNAVAILABLE', 'Chat belum dikonfigurasi.');
  const value = Buffer.from(JSON.stringify(ticket)).toString('base64url');
  return (
    value +
    '.' +
    createHmac('sha256', secret)
      .update('yieldex-chat-v1:' + value)
      .digest('base64url')
  );
}
export function verifyTicket(
  value: string | null,
  browser: string | undefined,
  principal: string,
  secret: string,
  now = Date.now(),
) {
  try {
    if (!value || value.length > 1500 || !browser) throw deny();
    const [body, mac, extra] = value.split('.');
    if (!body || !mac || extra) throw deny();
    const expected = createHmac('sha256', secret)
      .update('yieldex-chat-v1:' + body)
      .digest();
    const supplied = Buffer.from(mac, 'base64url');
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    )
      throw deny();
    const ticket = ticketSchema.parse(
      JSON.parse(Buffer.from(body, 'base64url').toString()),
    );
    if (
      ticket.browser !== browser ||
      ticket.principal !== principal ||
      ticket.expiresAt <= now ||
      ticket.expiresAt > now + 1800000
    )
      throw deny();
    return ticket;
  } catch {
    throw deny();
  }
}
export function issueTicket(
  browser: string,
  principal: string,
  secret: string,
  now = Date.now(),
  threadId: string = randomUUID(),
) {
  const ticket = {
    id: threadId,
    browser,
    principal,
    expiresAt: now + 1800000,
  };
  return {
    threadId: ticket.id,
    ticket: signTicket(ticket, secret),
    expiresAt: ticket.expiresAt,
  };
}
export function assertChatOrigin(request: Request, origin: string | undefined) {
  if (!origin || request.headers.get('origin') !== origin)
    throw new ApiFailure(403, 'ORIGIN_MISMATCH', 'Origin tidak diizinkan.');
}
const userMessage = z
  .object({
    id: z.string().min(1).max(100),
    role: z.literal('user'),
    content: z.string().trim().min(1).max(8000),
  })
  .strict();
const envelope = z
  .object({
    method: z.enum(['info', 'agent/run', 'agent/connect', 'agent/stop']),
    params: z
      .object({
        agentId: z.literal('default').optional(),
        threadId: z.string().uuid().optional(),
      })
      .strict()
      .optional(),
    body: z.unknown().optional(),
  })
  .strict();
export function safeRuntimeCall(value: unknown, threadId: string) {
  const parsed = envelope.safeParse(value);
  if (!parsed.success)
    throw new ApiFailure(
      400,
      'VALIDATION_ERROR',
      'Permintaan chat tidak valid.',
    );
  const call = parsed.data;
  if (call.method === 'info') return { method: 'info' as const };
  if (call.params?.agentId !== 'default') throw deny();
  if (call.method === 'agent/stop') {
    if (call.params.threadId !== threadId) throw deny();
    const scope = z
      .object({ runId: z.string().uuid().optional() })
      .strict()
      .safeParse(call.body ?? {});
    if (!scope.success) throw deny();
    return {
      method: call.method,
      params: { agentId: 'default', threadId },
      body: scope.data,
    };
  }
  if (call.method === 'agent/connect') {
    const body = z
      .object({ threadId: z.literal(threadId) })
      .passthrough()
      .safeParse(call.body);
    if (!body.success) throw deny();
    return {
      method: call.method,
      params: { agentId: 'default' },
      body: {
        threadId,
        runId: randomUUID(),
        messages: [],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      },
    };
  }
  // Framework presentation fields are discarded; model/tool/account authority never comes from them.
  const body = z
    .object({
      threadId: z.literal(threadId),
      runId: z.string().uuid().optional(),
      messages: z.array(userMessage).length(1).optional(),
    })
    .passthrough()
    .safeParse(call.body);
  if (!body.success)
    throw new ApiFailure(
      400,
      'VALIDATION_ERROR',
      'Pesan atau thread tidak valid.',
    );
  if (!body.data.runId || !body.data.messages)
    throw new ApiFailure(400, 'VALIDATION_ERROR', 'Run dan pesan diperlukan.');
  return {
    method: call.method,
    params: { agentId: 'default' },
    body: {
      threadId,
      runId: body.data.runId,
      messages: body.data.messages,
      tools: [],
      context: [],
      state: {},
      forwardedProps: {},
    },
  };
}
