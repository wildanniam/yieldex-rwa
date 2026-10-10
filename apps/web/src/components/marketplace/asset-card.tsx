'use client';
import Link from 'next/link';
import type { ListingDetail } from '@rwa/shared';
import { AssetMark } from '@/components/landing/asset-mark';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  amount,
  company,
  listingHref,
  remainingTerm,
  shortAddress,
} from '@/features/marketplace/data';
import styles from './marketplace.module.css';

export function AssetCard({
  listing: d,
  list = false,
}: {
  listing: ListingDetail;
  list?: boolean;
}) {
  const { listing, position, asset } = d;
  return (
    <article
      className={`${styles.card} ${list ? styles.listCard : ''}`}
      data-listing-id={listing.listingKey}
    >
      <div className={styles.cardIdentity}>
        <span className={styles.assetMark}>
          <AssetMark symbol={asset.token.symbol} />
        </span>
        <div>
          <h2>{company(asset.token.symbol)}</h2>
          <p>
            {asset.token.symbol} <span>· #{listing.listingId}</span>
          </p>
        </div>
        <span
          className={styles.marketTag}
          data-resale={listing.kind === 'SECONDARY'}
        >
          {listing.kind === 'SECONDARY' ? 'Resale' : 'Primary'}
        </span>
      </div>
      <div className={styles.cardFigure}>
        <span className={styles.smallLabel}>Income share</span>
        <p>
          {position.incomeBps / 100}
          <span>%</span>
          <small>{remainingTerm(d)}</small>
        </p>
        <div className={styles.shareTrack} aria-hidden="true">
          <span style={{ width: `${position.incomeBps / 100}%` }} />
        </div>
      </div>
      <dl className={styles.cardTerms}>
        <div>
          <dt>Backing</dt>
          <dd>
            {amount(position.principalTokenAmountAtomic, asset.token.decimals)}{' '}
            {asset.token.symbol}
          </dd>
        </div>
        <div>
          <dt>Seller</dt>
          <dd>{shortAddress(listing.seller)}</dd>
        </div>
      </dl>
      <div className={styles.cardBottom}>
        <div>
          <span className={styles.smallLabel}>Fixed price</span>
          <p>
            {amount(listing.priceAtomic, listing.paymentToken.decimals)}
            <small>{listing.paymentToken.symbol}</small>
          </p>
        </div>
        <Link
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className: styles.offerLink ?? '',
          })}
          href={listingHref(listing.listingKey)}
          aria-label={`View offer ${listing.listingId}`}
        >
          View offer
          <Icon name="arrow-up-right" inheritColor alt="" size={16} />
        </Link>
      </div>
    </article>
  );
}
