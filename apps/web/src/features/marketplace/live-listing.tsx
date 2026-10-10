'use client';
import Link from 'next/link';
import type { ListingResponse } from '@rwa/shared';
import { AssetMark } from '@/components/landing/asset-mark';
import { Button } from '@/components/ui/button';
import { usePlatform } from './platform-provider';
import { useRead } from './use-read';
import {
  amount,
  company,
  positionHref,
  remainingTerm,
  shortAddress,
} from './data';
import { TransactionPanel, WalletActivity } from './transaction-panel';
import s from './live.module.css';

export function LiveListing({ listingKey }: { listingKey: string }) {
  const { manifest: m, access, listings, revision } = usePlatform();
  const id = listingKey.split(':').at(-1)!;
  const data = useRead<ListingResponse>(
    `/chains/${m.chainId}/markets/${m.market}/listings/${id}`,
    'api.ListingResponse',
    revision,
  );
  const overlay = listings.find((d) => d.listing.listingKey === listingKey);
  const indexed = data.data?.data;
  const detail =
    overlay &&
    (!indexed ||
      BigInt(overlay.listing.snapshot.blockNumber) >
        BigInt(indexed.listing.snapshot.blockNumber))
      ? overlay
      : indexed;
  const own = detail?.listing.seller === access.identity.wallet;
  return (
    <div className={s.page}>
      <Link href="/marketplace" className={s.back}>
        ← Marketplace
      </Link>
      {detail ? (
        <>
          <header className={s.heading}>
            <p className={s.eyebrow}>
              {detail.listing.kind === 'PRIMARY'
                ? 'PRIMARY OFFER'
                : 'INCOME RIGHTS / RESALE'}{' '}
              · #{id}
            </p>
            <h1>{company(detail.asset.token.symbol)} income rights.</h1>
            <p>
              {detail.asset.token.symbol} · {detail.position.incomeBps / 100}%
              of allocated income · {remainingTerm(detail)}
            </p>
          </header>
          <section className={s.offer} aria-label="Listing details">
            <div className={s.offerTop}>
              <span className={s.assetIdentity}>
                <AssetMark symbol={detail.asset.token.symbol} />
                {detail.asset.token.symbol}
              </span>
              <span className={s.badge}>
                {detail.listing.displayStatus.toLowerCase()}
              </span>
            </div>
            <p className={s.price}>
              {amount(
                detail.listing.priceAtomic,
                detail.listing.paymentToken.decimals,
              )}{' '}
              <small>{detail.listing.paymentToken.symbol}</small>
            </p>
            <dl className={s.facts}>
              <div>
                <dt>Income share</dt>
                <dd>{detail.position.incomeBps / 100}%</dd>
              </div>
              <div>
                <dt>
                  {detail.listing.kind === 'PRIMARY'
                    ? 'Period starts at purchase'
                    : 'Original expiry retained'}
                </dt>
                <dd>{remainingTerm(detail)}</dd>
              </div>
              <div>
                <dt>Backing stays with principal owner</dt>
                <dd>
                  {amount(
                    detail.position.principalTokenAmountAtomic,
                    detail.asset.token.decimals,
                  )}{' '}
                  {detail.asset.token.symbol}
                </dd>
              </div>
              <div>
                <dt>Seller</dt>
                <dd>
                  {shortAddress(detail.listing.seller)}
                  {own ? ' (you)' : ''}
                </dd>
              </div>
              <div>
                <dt>Offer expires</dt>
                <dd>
                  {new Date(detail.listing.expiresAt * 1000).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt>Income paid in</dt>
                <dd>{detail.asset.token.symbol}</dd>
              </div>
            </dl>
            <p className={s.muted}>
              The buyer receives income rights, not the backing. Income can be
              zero, and the purchase price is not refunded at expiry.
            </p>
            <p className={s.muted}>
              Block #{detail.listing.snapshot.blockNumber} ·{' '}
              {detail.listing.snapshot.finality.toLowerCase()} ·{' '}
              {detail.listing.snapshot.indexerStatus.toLowerCase()}
            </p>
            <Link
              className={s.back}
              href={positionHref(detail.position.positionKey)}
            >
              View position →
            </Link>
          </section>
          {data.error && (
            <p role="alert" className={s.notice}>
              Latest indexed read unavailable: {data.error}. Receipt state above
              is provisional. <button onClick={data.refresh}>Retry</button>
            </p>
          )}
          {detail.listing.displayStatus === 'OPEN' && !own ? (
            <TransactionPanel
              key={listingKey}
              label="Purchase income rights"
              request={{ action: 'BUY_LISTING', listingKey }}
            />
          ) : (
            <section className={s.review}>
              <h2>
                {own ? 'This is your offer' : 'This offer is no longer open'}
              </h2>
              <p className={s.muted}>
                {own
                  ? 'Manage the offer from its position.'
                  : 'Browse the marketplace for another offer. No replacement is selected automatically.'}
              </p>
              <Link
                href={
                  own
                    ? positionHref(detail.position.positionKey)
                    : '/marketplace'
                }
                className={s.back}
              >
                {own ? 'Manage position' : 'Explore offers'} →
              </Link>
            </section>
          )}
        </>
      ) : (
        <section className={s.offer}>
          <h1>
            {data.loading
              ? 'Loading offer…'
              : data.error === 'NOT_FOUND'
                ? 'Offer not found'
                : 'Offer unavailable'}
          </h1>
          <p role={data.error ? 'alert' : 'status'} className={s.muted}>
            {data.error || 'Reading the marketplace.'}
          </p>
          {!data.loading && (
            <Button variant="outline" onClick={data.refresh}>
              Try again
            </Button>
          )}
        </section>
      )}
      <WalletActivity />
    </div>
  );
}
