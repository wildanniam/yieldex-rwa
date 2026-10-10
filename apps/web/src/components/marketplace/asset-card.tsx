import Link from 'next/link';
import { AssetMark } from '@/components/landing/asset-mark';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  formatAtomic,
  incomePercent,
  termLabel,
  type PreviewListing,
} from './preview-data';
import styles from './marketplace.module.css';

export function AssetCard({
  listing,
  list = false,
}: {
  listing: PreviewListing;
  list?: boolean;
}) {
  return (
    <article
      className={`${styles.card} ${list ? styles.listCard : ''}`}
      data-listing-id={listing.id}
    >
      <div className={styles.cardIdentity}>
        <span className={styles.assetMark} data-asset={listing.ticker}>
          <AssetMark symbol={listing.symbol} />
        </span>
        <div>
          <h2>{listing.company}</h2>
          <p>
            {listing.symbol} <span>· {listing.id}</span>
          </p>
        </div>
        <span
          className={styles.marketTag}
          data-resale={listing.market === 'SECONDARY'}
        >
          {listing.market === 'SECONDARY' ? 'Resale' : 'Primary'}
        </span>
      </div>
      <div className={styles.cardFigure}>
        <span className={styles.smallLabel}>Income share</span>
        <p>
          {incomePercent(listing.incomeBps)}
          <span>%</span>
          <small>{termLabel(listing)}</small>
        </p>
        <div className={styles.shareTrack} aria-hidden="true">
          <span style={{ width: `${listing.incomeBps / 100}%` }} />
        </div>
      </div>
      <dl className={styles.cardTerms}>
        <div>
          <dt>Backing</dt>
          <dd>
            {formatAtomic(listing.backingAtomic, 18, 0)} {listing.ticker}
          </dd>
        </div>
        <div>
          <dt>{listing.market === 'SECONDARY' ? 'Rights holder' : 'Seller'}</dt>
          <dd>{listing.seller}</dd>
        </div>
      </dl>
      <div className={styles.cardBottom}>
        <div>
          <span className={styles.smallLabel}>Fixed price</span>
          <p>
            {formatAtomic(listing.priceAtomic, 6)}
            <small>DemoUSD</small>
          </p>
        </div>
        <Link
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className: styles.offerLink ?? '',
          })}
          href={`/marketplace/${listing.id}`}
          aria-label={`View offer ${listing.id}`}
        >
          <span>View offer</span>
          <Icon name="arrow-up-right" inheritColor alt="" size={16} />
        </Link>
      </div>
    </article>
  );
}
