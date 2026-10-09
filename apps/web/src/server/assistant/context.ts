import { cookies } from 'next/headers';
import type { Session } from '@rwa/shared';
import { authContext } from '../auth/context';
import { ApiFailure } from '../http';
export async function assistantIdentity(): Promise<Session | null> {
  const jar = await cookies();
  if (!jar.getAll().some((c) => /^sb-.*-auth-token/.test(c.name))) return null;
  const context = await authContext();
  try {
    return (await context.session()).verified;
  } catch (error) {
    if (error instanceof ApiFailure && error.status === 401) return null;
    throw error;
  }
}
export const principalOf = (session: Session | null) =>
  session
    ? `${session.userId}:${session.walletAddress}:${session.authChainId}`
    : 'guest';
export function aiConfig() {
  const { OPENAI_API_KEY, AI_MODEL, CURSOR_SECRET } = process.env;
  if (
    !OPENAI_API_KEY ||
    !AI_MODEL ||
    !/^(openai:)?[a-zA-Z0-9._-]+$/.test(AI_MODEL) ||
    !CURSOR_SECRET ||
    CURSOR_SECRET.length < 32
  )
    throw new ApiFailure(
      503,
      'AI_UNAVAILABLE',
      'Chat belum tersedia. Marketplace dan quote manual tetap dapat digunakan.',
    );
  return {
    apiKey: OPENAI_API_KEY,
    model: AI_MODEL.startsWith('openai:') ? AI_MODEL : `openai:${AI_MODEL}`,
    secret: CURSOR_SECRET,
  };
}
