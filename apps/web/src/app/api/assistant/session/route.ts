import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import {
  aiConfig,
  assistantIdentity,
  principalOf,
} from '../../../../server/assistant/context';
import {
  assertChatOrigin,
  CHAT_COOKIE,
  issueTicket,
} from '../../../../server/assistant/security';
import { apiError, clientBucket, RequestBudget } from '../../../../server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const budget = new RequestBudget(20);
export async function POST(request: Request) {
  try {
    assertChatOrigin(request, process.env.APP_ORIGIN);
    budget.take(clientBucket(request));
    const config = aiConfig();
    const session = await assistantIdentity();
    const jar = await cookies();
    const old = jar.get(CHAT_COOKIE)?.value;
    const browser = old && /^[0-9a-f-]{36}$/.test(old) ? old : randomUUID();
    jar.set(CHAT_COOKIE, browser, {
      httpOnly: true,
      secure: new URL(request.url).protocol === 'https:',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600,
    });
    return Response.json(
      {
        ...issueTicket(browser, principalOf(session), config.secret),
        authenticated: !!session,
        persistence: 'TEMPORARY',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
