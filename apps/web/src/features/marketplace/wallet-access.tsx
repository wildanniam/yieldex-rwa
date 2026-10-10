'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { DeploymentManifest } from '@rwa/shared/config';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useWalletSession } from './use-wallet-session';
import { walletError } from './client-api';
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
            {session
              ? 'Signed in · transaksi memerlukan konfirmasi terpisah'
              : 'Connect untuk review. Sign in untuk chat tersimpan.'}
          </p>
        </div>
      </div>
      <div className={s.actions}>
        {!identity.wallet ? (
          <Button
            disabled={!ready || busy}
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
            Sign in with wallet
          </Button>
        )}
      </div>
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

export function WalletAccess({ manifest }: { manifest: DeploymentManifest }) {
  const access = useWalletSession(manifest);
  return (
    <div className={s.page}>
      <Link href="/chat" className={s.back}>
        ← Back to assistant
      </Link>
      <header className={s.heading}>
        <p className={s.eyebrow}>YIELDEX / WALLET</p>
        <h1>
          One wallet.
          <br />
          <span>A connected workspace.</span>
        </h1>
        <p>
          Login membuktikan kepemilikan wallet. Tanda tangan ini tidak
          memindahkan token dan tidak memberikan izin transaksi.
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
