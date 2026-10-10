export type ChatSession = {
  threadId: string;
  ticket: string;
  authenticated: boolean;
  expiresAt: number;
  persistence: 'TEMPORARY' | 'SAVED';
  conversationId: string | null;
};

export const CHAT_STORAGE_KEY = 'yieldex:assistant-session:v1';

export class ChatSessionFailure extends Error {
  constructor(
    message: string,
    readonly recovery: 'retry' | 'new' | 'verify' = 'retry',
  ) {
    super(message);
  }
}

/** Map trusted error codes, never render arbitrary provider/transport text. */
export function chatSessionFailure(body: unknown) {
  const code =
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object' &&
    'code' in body.error
      ? body.error.code
      : undefined;
  switch (code) {
    case 'AI_UNAVAILABLE':
      return new ChatSessionFailure(
        'Layanan AI belum tersedia. Status verifikasi wallet tidak berubah. Coba lagi nanti; marketplace tetap dapat digunakan.',
      );
    case 'AI_STATE_UNAVAILABLE':
    case 'SAVED_HISTORY_UNAVAILABLE':
      return new ChatSessionFailure(
        'Penyimpanan chat sedang tidak tersedia. Coba lagi nanti; kamu tidak perlu menghubungkan ulang wallet.',
      );
    case 'AUTH_REQUIRED':
    case 'SESSION_EXPIRED':
      return new ChatSessionFailure(
        'Verifikasi wallet diperlukan untuk membuka chat tersimpan. Chat sementara tetap dapat digunakan.',
        'verify',
      );
    case 'CHAT_SESSION_REQUIRED':
      return new ChatSessionFailure(
        'Sesi chat ini sudah berakhir atau tidak cocok dengan wallet aktif. Mulai chat baru; riwayat tersimpan tetap tersedia setelah verifikasi.',
        'new',
      );
    case 'RATE_LIMITED':
      return new ChatSessionFailure(
        'Terlalu banyak permintaan chat. Tunggu sebentar lalu coba lagi.',
      );
    default:
      return new ChatSessionFailure(
        'Chat belum dapat dihubungkan. Periksa koneksi lalu coba lagi.',
      );
  }
}

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
