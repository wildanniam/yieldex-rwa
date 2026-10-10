import { cookies } from 'next/headers';
import type { Session } from '@rwa/shared';
import { authContext } from '../auth/context';
import { ApiFailure } from '../http';
export { aiConfig } from './config';
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
