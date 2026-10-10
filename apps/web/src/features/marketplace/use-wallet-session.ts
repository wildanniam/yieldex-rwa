'use client';
// Synchronize the external EIP-1193 provider after hydration, never during SSR.
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createWalletClient, custom, type Address } from 'viem';
import { foundry, sepolia } from 'viem/chains';
import type { DeploymentManifest } from '@rwa/shared/config';
import type {
  AuthChallengeResponse,
  Session,
  SessionResponse,
} from '@rwa/shared';
import { MarketplaceWallet, type WalletProvider } from './wallet';
import { checkedResponse, marketRequest } from './client-api';
import {
  authMutation,
  currentServerSession,
  clearMatchingSession,
  type Identity,
} from './session-auth';

export const walletSessionEvent = 'yieldex:wallet-session-changed';
function announce(pending = false) {
  window.dispatchEvent(
    new CustomEvent(walletSessionEvent, { detail: { pending } }),
  );
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('yieldex-wallet-session');
    channel.postMessage({ changed: true, pending });
    channel.close();
  }
}

async function reconcileWalletSession(beforeInvalidate?: () => void) {
  const provider = (window as unknown as { ethereum?: WalletProvider })
    .ethereum;
  if (!provider) return false;
  return authMutation(async () => {
    const current = await currentServerSession();
    if (!current) return false;
    const accounts = await provider.request({ method: 'eth_accounts' });
    const chain = await provider.request({ method: 'eth_chainId' });
    if (
      current.walletAddress === accounts[0]?.toLowerCase() &&
      current.authChainId === Number(chain)
    )
      return false;
    beforeInvalidate?.();
    await marketRequest('/session', { method: 'DELETE' });
    return true;
  });
}
let initialReconciliation: Promise<void> | undefined;
/** Chat waits for this read-only identity check before using a remembered ticket. */
export function ensureWalletSession() {
  initialReconciliation ??= reconcileWalletSession(() => announce(true))
    .then((changed) => {
      if (changed) announce();
    })
    .catch((error: unknown) => {
      initialReconciliation = undefined;
      throw error;
    });
  return initialReconciliation;
}

/** One browser-wide identity guard, including routes without wallet controls. */
export function WalletSessionGuard() {
  useEffect(() => {
    const provider = (window as unknown as { ethereum?: WalletProvider })
      .ethereum;
    let active = true;
    let changing = false;
    let change = 0;
    const changed = () => {
      const version = ++change;
      changing = true;
      announce(true);
      void reconcileWalletSession()
        .then(() => {
          if (active && change === version) {
            changing = false;
            announce();
          }
        })
        .catch(() => {
          // Fail closed: a fresh successful sign-in/out will unblock the assistant.
        });
    };
    const focused = () => {
      if (changing) return;
      void reconcileWalletSession(() => announce(true))
        .then((mismatch) => {
          if (active && mismatch && !changing) announce();
        })
        .catch(() => {});
    };
    // Let sibling listeners attach first. The chat also awaits the same promise,
    // preventing old-account history from flashing during the initial check.
    queueMicrotask(() => {
      if (active) void ensureWalletSession().catch(() => {});
    });
    provider?.on?.('accountsChanged', changed);
    provider?.on?.('chainChanged', changed);
    window.addEventListener('focus', focused);
    return () => {
      active = false;
      provider?.removeListener?.('accountsChanged', changed);
      provider?.removeListener?.('chainChanged', changed);
      window.removeEventListener('focus', focused);
    };
  }, []);
  return null;
}

