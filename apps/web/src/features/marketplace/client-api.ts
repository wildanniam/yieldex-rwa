'use client';

import { validateData, type SchemaName } from '@rwa/shared/validation';

export async function marketRequest(path: string, init?: RequestInit) {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const code = body?.error?.code;
    throw new Error(typeof code === 'string' ? code : 'SERVICE_UNAVAILABLE');
  }
  return body;
}

export function checkedResponse<T>(schema: SchemaName, value: unknown): T {
  if (!validateData(schema, value).success)
    throw new Error('Data belum dapat diverifikasi. Coba muat ulang.');
  return value as T;
}

export function walletError(error: unknown) {
  const e = error as { code?: number; cause?: { code?: number } } | null;
  if (e?.code === 4001 || e?.cause?.code === 4001)
    return 'Permintaan ditolak di wallet. Tidak ada pengiriman ulang otomatis.';
  if (error instanceof Error) {
    const authenticationMessages: Record<string, string> = {
      AUTH_REQUIRED:
        'Verifikasi wallet belum berhasil. Coba verifikasi lagi untuk menyimpan chat. Koneksi wallet tetap tersedia.',
      AUTH_UNAVAILABLE:
        'Verifikasi chat sedang tidak tersedia. Kamu tetap bisa melihat portfolio dan menggunakan chat sementara.',
      SESSION_EXPIRED:
        'Sesi chat berakhir. Verifikasi wallet kembali untuk membuka chat tersimpan.',
      CHALLENGE_EXPIRED:
        'Permintaan verifikasi kedaluwarsa. Coba lagi untuk mendapatkan permintaan baru.',
    };
    if (Object.hasOwn(authenticationMessages, error.message))
      return authenticationMessages[error.message]!;
  }
  if (
    error instanceof Error &&
    !('details' in error) &&
    error.message.length < 180
  )
    return error.message;
  return 'Permintaan belum berhasil. Periksa wallet dan jaringan, lalu coba lagi.';
}
