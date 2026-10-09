import { cookies } from 'next/headers';
import type { Session } from '@rwa/shared';
import { authContext } from '../auth/context';
import { ApiFailure } from '../http';
export async function assistantIdentity(): Promise<Session | null> {
  const jar = await cookies();
  if (!jar.getAll().some((c) => /^sb-.*-auth-token/.test(c.name))) return null;

  try {
    const context = await authContext();
    return (await context.session()).verified;
  } catch (error) {
    if (error instanceof ApiFailure) {
      if (error.status === 401) return null;
      if (error.status === 503 && error.code === 'AUTH_UNAVAILABLE')
        return null; // Graceful degradation for dev
    }
    throw error;
  }
}
export const principalOf = (session: Session | null) =>
  session
    ? `${session.userId}:${session.walletAddress}:${session.authChainId}`
    : 'guest';
export function aiConfig() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
  const CURSOR_SECRET =
    process.env.CURSOR_SECRET ||
    'default-dev-cursor-secret-must-be-32-chars-long';

  console.log(
    '[DEBUG aiConfig] OPENAI_API_KEY:',
    !!OPENAI_API_KEY,
    'AI_MODEL:',
    AI_MODEL,
    'CURSOR_SECRET:',
    CURSOR_SECRET?.length,
  );
  if (
    !OPENAI_API_KEY ||
    !/^(openai:)?[a-zA-Z0-9._-]+$/.test(AI_MODEL) ||
    CURSOR_SECRET.length < 32
  ) {
    console.error(
      '[DEBUG aiConfig] OPENAI_API_KEY:',
      !!OPENAI_API_KEY,
      'AI_MODEL:',
      AI_MODEL,
      'CURSOR_SECRET.length:',
      CURSOR_SECRET?.length,
    );
    throw new ApiFailure(
      503,
      'AI_UNAVAILABLE',
      'Chat belum tersedia. Pastikan OPENAI_API_KEY diset.',
    );
  }
  return {
    apiKey: OPENAI_API_KEY,
    model: AI_MODEL.startsWith('openai:') ? AI_MODEL : `openai:${AI_MODEL}`,
    secret: CURSOR_SECRET,
  };
}
