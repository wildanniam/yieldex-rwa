'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { PreparedIntent, PrepareIntentRequest } from '@rwa/shared';
import { Button } from '@/components/ui/button';
import { usePlatform } from './platform-provider';
import { walletError } from './client-api';
import { amount, shortAddress, positionHref } from './data';
import s from './live.module.css';

const actionLabels: Record<PrepareIntentRequest['action'], string> = {
  BUY_LISTING: 'Purchase income rights',
  CREATE_PRIMARY_LISTING: 'Create listing',
  CANCEL_LISTING: 'Cancel listing',
  CREATE_SECONDARY_LISTING: 'List rights for resale',
  RELIST_PRIMARY_POSITION: 'Relist backing',
  CHECKPOINT_POSITION: 'Process income',
  SETTLE_POSITION: 'Settle position',
  RELEASE_PRINCIPAL: 'Release backing',
  CLAIM_INCOME: 'Claim income',
};
export function TransactionPanel({
  request,
  buildRequest,
  label,
  children,
}: {
  request?: PrepareIntentRequest;
  buildRequest?: () => Promise<PrepareIntentRequest>;
  label: string;
  children?: ReactNode;
}) {
  const { access, manifest, tracked, remember } = usePlatform();
  const [preview, setPreview] = useState<PreparedIntent | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(0);
  const lock = useRef(false),
    generation = useRef(0),
    mounted = useRef(false);
  const requestKey = JSON.stringify(request);
  const pending = tracked.some((t) =>
    ['PENDING', 'UNKNOWN', 'REORGED'].includes(t.status),
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Invalidate the latest in-flight request at cleanup.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
    };
  }, []);
  useEffect(() => {
    generation.current++;
    setPreview(null);
    setNotice('');
  }, [
    requestKey,
    access.identity.wallet,
    access.identity.chainId,
    access.session?.userId,
  ]);
  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  async function act(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice('');
    try {
      await work();
    } catch (error) {
      if (mounted.current) setNotice(walletError(error));
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function prepare() {
    const wallet = access.wallet;
    if (!wallet || !access.identity.wallet)
      throw new Error('Connect your wallet first.');
    const version = generation.current,
      identityVersion = access.epoch.current;
    setPreview(null);
    const input = buildRequest ? await buildRequest() : request;
    if (!input) throw new Error('Complete the terms first.');
    const result = await wallet.prepare(input);
    if (
      !mounted.current ||
      generation.current !== version ||
      access.epoch.current !== identityVersion
    )
      return;
    setPreview(result);
  }
  async function send() {
    if (!preview || !access.wallet || pending) return;
    const p = preview,
      version = generation.current;
    setPreview(null);
    await access.wallet.send(p, remember);
    if (mounted.current && generation.current === version)
      setNotice(
        'Submitted. Track the receipt below; no automatic resubmission.',
      );
  }
  const expired = preview && now >= preview.expiresAt;
  const step = preview?.steps[0];
  const token =
    step &&
    (step.to === manifest.paymentToken.address
      ? manifest.paymentToken
      : manifest.assets.find((a) => a.token === step.to));
  const tokenDecimals =
    token && ('decimals' in token ? token.decimals : token.tokenDecimals);
  return (
    <section className={s.review} aria-label={label}>
      <h2>{label}</h2>
      {children}
      {!access.identity.wallet ? (
        <p className={s.muted}>
          <Link href="/wallet">Connect your wallet</Link> to review this action.
          No login signature is required.
        </p>
      ) : access.identity.chainId !== manifest.chainId ? (
        <p className={s.notice}>
          <Link href="/wallet">Switch to the marketplace network</Link> before
          continuing.
        </p>
      ) : (
        <Button
          disabled={busy || pending}
          isLoading={busy}
          onClick={() => void act(prepare)}
        >
          {preview ? 'Refresh review' : `Review ${label.toLowerCase()}`}
        </Button>
      )}
      {pending && (
        <p role="status" className={s.muted}>
          A transaction is still being verified. Check activity before sending
          another.
        </p>
      )}
      {preview && (
        <div className={s.transactionDetails}>
          <span className={s.badge}>
            {expired
              ? 'Review expired'
              : preview.state === 'NEEDS_APPROVAL'
                ? 'Token approval needed'
                : preview.state === 'READY'
                  ? 'Simulation passed'
                  : 'Action unavailable'}
          </span>
          <dl className={s.facts}>
            <div>
              <dt>Action</dt>
              <dd>{actionLabels[preview.request.action]}</dd>
            </div>
            <div>
              <dt>Wallet</dt>
              <dd>{shortAddress(preview.walletAddress)}</dd>
            </div>
            <div>
              <dt>Network</dt>
              <dd>
                {manifest.chainId === 11155111
                  ? 'Ethereum Sepolia'
                  : 'Local chain'}
              </dd>
            </div>
            <div>
              <dt>Review valid until</dt>
              <dd>{new Date(preview.expiresAt * 1000).toLocaleTimeString()}</dd>
            </div>
          </dl>
          {preview.purchaseSummary && (
            <p className={s.muted}>
              Pay{' '}
              {amount(
                preview.purchaseSummary.listing.priceAtomic,
                preview.purchaseSummary.listing.paymentToken.decimals,
              )}{' '}
              {preview.purchaseSummary.listing.paymentToken.symbol} to{' '}
              {shortAddress(preview.purchaseSummary.listing.seller)} for{' '}
              {preview.purchaseSummary.position.incomeBps / 100}% of allocated
              income. Backing stays with its principal owner. Income can be
              zero; the purchase price is not refunded.
            </p>
          )}
          {preview.blockers.length > 0 && (
            <ul role="alert">
              {preview.blockers.map((reason) => (
                <li key={reason}>
                  {reason.replaceAll('_', ' ').toLowerCase()}
                </li>
              ))}
            </ul>
          )}
          {preview.state === 'NEEDS_APPROVAL' && (
            <p className={s.muted}>
              Approve exactly{' '}
              {tokenDecimals === undefined
                ? 'Unavailable'
                : amount(
                    step?.allowanceAmountAtomic ?? null,
                    tokenDecimals,
                  )}{' '}
              {token?.symbol ?? 'tokens'} for the marketplace. Approval does not
              complete {label.toLowerCase()}. After the receipt, review again to
              continue.
            </p>
          )}
          {preview.state === 'READY' && (
            <p className={s.muted}>
              Checked against block #{preview.preparedAtSnapshot.blockNumber}.
              Network fees are charged by your wallet. Simulation does not
              guarantee confirmation.
            </p>
          )}
          {['READY', 'NEEDS_APPROVAL'].includes(preview.state) && (
            <Button
              variant="accent"
              disabled={busy || pending || !!expired}
              onClick={() => void act(send)}
            >
              {preview.state === 'NEEDS_APPROVAL'
                ? 'Approve tokens in wallet'
                : 'Confirm in wallet'}
            </Button>
          )}
        </div>
      )}
      {notice && (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      )}
    </section>
  );
}

export function WalletActivity() {
  const { tracked, manifest, trackingError, positions, verifiedReceipts } =
    usePlatform();
  return (
    <section className={s.review} aria-label="Recent transactions">
      <h2>Recent transactions</h2>
      <p className={s.muted}>
        Submitted from this browser. Receipt status is verified onchain.
      </p>
      {trackingError && <p role="status">{trackingError}</p>}
      {positions.length > 0 && (
        <div className={s.actions}>
          {positions.map((p) => (
            <Link
              className={s.back}
              key={p.positionKey}
              href={positionHref(p.positionKey)}
            >
              View position #{p.positionId} →
            </Link>
          ))}
        </div>
      )}
      {!tracked.length ? (
        <p className={s.muted}>
          No transactions from this wallet on this browser yet.
        </p>
      ) : (
        <ul className={s.transactions}>
          {tracked
            .slice()
            .reverse()
            .map((t) => (
              <li key={t.hash}>
                <span className={s.badge}>
                  {['CONFIRMED', 'FINALIZED'].includes(t.status) &&
                  !verifiedReceipts.has(t.hash)
                    ? 'checking receipt'
                    : t.status.toLowerCase()}
                </span>
                {manifest.chainId === 11155111 ? (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${t.replacementHash ?? t.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortAddress(t.replacementHash ?? t.hash)} ↗
                  </a>
                ) : (
                  <code>{shortAddress(t.replacementHash ?? t.hash)}</code>
                )}
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
