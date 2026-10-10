'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import s from './shell.module.css';
import { useOptionalPlatform } from '@/features/marketplace/platform-provider';
import { WalletControls } from '@/features/marketplace/wallet-access';
import { shortAddress } from '@/features/marketplace/data';

const destinations: { label: string; href: string; icon: IconName }[] = [
  { label: 'My Portfolio', href: '/dashboard', icon: 'layers' },
  { label: 'Marketplace', href: '/marketplace', icon: 'tag' },
  { label: 'Create listing', href: '/sell', icon: 'plus' },
  { label: 'AI Assistant', href: '/chat', icon: 'sparkles' },
];

export function PlatformShell({ children }: { children: ReactNode }) {
  const platform = useOptionalPlatform();
  const account = platform?.access.identity.wallet;
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const setMenuOpen = (open: boolean) => setMenuPath(open ? pathname : null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = destinations.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  useEffect(() => {
    const closeOnHistory = () => setMenuPath(null);
    window.addEventListener('popstate', closeOnHistory);
    return () => window.removeEventListener('popstate', closeOnHistory);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuPath(null);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [menuOpen]);

  return (
    <div className={s.shell} data-platform-shell>
      <a className={s.skip} href="#platform-main">
        Skip to content
      </a>
      <aside
        className={`${s.sidebar} ${menuOpen ? s.sidebarOpen : ''}`}
        id="platform-navigation"
      >
        <Link
          href="/"
          className={s.brand}
          aria-label="Yieldex home"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/landing/yieldex-logo.png"
            width={611}
            height={188}
            style={{ width: 132, height: 'auto' }}
            alt="Yieldex"
            priority
          />
        </Link>
        <nav aria-label="Application navigation">
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${s.navItem} ${current?.href === item.href ? s.navActive : ''}`}
              aria-current={current?.href === item.href ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} alt="" inheritColor size={20} />
              {item.label}
            </Link>
          ))}
          <Link
            className={s.navItem}
            href="/dashboard#activity"
            onClick={() => {
              setMenuOpen(false);
              const details = document.getElementById('activity');
              if (details instanceof HTMLDetailsElement) details.open = true;
            }}
          >
            <Icon name="history" alt="" inheritColor size={20} /> Activity
          </Link>
        </nav>
        <div className={s.sidebarFoot}>
          <Link href="/lab">
            <Icon name="globe" alt="" inheritColor size={17} /> Wallet console{' '}
            <Icon name="arrow-up-right" alt="" size={14} />
          </Link>
          <span>
            <i />{' '}
            {platform
              ? platform.manifest.chainId === 31337
                ? 'Local chain'
                : 'Ethereum Sepolia'
              : 'Network unavailable'}
          </span>
        </div>
      </aside>
      <div className={s.workspace}>
        <header className={s.header}>
          <button
            ref={menuButton}
            className={s.menuToggle}
            type="button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-controls="platform-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'x' : 'layers'} alt="" inheritColor />
          </button>
          <div className={s.headerTitle}>
            Workspace{' '}
            <span>
              /{' '}
              {current?.label ??
                (pathname === '/wallet'
                  ? 'Wallet'
                  : pathname.startsWith('/positions/')
                    ? 'Position'
                    : 'Yieldex')}
            </span>
          </div>
          <div className={s.headerActions}>
            <span className={s.networkLabel}>
              <i />{' '}
              {platform?.access.identity.chainId &&
              platform.access.identity.chainId !== platform.manifest.chainId
                ? 'Wrong network'
                : platform?.manifest.chainId === 31337
                  ? 'Local chain'
                  : platform
                    ? 'Sepolia'
                    : 'Unavailable'}
            </span>
            <Button
              variant="accent"
              size="sm"
              leadingIcon="wallet"
              disabled={!platform || !platform.access.ready}
              onClick={() => dialog.current?.showModal()}
            >
              {!platform
                ? 'Wallet unavailable'
                : !platform.access.ready
                  ? 'Checking wallet…'
                  : account
                    ? shortAddress(account)
                    : 'Connect wallet'}
            </Button>
          </div>
        </header>
        <main
          id="platform-main"
          tabIndex={-1}
          className={`${s.main} ${pathname === '/dashboard' ? s.portfolio : ''}`}
        >
          {children}
        </main>
      </div>
      <dialog
        ref={dialog}
        className={s.dialog}
        aria-labelledby="wallet-handoff-title"
        aria-describedby="wallet-handoff-description"
      >
        <div className={s.dialogHeading}>
          <Icon name="wallet" alt="" inheritColor size={24} />
          <Button
            variant="ghost"
            size="sm"
            aria-label="Close wallet details"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="x" alt="" />
          </Button>
        </div>
        <h2 id="wallet-handoff-title">
          {account ? 'Your wallet' : 'Connect your wallet'}
        </h2>
        <p id="wallet-handoff-description">
          Read your portfolio with a connected wallet. Verify ownership only
          when you want to save chats. Transactions always need their own
          confirmation.
        </p>
        {platform && (
          <WalletControls
            access={platform.access}
            chainId={platform.manifest.chainId}
          />
        )}
        <Link
          href="/wallet"
          className={buttonVariants({ variant: 'accent' })}
          onClick={() => dialog.current?.close()}
        >
          Wallet details{' '}
          <Icon name="arrow-up-right" alt="" inheritColor size={16} />
        </Link>
      </dialog>
    </div>
  );
}
