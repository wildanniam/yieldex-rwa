import { afterEach, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('./client-api', () => ({
  marketRequest: api.request,
  checkedResponse: (_schema: string, value: unknown) => value,
}));
import { authMutation, clearMatchingSession } from './session-auth';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
const identity = { wallet: 'wallet-a', chainId: 11155111 };
it('drains an old auth response before revocation and a queued new login (controlled cookie race)', async () => {
  vi.stubGlobal('navigator', {});
  let unblock!: () => void;
  const pending = new Promise<void>((resolve) => {
    unblock = resolve;
  });
  let cookie: string | null = null;
  const events: string[] = [];
  api.request.mockImplementation(async (_path: string, init?: RequestInit) => {
    if (init?.method === 'DELETE') {
      events.push(`revoke:${cookie}`);
      cookie = null;
      return null;
    }
    return cookie
      ? { data: { walletAddress: cookie, authChainId: 11155111 } }
      : null;
  });
  const old = authMutation(async () => {
    await pending;
    cookie = 'wallet-a';
    events.push('response:a');
  });
  const revoke = authMutation(() => clearMatchingSession(identity));
  const next = authMutation(async () => {
    cookie = 'wallet-b';
    events.push('response:b');
  });
  expect(events).toEqual([]);
  unblock();
  await Promise.all([old, revoke, next]);
  expect(events).toEqual(['response:a', 'revoke:wallet-a', 'response:b']);
  expect(cookie).toBe('wallet-b');
});
it('preserves a newer different identity instead of revoking its session', async () => {
  api.request.mockResolvedValue({
    data: { walletAddress: 'wallet-b', authChainId: 11155111 },
  });
  await clearMatchingSession(identity);
  expect(api.request).toHaveBeenCalledTimes(1);
  expect(api.request).toHaveBeenCalledWith('/session');
});
it('does not turn an unavailable session check into a successful invalidation', async () => {
  api.request.mockRejectedValue(new Error('SERVICE_UNAVAILABLE'));
  await expect(clearMatchingSession(identity)).rejects.toThrow(
    'SERVICE_UNAVAILABLE',
  );
  expect(api.request).toHaveBeenCalledTimes(1);
});
it('accepts an already unauthenticated session without sending a destructive request', async () => {
  api.request.mockRejectedValue(new Error('AUTH_REQUIRED'));
  await clearMatchingSession(identity);
  expect(api.request).toHaveBeenCalledTimes(1);
});
it('uses a shared browser lock when available and recovers its queue after failure', async () => {
  const request = vi.fn(
    async (_name: string, work: () => Promise<unknown>) => await work(),
  );
  vi.stubGlobal('navigator', { locks: { request } });
  await expect(
    authMutation(async () => {
      throw new Error('rejected');
    }),
  ).rejects.toThrow('rejected');
  expect(await authMutation(async () => 'next')).toBe('next');
  expect(request.mock.calls.map(([name]) => name)).toEqual([
    'yieldex-wallet-auth',
    'yieldex-wallet-auth',
  ]);
});