/** Connecting, login signatures and transaction signatures are separate user actions. */
export function useWalletSession(manifest: DeploymentManifest) {
  const [wallet, setWallet] = useState<MarketplaceWallet | null>(null);
  const [identity, setIdentity] = useState<Identity>({
    wallet: null,
    chainId: null,
  });
  const identityRef = useRef(identity);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const epoch = useRef(0);
  const readSequence = useRef(0);
  const mounted = useRef(false);
  const refresh = useCallback(
    async (instance: MarketplaceWallet, request = false) => {
      const version = ++readSequence.current;
      const who = await instance.identity(request);
      if (version !== readSequence.current || !mounted.current) return;
      const data = await marketRequest('/session').catch(() => null);
      if (version !== readSequence.current || !mounted.current) return;
      if (
        who.wallet !== identityRef.current.wallet ||
        who.chainId !== identityRef.current.chainId
      )
        epoch.current++;
      identityRef.current = who;
      setIdentity(who);
      const verified = data
        ? checkedResponse<SessionResponse>('api.SessionResponse', data).data
        : null;
      setSession(
        verified?.walletAddress === who.wallet &&
          verified.authChainId === who.chainId
          ? verified
          : null,
      );
    },
    [],
  );

  useEffect(() => {
    mounted.current = true;
    const provider = (window as unknown as { ethereum?: WalletProvider })
      .ethereum;
    const instance = provider
      ? new MarketplaceWallet(provider, manifest)
      : null;
    // Identity reads never request a wallet signature or account permission.
    if (instance) {
      setWallet(instance);
      void refresh(instance)
        .catch(() => {})
        .finally(() => {
          if (mounted.current) setReady(true);
        });
    } else setReady(true);
    const changed = () => {
      epoch.current++;
      readSequence.current++;
      identityRef.current = { wallet: null, chainId: null };
      setSession(null);
      setIdentity(identityRef.current);
      // The root guard owns cookie invalidation. This hook only refreshes identity.
      void authMutation(async () => {
        if (mounted.current && instance) await refresh(instance);
      }).catch(() => {});
    };
    const sync = () => {
      if (instance) void refresh(instance).catch(() => {});
    };
    const channel =
      typeof BroadcastChannel === 'undefined'
        ? null
        : new BroadcastChannel('yieldex-wallet-session');
    const syncSession = (pending: boolean) => {
      if (pending) {
        epoch.current++;
        readSequence.current++;
        setSession(null);
      } else sync();
    };
    if (channel)
      channel.onmessage = (event) => syncSession(!!event.data?.pending);
    const sessionChanged = (event: Event) =>
      syncSession(!!(event as CustomEvent).detail?.pending);
    window.addEventListener(walletSessionEvent, sessionChanged);
    provider?.on?.('accountsChanged', changed);
    provider?.on?.('chainChanged', changed);
    window.addEventListener('focus', sync);
    return () => {
      mounted.current = false;
      // Invalidate the latest pending work, not the value captured at mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      epoch.current++;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      readSequence.current++;
      channel?.close();
      window.removeEventListener('focus', sync);
      window.removeEventListener(walletSessionEvent, sessionChanged);
      provider?.removeListener?.('accountsChanged', changed);
      provider?.removeListener?.('chainChanged', changed);
    };
  }, [manifest, refresh]);

  async function connect() {
    if (!wallet)
      throw new Error(
        'Buka dengan wallet EVM, misalnya MetaMask, untuk melanjutkan.',
      );
    await refresh(wallet, true);
  }
  async function switchChain() {
    if (!wallet) return;
    await wallet.provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${manifest.chainId.toString(16)}` }],
    });
    await refresh(wallet);
  }
  async function login() {
    if (!wallet || !identity.wallet || identity.chainId !== manifest.chainId)
      throw new Error(
        'Hubungkan wallet pada jaringan marketplace terlebih dahulu.',
      );
    const requestedIdentity = { ...identity };
    const version = epoch.current;
    await authMutation(async () => {
      const unchanged = () => mounted.current && version === epoch.current;
      const stale = () =>
        new Error('Wallet berubah. Login kembali dengan akun yang aktif.');
      if (!unchanged()) throw stale();
      const challenge = checkedResponse<AuthChallengeResponse>(
        'api.AuthChallengeResponse',
        await marketRequest('/auth/challenge', {
          method: 'POST',
          body: JSON.stringify({ walletAddress: requestedIdentity.wallet }),
        }),
      );
      if (!unchanged()) throw stale();
      if (
        challenge.data.walletAddress !== requestedIdentity.wallet ||
        challenge.data.chainId !== requestedIdentity.chainId
      )
        throw new Error(
          'Challenge wallet tidak cocok. Muat ulang sebelum login.',
        );
      const signer = createWalletClient({
        account: requestedIdentity.wallet as Address,
        chain: manifest.chainId === 31337 ? foundry : sepolia,
        transport: custom(wallet.provider),
      });
      const signature = await signer.signMessage({
        message: challenge.data.message,
      });
      if (!unchanged()) throw stale();
      const result = checkedResponse<SessionResponse>(
        'api.SessionResponse',
        await marketRequest('/auth/session', {
          method: 'POST',
          body: JSON.stringify({
            challengeId: challenge.data.challengeId,
            signature,
          }),
        }),
      );
      const now = await wallet.identity();
      if (
        !unchanged() ||
        now.wallet !== result.data.walletAddress ||
        now.chainId !== result.data.authChainId
      ) {
        // A stale POST may already have set a cookie. Drain it before releasing the
        // auth lock, preserving a newer different wallet if another client logged in.
        await clearMatchingSession(requestedIdentity);
        announce();
        throw stale();
      }
      readSequence.current++;
      setSession(result.data);
      announce();
    });
  }
  async function logout() {
    const previous = { ...identityRef.current };
    epoch.current++;
    readSequence.current++;
    setSession(null);
    announce(true);
    await authMutation(() => clearMatchingSession(previous));
    announce();
  }
  return {
    wallet,
    identity,
    session,
    ready,
    epoch,
    connect,
    switchChain,
    login,
    logout,
  };
}
