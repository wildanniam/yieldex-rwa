'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { PrepareIntentRequest } from '@rwa/shared';
import { Button } from '@/components/ui/button';
import { usePlatform } from './platform-provider';
import { walletError } from './client-api';
import { amount, listingHref } from './data';
import { initialCheckout, ListingCheckoutFlow } from './listing-checkout-flow';
import s from './listing-checkout.module.css';

export function ListingCheckout({
  buildRequest,
  onBusyChange,
}: {
  buildRequest: () => Promise<PrepareIntentRequest>;
  onBusyChange: (busy: boolean) => void;
}) {
  const { access, tracked, remember, manifest } = usePlatform();
  const [state, setState] = useState(initialCheckout);
  const flow = useRef<ListingCheckoutFlow | null>(null);
  const clickLock = useRef(false);
  const latest = useRef({ buildRequest, onBusyChange, access, remember });
  useEffect(() => {
    latest.current = { buildRequest, onBusyChange, access, remember };
  });
  useEffect(
    () => () => {
      flow.current?.dispose();
      flow.current = null;
    },
    [],
  );
  const busy = ['checking', 'wallet', 'confirming'].includes(state.stage);
  const otherPending = tracked.some(
    (t) =>
      t.hash !== state.submitted?.hash &&
      ['PENDING', 'UNKNOWN', 'REORGED'].includes(t.status),
  );
  const approving = state.preview?.state === 'NEEDS_APPROVAL';
  const complete = state.stage === 'complete';
  const ready = state.preview?.state === 'READY';
  const blockers = state.preview?.blockers ?? [];
  const step = state.preview?.steps[0];
  const token = manifest.assets.find((a) => a.token === step?.to);
  const actionLabel = state.submitted
    ? 'Check transaction status'
    : !state.preview
      ? 'Check & continue'
      : approving
        ? '1. Approve tokens'
        : ready
          ? '2. Create listing'
          : 'Check again';
  async function proceed() {
    if (!latest.current.access.wallet || otherPending || clickLock.current)
      return;
    clickLock.current = true;
    if (!flow.current) {
      const epoch = access.epoch.current;
      flow.current = new ListingCheckoutFlow(
        access.wallet!,
        () => latest.current.buildRequest(),
        remember,
        setState,
        () => latest.current.access.epoch.current === epoch,
      );
    }
    latest.current.onBusyChange(true);
    try {
      await flow.current.continue();
    } finally {
      clickLock.current = false;
      latest.current.onBusyChange(false);
    }
  }
  let title = 'Two steps. One listing.';
  let description =
    'First allow the backing deposit, then confirm your listing. Each step may open your wallet.';
  if (state.stage === 'checking') {
    title = 'Checking your listing…';
    description =
      'Checking your token allowance and the latest contract state.';
  } else if (state.stage === 'wallet') {
    title = approving
      ? '1/2 · Approve in your wallet'
      : '2/2 · Confirm your listing';
    description = approving
      ? 'This only gives permission to deposit your backing. Your listing is not created yet.'
      : 'Confirm to deposit your backing and publish this offer.';
  } else if (state.stage === 'confirming') {
    title = approving
      ? '1/2 · Verifying approval…'
      : '2/2 · Creating your listing…';
    description =
      'Waiting for the transaction receipt. Keep this page open; your terms are saved here.';
  } else if (complete) {
    title = 'Your listing is created';
    description =
      'The creation transaction is confirmed. Open your offer to see its current status.';
  } else if (state.approvalDone) {
    title = 'Approval ready. Create your listing next.';
    description =
      'Your tokens are approved. Your listing is not created yet — complete step 2 below.';
  } else if (approving) {
    title = '1/2 · Allow the backing deposit';
    description =
      'After approval confirms, step 2 becomes available automatically here.';
  }
  if (state.submitted && !busy) {
    title = 'Transaction needs verification';
    description =
      'Check the existing transaction below. We will not send it again.';
  }
  return (
    <section className={s.checkout} aria-label="Complete your listing">
      <ol className={s.steps} aria-label="Wallet transaction steps">
        <li
          data-active={!state.approvalDone && !complete}
          data-done={state.approvalDone || complete}
          aria-current={!state.approvalDone && !complete ? 'step' : undefined}
        >
          <span>{state.approvalDone || complete ? '✓' : '1'}</span>
          <div>
            <strong>Approve tokens</strong>
            <small>
              {state.approvalDone || complete
                ? 'Permission ready'
                : 'Allow the deposit'}
            </small>
          </div>
        </li>
        <li
          data-active={state.approvalDone && !complete}
          data-done={complete}
          aria-current={state.approvalDone && !complete ? 'step' : undefined}
        >
          <span>{complete ? '✓' : '2'}</span>
          <div>
            <strong>Create listing</strong>
            <small>{complete ? 'Confirmed' : 'Publish your offer'}</small>
          </div>
        </li>
      </ol>
      <div
        className={s.status}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {approving && token && !state.approvalDone && (
        <p className={s.amount}>
          Approve{' '}
          {amount(step?.allowanceAmountAtomic ?? null, token.tokenDecimals)}{' '}
          {token.symbol} for this offer.
        </p>
      )}
      {blockers.length > 0 && (
        <ul role="alert">
          {blockers.map((b) => (
            <li key={b}>{b.replaceAll('_', ' ').toLowerCase()}</li>
          ))}
        </ul>
      )}
      {state.error != null && (
        <div role="alert" className={s.error}>
          {walletError(state.error)}
          {state.approvalDone && !state.submitted && (
            <p>Approval is retained. Continue below to create your listing.</p>
          )}
        </div>
      )}
      {complete && state.listing ? (
        <Link
          className={s.successLink}
          href={listingHref(state.listing.listing.listingKey)}
        >
          View listing #{state.listing.listing.listingId} →
        </Link>
      ) : (
        <Button
          variant="accent"
          className={s.cta}
          disabled={busy || otherPending}
          isLoading={busy}
          onClick={() => void proceed()}
        >
          {busy
            ? state.stage === 'checking'
              ? 'Checking…'
              : state.stage === 'wallet'
                ? 'Waiting for wallet…'
                : 'Verifying transaction…'
            : actionLabel}
        </Button>
      )}
      {otherPending && (
        <p className={s.amount} role="status">
          Another transaction is being verified. Check Recent transactions
          before continuing.
        </p>
      )}
      {!complete && (
        <p className={s.hint}>
          Approval alone does not publish an offer. Network fees apply to each
          transaction.
        </p>
      )}
    </section>
  );
}
