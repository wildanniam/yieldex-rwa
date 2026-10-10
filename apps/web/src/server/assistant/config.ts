import { ApiFailure } from '../http';

export function aiConfig(env: NodeJS.ProcessEnv = process.env) {
  const { OPENAI_API_KEY, AI_MODEL, CURSOR_SECRET } = env;
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
