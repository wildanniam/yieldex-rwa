'use client';
import Link from 'next/link';
import { useEffect, useState, type KeyboardEvent } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AssetMark } from '@/components/landing/asset-mark';
import { usePlatform } from '@/features/marketplace/platform-provider';
import { useAssets, usePortfolio } from '@/features/marketplace/use-portfolio';
import {
  amount,
  listingHref,
  positionHref,
  shortAddress,
} from '@/features/marketplace/data';
import {
  TransactionPanel,
  WalletActivity,
} from '@/features/marketplace/transaction-panel';
import s from './dashboard.module.css';

const tabs = ['positions', 'listings', 'vault'] as const;
type Tab = (typeof tabs)[number];
const names = {
  positions: 'Income rights',
  listings: 'My offers',
  vault: 'My backing',
};
export function PortfolioDashboard() {
  const { access } = usePlatform();
  const assets = useAssets(),
    portfolio = usePortfolio();
  const [tab, setTab] = useState<Tab>('positions');
  const [claimKey, setClaimKey] = useState<string | null>(null);
  const who = access.identity.wallet;
  const known = !!portfolio.data && !!assets.data;
  const claims = portfolio.data?.claims ?? [];
  const positive = claims.filter((c) => BigInt(c.claimShares) > 0n);
  const byTab = {
    positions: portfolio.positions.filter((p) => p.rightsOwner === who),
    listings: portfolio.positions.filter(
      (p) =>
        !!p.activeListingKey &&
        (p.storedState === 'OFFERED'
          ? p.principalOwner === who
          : p.rightsOwner === who),
    ),
    vault: portfolio.positions.filter((p) => p.principalOwner === who),
  };
  const selected = claims.find(
    (c) => c.assetKey === claimKey && BigInt(c.claimShares) > 0n,
  );
  useEffect(() => {
    const reveal = () => {
      if (location.hash === '#activity') {
        const node = document.getElementById('activity');
        if (node instanceof HTMLDetailsElement) node.open = true;
      }
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, []);
  function tabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      e.key === 'ArrowRight'
        ? (index + 1) % 3
        : e.key === 'ArrowLeft'
          ? (index + 2) % 3
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? 2
              : null;
    if (next === null) return;
    e.preventDefault();
    setTab(tabs[next]!);
    document.getElementById(`portfolio-tab-${tabs[next]}`)?.focus();
  }
  return (
    <div className={s.shell}>
      <div className={s.intro}>
        <h1>My Portfolio</h1>
        {who ? (
          <span className={s.previewLabel}>
            {shortAddress(who)} · {access.session ? 'Verified' : 'Connected'}
          </span>
        ) : (
          <Link href="/wallet" className={s.textAction}>
            Connect wallet{' '}
            <Icon name="arrow-up-right" alt="" inheritColor size={16} />
          </Link>
        )}
      </div>
      <section
        className={s.incomeCard}
        id="claims"
        aria-label="Available income"
        aria-busy={!!who && (portfolio.loading || assets.loading)}
      >
        <span className={s.incomeLabel}>Available to claim</span>
        {!who ? (
          <>
            <strong className={s.incomeAmount}>
              Your income.
              <br />
              Your wallet.
            </strong>
            <p>Connect to see your positions, backing and income.</p>
          </>
        ) : !known ? (
          <>
            <strong className={s.incomeAmount}>—</strong>
            <p>
              {portfolio.error || assets.error
                ? 'Balance unavailable'
                : 'Reading your allocated income…'}
            </p>
          </>
        ) : positive.length ? (
          <div className={s.claimRows}>
            {positive.map((c) => {
              const a = assets.data!.items.find(
                (a) => a.assetKey === c.assetKey,
              );
              return (
                <div key={c.assetKey}>
                  <strong>
                    {a
                      ? amount(c.claimTokenAmountAtomic, a.token.decimals)
                      : 'Unavailable'}{' '}
                    <small>{a?.token.symbol ?? 'Asset'}</small>
                  </strong>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClaimKey(c.assetKey)}
                  >
                    Review claim
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <strong className={s.incomeAmount}>No income yet</strong>
            <p>Allocated income will appear here, in each asset’s own token.</p>
          </>
        )}
        <div className={s.incomeActions}>
          <Link
            href={who ? '/marketplace' : '/wallet'}
            className={buttonVariants({ variant: 'outline' })}
          >
            <Icon name={who ? 'tag' : 'wallet'} alt="" inheritColor size={18} />
            {who ? 'Explore offers' : 'Connect wallet'}
          </Link>
          <Link href="/sell" className={buttonVariants({ variant: 'outline' })}>
            <Icon name="plus" alt="" inheritColor size={18} />
            Create listing
          </Link>
        </div>
      </section>
      {selected && who && (
        <TransactionPanel
          key={`${who}:${selected.assetKey}:${selected.claimShares}`}
          label="Claim income"
          request={{
            action: 'CLAIM_INCOME',
            assetKey: selected.assetKey,
            shares: selected.claimShares,
          }}
        >
          <p className={s.caption}>
            Claims are paid to your wallet in the asset token. The amount is
            checked again before confirmation.
          </p>
        </TransactionPanel>
      )}
      {(portfolio.error || assets.error) && (
        <div className={s.error} role="alert">
          <div>
            <strong>Portfolio could not be loaded</strong>
            <p>{portfolio.error || assets.error}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              portfolio.refresh();
              assets.refresh();
            }}
          >
            Try again
          </Button>
        </div>
      )}
      <section className={s.panel} aria-label="Your portfolio">
        <div className={s.panelHeading}>
          <h2>Your portfolio</h2>
          <Button
            variant="ghost"
            size="sm"
            disabled={portfolio.loading || !who}
            onClick={portfolio.refresh}
          >
            Refresh
          </Button>
        </div>
        <div role="tablist" aria-label="Portfolio holdings" className={s.tabs}>
          {tabs.map((t, i) => (
            <button
              type="button"
              key={t}
              id={`portfolio-tab-${t}`}
              role="tab"
              aria-selected={tab === t}
              aria-controls="portfolio-panel"
              tabIndex={tab === t ? 0 : -1}
              onKeyDown={(e) => tabKey(e, i)}
              onClick={() => setTab(t)}
            >
              {names[t]}
              <span>{known ? byTab[t].length : '—'}</span>
            </button>
          ))}
        </div>
        <div
          id="portfolio-panel"
          role="tabpanel"
          aria-labelledby={`portfolio-tab-${tab}`}
          tabIndex={0}
          className={s.tabPanel}
        >
          {!who ? (
            <div className={s.empty}>
              <Icon name="wallet" alt="" inheritColor size={28} />
              <h3>Connect to view your portfolio</h3>
              <p>Your positions and allocated income will appear here.</p>
            </div>
          ) : !known ? (
            <div className={s.empty}>
              <h3>
                {portfolio.error || assets.error
                  ? 'Data unavailable'
                  : 'Loading portfolio…'}
              </h3>
            </div>
          ) : byTab[tab].length === 0 ? (
            <div className={s.empty}>
              <Icon name="layers" alt="" inheritColor size={28} />
              <h3>
                {tab === 'positions'
                  ? 'No income rights yet'
                  : tab === 'listings'
                    ? 'No open offers'
                    : 'No backing positions yet'}
              </h3>
              <p>
                {tab === 'positions'
                  ? 'Explore offers to find your first income position.'
                  : 'Create a listing when you are ready to offer income.'}
              </p>
              <Link
                className={s.emptyAction}
                href={tab === 'positions' ? '/marketplace' : '/sell'}
              >
                {tab === 'positions' ? 'Explore offers' : 'Create listing'} ↗
              </Link>
            </div>
          ) : (
            <div className={s.holdings}>
              {byTab[tab].map((p) => {
                const a = assets.data!.items.find(
                  (a) => a.assetKey === p.assetKey,
                );
                return (
                  <Link
                    key={p.positionKey}
                    href={
                      tab === 'listings'
                        ? listingHref(p.activeListingKey!)
                        : positionHref(p.positionKey)
                    }
                    className={s.holdingRow}
                  >
                    <span className={s.token}>
                      <AssetMark symbol={a?.token.symbol ?? ''} />
                    </span>
                    <span>
                      <strong>
                        {a?.token.symbol ?? 'Asset'} · #{p.positionId}
                      </strong>
                      <small>
                        {p.displayState.toLowerCase()} · {p.incomeBps / 100}%
                        income share
                      </small>
                    </span>
                    <span className={s.holdingAmount}>
                      {tab === 'vault'
                        ? a
                          ? `${amount(p.principalTokenAmountAtomic, a.token.decimals)} ${a.token.symbol}`
                          : 'Unavailable'
                        : p.endAt
                          ? `Ends ${new Date(p.endAt * 1000).toLocaleDateString()}`
                          : 'Starts at purchase'}
                      <small>
                        {p.snapshot.finality.toLowerCase()} · #
                        {p.snapshot.blockNumber}
                      </small>
                    </span>
                    <Icon name="arrow-up-right" alt="" inheritColor size={17} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <details id="activity" className={s.activityDisclosure}>
        <summary>Activity</summary>
        <WalletActivity />
      </details>
      <noscript>
        Enable JavaScript to connect your wallet and load your portfolio.
      </noscript>
    </div>
  );
}
