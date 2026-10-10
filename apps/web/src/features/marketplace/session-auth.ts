'use client';

import type { SessionResponse } from '@rwa/shared';
import { checkedResponse, marketRequest } from './client-api';

// Serialize cookie-changing requests, including the response to an abandoned login.
// Web Locks extends the same ordering to other tabs when the browser supports it.
let authQueue: Promise<unknown> = Promise.resolve();
export function authMutation<T>(work: () => Promise<T>): Promise<T> {
  const next: Promise<T> = authQueue.then(async () => {
    if (navigator.locks)
      return await navigator.locks.request('yieldex-wallet-auth', work);
    return await work();
  });
  authQueue = next.catch(() => {});
  return next;
}
export type Identity = { wallet: string | null; chainId: number | null };
export async function currentServerSession() {
  const data = await marketRequest('/session').catch((error: unknown) => {
    if (
      error instanceof Error &&
      ['AUTH_REQUIRED', 'SESSION_EXPIRED'].includes(error.message)
    )
      return null;
    throw error;
  });
  return data
    ? checkedResponse<SessionResponse>('api.SessionResponse', data).data
    : null;
}
export async function clearMatchingSession(identity: Identity) {
  const current = await currentServerSession();
  if (
    current &&
    current.walletAddress === identity.wallet &&
    current.authChainId === identity.chainId
  )
    await marketRequest('/session', { method: 'DELETE' });
}
