import { expect, it } from 'vitest';
import { walletError } from './client-api';

it('explains unavailable chat verification without treating the connected wallet as disconnected', () => {
  expect(walletError(new Error('AUTH_UNAVAILABLE'))).toContain(
    'tetap bisa melihat portfolio',
  );
  expect(walletError(new Error('AUTH_REQUIRED'))).toContain(
    'Koneksi wallet tetap tersedia',
  );
  expect(walletError(new Error('CHALLENGE_EXPIRED'))).toContain(
    'permintaan baru',
  );
  expect(walletError(new Error('SESSION_EXPIRED'))).toContain(
    'Sesi chat berakhir',
  );
});
it('preserves explicit wallet rejection and actionable local errors', () => {
  expect(walletError({ cause: { code: 4001 } })).toContain('ditolak di wallet');
  expect(walletError(new Error('Wallet berubah.'))).toBe('Wallet berubah.');
  expect(walletError(new Error('toString'))).toBe('toString');
});
