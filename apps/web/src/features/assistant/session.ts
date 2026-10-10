export type ChatSession = {
  threadId: string;
  ticket: string;
  authenticated: boolean;
  expiresAt: number;
  persistence: 'TEMPORARY' | 'SAVED';
  conversationId: string | null;
};

export const CHAT_STORAGE_KEY = 'yieldex:assistant-session:v1';
export function parseChatSession(value: unknown): ChatSession | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.threadId !== 'string' ||
    typeof v.ticket !== 'string' ||
    typeof v.authenticated !== 'boolean' ||
    typeof v.expiresAt !== 'number' ||
    !Number.isFinite(v.expiresAt) ||
    (v.persistence !== 'TEMPORARY' && v.persistence !== 'SAVED') ||
    (v.conversationId !== null && typeof v.conversationId !== 'string') ||
    (v.persistence === 'SAVED' && (!v.authenticated || !v.conversationId))
  )
    return null;
  return v as ChatSession;
}

// History and tool output stay server-owned. Rendering retains the full transcript.
export function latestUserMessage<T extends { role: string }>(
  messages: T[],
): T[] {
  return messages.filter((message) => message.role === 'user').slice(-1);
}

export const liveListingHref = (listingKey: string) =>
  `/marketplace/live/${encodeURIComponent(listingKey)}`;
