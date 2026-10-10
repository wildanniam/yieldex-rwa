'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useWalletSession } from './use-wallet-session';
import { walletError } from './client-api';
import { usePlatform } from './platform-provider';
import s from './live.module.css';

export function WalletControls({
  access,
  chainId,
}: {
  access: ReturnType<typeof useWalletSession>;
  chainId: number;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  async function act(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice('');
    try {
      await work();
    } catch (e) {
      setNotice(walletError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const { identity, session, ready, wallet } = access;
  return (
    <section className={s.wallet} aria-label="Wallet access">
      <div className={s.walletIdentity}>
        <Icon name="wallet" alt="" inheritColor size={22} />
        <div>
          <strong>
            {identity.wallet
              ? `${identity.wallet.slice(0, 8)}…${identity.wallet.slice(-6)}`
              : 'Your wallet, your decisions'}
          </strong>
          <p>
            {!identity.wallet
              ? 'Connect to view your portfolio and review transactions.'
              : identity.chainId !== chainId
                ? 'Switch network to use the marketplace.'
                : session
                  ? 'Ownership verified. Your private chat history is available.'
                  : 'Portfolio and transactions are available. Chat history is optional.'}
          </p>
          {identity.wallet && (
            <span className={s.badge}>
              {session ? 'Verified' : 'Connected'}
            </span>
          )}
        </div>
      </div>
      <div className={s.actions}>
        {!identity.wallet ? (
          <Button
            disabled={!ready || busy || !wallet}
            isLoading={busy}
            onClick={() => void act(access.connect)}
          >
            Connect wallet
          </Button>
        ) : identity.chainId !== chainId ? (
          <Button disabled={busy} onClick={() => void act(access.switchChain)}>
            Switch to {chainId === 11155111 ? 'Sepolia' : 'local chain'}
          </Button>
        ) : session ? (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => void act(access.logout)}
          >
            Sign out
          </Button>
        ) : (
          <Button
            variant="accent"
            disabled={busy}
            isLoading={busy}
            onClick={() => void act(access.login)}
          >
            Verify for saved chats
          </Button>
        )}
      </div>
      {identity.wallet && !session && identity.chainId === chainId && (
        <p className={s.muted}>
          Optional: sign a message to prove ownership. No token approval, gas
          fee or transfer.
        </p>
      )}
      {ready && !wallet && (
        <p className={s.muted}>
          Gunakan browser dengan wallet EVM. Chat dan pencarian tetap bisa
          digunakan tanpa wallet.
        </p>
      )}
      {notice && (
        <p role="alert" className={s.notice}>
          {notice}
        </p>
      )}
    </section>
  );
}

export function WalletAccess() {
  const { access, manifest } = usePlatform();
  return (
    <div className={s.page}>
      <Link href="/dashboard" className={s.back}>
        ← My portfolio
      </Link>
      <header className={s.heading}>
        <p className={s.eyebrow}>YIELDEX / WALLET</p>
        <h1>Your wallet.</h1>
        <p>
          Connect for your portfolio. Verify ownership for saved conversations.
          You approve every transaction separately in your wallet.
        </p>
      </header>
      <WalletControls access={access} chainId={manifest.chainId} />
      <div className={s.actions}>
        <Link href="/chat" className={buttonVariants({ variant: 'accent' })}>
          Continue to assistant{' '}
          <Icon name="arrow-up-right" alt="" inheritColor size={16} />
        </Link>
        <Link href="/lab" className={s.back}>
          Open wallet console
        </Link>
      </div>
    </div>
  );
}
