// Preserves PR #12's offer terms, income lifecycle, and purchase-review anatomy.
import Link from 'next/link';
import { AssetMark } from '@/components/landing/asset-mark';
import { Icon } from '@/components/ui/icon';
import { BuyModal } from './buy-modal';
import {
  formatAtomic,
  incomePercent,
  termLabel,
  type PreviewListing,
} from './preview-data';
import styles from './marketplace.module.css';

export function ListingDetail({ listing }: { listing: PreviewListing }) {
  const secondary = listing.market === 'SECONDARY';
  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/marketplace">
          <Icon name="arrow-left" inheritColor alt="" size={16} />
          Marketplace
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{listing.id}</span>
        <span className={styles.previewBadge}>UI preview</span>
      </nav>
      <div className={styles.detailLayout}>
        <div className={styles.detailContent}>
          <header className={styles.detailHeading}>
            <span className={`${styles.assetMark} ${styles.largeMark}`}>
              <AssetMark symbol={listing.symbol} />
            </span>
            <div>
              <span className={styles.eyebrow}>
                {secondary
                  ? 'A new owner. The same deadline.'
                  : 'The asset stays. The income moves.'}
              </span>
              <h1>
                {listing.company}
                <br />
                income rights.
              </h1>
              <p>
                {listing.symbol} <span>·</span> Offered by {listing.seller}
              </p>
            </div>
          </header>
          <section
            className={styles.incomePanel}
            aria-label="Income rights overview"
          >
            <div className={styles.incomeFigure}>
              <p>
                {incomePercent(listing.incomeBps)}
                <span>%</span>
              </p>
              <div>
                <strong>of the income</strong>
                <span>
                  {secondary
                    ? `for the ${listing.termDays} days remaining`
                    : `for ${listing.termDays} days from purchase`}
                </span>
              </div>
            </div>
            <div className={styles.shareTrack} aria-hidden="true">
              <span style={{ width: `${listing.incomeBps / 100}%` }} />
            </div>
            <div className={styles.splitLabels}>
              <span>Your income share</span>
              <span>
                {incomePercent(10000 - listing.incomeBps)}% retained by the
                original owner
              </span>
            </div>
            <div className={styles.backingStrip}>
              <span className={styles.smallVault}>
                <Icon name="vault" inheritColor alt="" size={24} />
              </span>
              <div>
                <strong>
                  {formatAtomic(listing.backingAtomic, 18, 0)} {listing.symbol}
                </strong>
                <span>Locked backing · ownership retained</span>
              </div>
              <Icon name="lock" inheritColor alt="" size={17} />
            </div>
          </section>
          <section className={styles.detailSection}>
            <h2>The terms, clearly.</h2>
            <dl className={styles.termGrid}>
              <div>
                <dt>Offer type</dt>
                <dd>
                  {secondary ? 'Whole position resale' : 'Primary income offer'}
                </dd>
              </div>
              <div>
                <dt>Income token</dt>
                <dd>{listing.symbol}</dd>
              </div>
              <div>
                <dt>{secondary ? 'Time remaining' : 'Term begins'}</dt>
                <dd>
                  {secondary ? termLabel(listing) : 'At confirmed purchase'}
                </dd>
              </div>
              <div>
                <dt>{secondary ? 'Original deadline' : 'After the term'}</dt>
                <dd>
                  {secondary
                    ? 'Does not reset'
                    : 'Future income returns to owner'}
                </dd>
              </div>
            </dl>
          </section>
          <section className={styles.detailSection}>
            <h2>From purchase to claim.</h2>
            <ol className={styles.lifecycle}>
              <li>
                <span>
                  <Icon name="receipt" inheritColor alt="" size={20} />
                </span>
                <strong>Buy the rights</strong>
                <p>
                  Pay the agreed price once. The backing remains in the vault.
                </p>
              </li>
              <li>
                <span>
                  <Icon name="coins" inheritColor alt="" size={20} />
                </span>
                <strong>Income is allocated</strong>
                <p>
                  Eligible income during the term is split by the agreed share.
                </p>
              </li>
              <li>
                <span>
                  <Icon name="wallet" inheritColor alt="" size={20} />
                </span>
                <strong>Claim your share</strong>
                <p>
                  Claim in {listing.symbol}. Allocated claims survive the
                  deadline.
                </p>
              </li>
            </ol>
            {secondary && (
              <p className={styles.secondaryNote}>
                You acquire the whole remaining position. Income already
                allocated to a previous holder stays with that holder.
              </p>
            )}
          </section>
        </div>
        <aside className={styles.buyAside}>
          <section className={styles.buyPanel}>
            <div className={styles.buyPanelTop}>
              <span className={styles.eyebrow}>Make the income yours</span>
              <span className={styles.marketTag} data-resale={secondary}>
                {secondary ? 'Resale' : 'Primary'}
              </span>
            </div>
            <p className={styles.buyPrice}>
              {formatAtomic(listing.priceAtomic, 6)}
              <span>DemoUSD</span>
            </p>
            <p className={styles.priceHint}>One fixed upfront price.</p>
            <dl className={styles.buySummary}>
              <div>
                <dt>Your income share</dt>
                <dd>{incomePercent(listing.incomeBps)}%</dd>
              </div>
              <div>
                <dt>{secondary ? 'Time remaining' : 'Duration'}</dt>
                <dd>{termLabel(listing)}</dd>
              </div>
              <div>
                <dt>Paid out in</dt>
                <dd>{listing.symbol}</dd>
              </div>
            </dl>
            <BuyModal listing={listing} />
            <p className={styles.buyFootnote}>
              Preview the terms before continuing to a wallet flow.
            </p>
          </section>
          <div className={styles.riskNote}>
            <Icon name="info" inheritColor alt="" size={18} />
            <p>
              <strong>A fixed price, not a fixed return.</strong>Income may be
              zero. The upfront price is not refunded when the term ends.
            </p>
          </div>
        </aside>
      </div>
      <p className={styles.previewNote}>
        Illustrative offer for design review. Actual Sepolia tokens are
        simulated; this page does not represent a live listing.
      </p>
    </div>
  );
}
