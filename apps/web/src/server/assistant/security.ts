import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { ApiFailure } from '../http';
const ticketSchema = z
  .object({
    id: z.string(),
    browser: z.string(),
    principal: z.string(),
    expiresAt: z.number().int(),
  })
  .passthrough();
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
    if (!value || value.length > 1500 || !browser) {
      console.log('[DEBUG] 1', !!value, !!browser);
      throw deny();
    }
    const [body, mac, extra] = value.split('.');
    if (!body || !mac || extra) {
      console.log('[DEBUG] 2');
      throw deny();
    }
    const expected = createHmac('sha256', secret)
      .update('yieldex-chat-v1:' + body)
      .digest();
    const supplied = Buffer.from(mac, 'base64url');
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      console.log('[DEBUG] 3');
      throw deny();
    }

    const ticket = ticketSchema.parse(
      JSON.parse(Buffer.from(body, 'base64url').toString()),
    );
    if (
      ticket.browser !== browser ||
      ticket.principal !== principal ||
      ticket.expiresAt <= now ||
      ticket.expiresAt > now + 1800000
    ) {
      console.log(
        '[DEBUG] 4',
        ticket.browser === browser,
        ticket.principal === principal,
        ticket.expiresAt > now,
      );
      throw deny();
    }

    return ticket;
  } catch (err) {
    console.log('[DEBUG] caught error:', err);
    throw deny();
  }
}
export function issueTicket(
  browser: string,
  principal: string,
  secret: string,
  now = Date.now(),
) {
  const ticket = {
    id: randomUUID(),
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
  const requestOrigin = request.headers.get('origin');
  if (origin) {
    if (requestOrigin !== origin)
      throw new ApiFailure(403, 'ORIGIN_MISMATCH', 'Origin tidak diizinkan.');
  } else {
    // Development fallback
    if (
      requestOrigin !== 'http://localhost:3000' &&
      requestOrigin !== 'http://127.0.0.1:3000'
    ) {
      throw new ApiFailure(403, 'ORIGIN_MISMATCH', 'Origin tidak diizinkan.');
    }
  }
}
const userMessage = z.any();
const envelope = z.object({
  method: z.enum(['info', 'agent/run', 'agent/connect', 'agent/stop']),
  params: z
    .object({
      agentId: z.literal('default').optional(),
      threadId: z.string().optional(),
    })
    .optional(),
  body: z.unknown().optional(),
});
export function safeRuntimeCall(value: unknown, ticketId: string) {
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

  let threadId = (call.params as { agentId?: string; threadId?: string })?.threadId;
  if (!threadId && call.body && typeof call.body === 'object') {
    threadId = call.body.threadId;
  }
  if (!threadId || typeof threadId !== 'string') threadId = ticketId;

  if (call.method === 'agent/stop') {
    const scope = z
      .object({ runId: z.string().optional() })
      .passthrough()
      .safeParse(call.body ?? {});
    return {
      method: call.method,
      params: { agentId: 'default', threadId },
      body: scope.success ? scope.data : {},
    };
  }

  if (call.method === 'agent/connect') {
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

  const body = z
    .object({
      runId: z.string().optional(),
      messages: z.array(userMessage).optional(),
    })
    .passthrough()
    .safeParse(call.body);
  if (!body.success)
    throw new ApiFailure(
      400,
      'VALIDATION_ERROR',
      'Pesan atau thread tidak valid.',
    );

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
