'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AssetMark } from '@/components/landing/asset-mark';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  formatAtomic,
  incomePercent,
  termLabel,
  type PreviewListing,
} from './preview-data';
import styles from './marketplace.module.css';

/** A visual review, deliberately separate from the verified wallet transaction flow. */
export function BuyModal({ listing }: { listing: PreviewListing }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<'review' | 'payment'>('review');
  const [acknowledged, setAcknowledged] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = priorOverflow;
    };
  }, [open]);

  function reset() {
    setOpen(false);
    setStep('review');
    setAcknowledged(false);
  }
  function show() {
    setStep('review');
    setAcknowledged(false);
    dialog.current?.showModal();
    setOpen(true);
  }

  return (
    <>
      <Button
        className={styles.fullButton}
        size="lg"
        trailingIcon="arrow-right"
        onClick={show}
      >
        Review income rights
      </Button>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="purchase-title"
        onClose={reset}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className={styles.dialogInner}>
          <div className={styles.dialogTop}>
            <span className={styles.previewBadge}>Purchase preview</span>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Close purchase preview"
              onClick={() => dialog.current?.close()}
            >
              <Icon name="x" alt="" inheritColor size={20} />
            </button>
          </div>
          <div
            className={styles.dialogSteps}
            aria-label="Purchase preview steps"
          >
            <span data-active={step === 'review'}>01 Review</span>
            <span aria-hidden="true">—</span>
            <span data-active={step === 'payment'}>02 Payment</span>
          </div>
          <h2 id="purchase-title">
            {step === 'review'
              ? 'Know what you’re buying.'
              : 'One price. Your wallet.'}
          </h2>
          <p className={styles.dialogDescription}>
            {step === 'review'
              ? 'A share of future income, for a defined period.'
              : 'Payment uses DemoUSD on Ethereum Sepolia.'}
          </p>
          <div className={styles.dialogAsset}>
            <span className={styles.assetMark}>
              <AssetMark symbol={listing.symbol} />
            </span>
            <div>
              <strong>{listing.company}</strong>
              <span>
                {listing.id} · {listing.symbol}
              </span>
            </div>
            <span className={styles.marketTag}>
              {listing.market === 'PRIMARY' ? 'Primary' : 'Resale'}
            </span>
          </div>
          <dl className={styles.dialogTerms}>
            <div>
              <dt>Income share</dt>
              <dd>{incomePercent(listing.incomeBps)}%</dd>
            </div>
            <div>
              <dt>
                {listing.market === 'SECONDARY'
                  ? 'Remaining term'
                  : 'Term at purchase'}
              </dt>
              <dd>{termLabel(listing)}</dd>
            </div>
            <div>
              <dt>Income paid in</dt>
              <dd>{listing.symbol}</dd>
            </div>
            <div className={styles.dialogPrice}>
              <dt>Fixed price</dt>
              <dd>
                {formatAtomic(listing.priceAtomic, 6)} <small>DemoUSD</small>
              </dd>
            </div>
          </dl>
          {step === 'review' ? (
            <>
              <p className={styles.quietNote}>
                <Icon name="lock" alt="" inheritColor size={16} />
                The backing stays with its original owner.{' '}
                {listing.market === 'SECONDARY'
                  ? 'The original deadline and prior claims stay unchanged.'
                  : 'The term starts when a purchase is confirmed.'}
              </p>
              <label className={styles.acknowledgement}>
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
                <span>
                  I understand income can be lower than expected or zero, and
                  the purchase price is not refunded.
                </span>
              </label>
              <Button
                className={styles.fullButton}
                size="lg"
                disabled={!acknowledged}
                onClick={() => setStep('payment')}
                trailingIcon="arrow-right"
              >
                Review payment
              </Button>
            </>
          ) : (
            <>
              <div className={styles.paymentNote}>
                <Icon name="wallet" inheritColor alt="" size={22} />
                <div>
                  <strong>Continue with the verified flow</strong>
                  <p>
                    This offer is a UI example. The transaction lab shows
                    available onchain offers and requests wallet confirmation.
                    No purchase has been submitted here.
                  </p>
                </div>
              </div>
              <p className={styles.quietNote}>
                Network fees are paid separately in ETH. Quote comparison does
                not swap your tokens.
              </p>
              <Link
                className={buttonVariants({
                  size: 'lg',
                  className: styles.fullButton ?? '',
                })}
                href="/lab"
                onClick={() => dialog.current?.close()}
              >
                <span>Open transaction lab</span>
                <Icon name="arrow-up-right" inheritColor alt="" size={18} />
              </Link>
              <button
                className={styles.backButton}
                type="button"
                onClick={() => setStep('review')}
              >
                Back to review
              </button>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
