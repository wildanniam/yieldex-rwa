'use client';
/* RPC snapshots, EIP-1193 identity and the persisted transaction journal are external
 * sources. These effects synchronize them into the view; they never initiate a send. */
/* eslint-disable react-hooks/set-state-in-effect */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import type { DeploymentManifest } from '@rwa/shared/config';
import type {
  ListingDetail,
  ListingResponse,
  PreparedIntent,
  PreparedIntentResponse,
} from '@rwa/shared';
import { Button } from '@/components/ui/button';
import { checkedResponse, marketRequest, walletError } from './client-api';
import { useWalletSession } from './use-wallet-session';
import { WalletControls } from './wallet-access';
import { validJournalEntry, type TrackedTransaction } from './wallet';
import s from './live.module.css';

export function LiveListing({
  manifest,
  listingKey,
}: {
  manifest: DeploymentManifest;
  listingKey: string;
}) {
  const access = useWalletSession(manifest);
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState<PreparedIntent | null>(null);
  const [busy, setBusy] = useState(false);
  const [tracked, setTracked] = useState<TrackedTransaction[]>([]);
  const [now, setNow] = useState(0);
  const lock = useRef(false);
  const sequence = useRef(0);
  const watching = useRef(new Set<string>());
  const trackedRef = useRef(tracked);
  const pollReceipts = useRef<(() => void) | null>(null);
  const journalKey = `rwa-transactions:${manifest.chainId}:${manifest.market}`;
  const id = listingKey.split(':').at(-1)!;
  const refresh = useCallback(async () => {
    const token = ++sequence.current;
    try {
      const data = checkedResponse<ListingResponse>(
        'api.ListingResponse',
        await marketRequest(
          `/chains/${manifest.chainId}/markets/${manifest.market}/listings/${id}`,
        ),
      );
      if (sequence.current !== token) return;
      if (data.data.listing.listingKey !== listingKey)
        throw new Error('Identitas listing tidak cocok.');
      setDetail((previous) =>
        previous?.listing.listingKey === listingKey &&
        BigInt(previous.listing.snapshot.blockNumber) >
          BigInt(data.data.listing.snapshot.blockNumber)
          ? previous
          : data.data,
      );
    } catch (error) {
      if (sequence.current === token) {
        setDetail(null);
        setNotice(walletError(error));
      }
    } finally {
      if (sequence.current === token) setLoading(false);
    }
  }, [manifest.chainId, manifest.market, id, listingKey]);
  useEffect(() => {
    setDetail(null);
    setPreview(null);
    setLoading(true);
    setNotice('');
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => {
      // Invalidate any read still pending when this route unmounts.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      sequence.current++;
      clearInterval(timer);
    };
  }, [refresh]);
  useEffect(() => {
    const timer = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setPreview(null);
  }, [access.identity.wallet, access.identity.chainId, access.session?.userId]);
  useEffect(() => {
    try {
      const rows: unknown = JSON.parse(
        localStorage.getItem(journalKey) ?? '[]',
      );
      if (Array.isArray(rows))
        setTracked(
          rows
            .filter(
              (row): row is TrackedTransaction =>
                validJournalEntry(row) &&
                row.chainId === manifest.chainId &&
                row.market === manifest.market,
            )
            .slice(-20),
        );
    } catch {
      /* An unavailable or invalid journal never sends a transaction. */
    }
  }, [journalKey, manifest.chainId, manifest.market]);
  const remember = useCallback(
    (item: TrackedTransaction) => {
      setTracked((old) => {
        const next = [...old.filter((t) => t.hash !== item.hash), item].slice(
          -20,
        );
        try {
          localStorage.setItem(journalKey, JSON.stringify(next));
        } catch {
          /* The visible hash remains available. */
        }
        return next;
      });
    },
    [journalKey],
  );
  useEffect(() => {
    trackedRef.current = tracked;
    pollReceipts.current?.();
  }, [tracked]);
  useEffect(() => {
    if (!access.wallet || access.identity.chainId !== manifest.chainId) return;
    const wallet = access.wallet;
    let mounted = true;
    const tick = () => {
      for (const item of trackedRef.current) {
        if (
          item.wallet !== access.identity.wallet ||
          ['FINALIZED', 'REVERTED', 'CANCELLED'].includes(item.status) ||
          watching.current.has(item.hash)
        )
          continue;
        watching.current.add(item.hash);
        const epoch = access.epoch.current;
        void wallet
          .track(item, (update) => {
            if (mounted && epoch === access.epoch.current) remember(update);
          })
          .then((result) => {
            if (!mounted || epoch !== access.epoch.current) return;
            if (result.listing?.listing.listingKey === listingKey)
              setDetail((previous) =>
                previous?.listing.listingKey === listingKey &&
                BigInt(previous.listing.snapshot.blockNumber) >
                  BigInt(result.listing!.listing.snapshot.blockNumber)
                  ? previous
                  : result.listing!,
              );
            if (
              ['PENDING', 'UNKNOWN', 'REORGED'].includes(item.status) &&
              ['CONFIRMED', 'FINALIZED'].includes(result.tracked.status)
            ) {
              setPreview(null);
              setNotice(
                'Receipt terverifikasi. Buat review baru sebelum langkah berikutnya.',
              );
            }
          })
          .catch(() => {
            if (mounted && epoch === access.epoch.current)
              setNotice(
                'Receipt masih diperiksa. Hash tersimpan; jangan mengirim ulang transaksi.',
              );
          })
          .finally(() => watching.current.delete(item.hash));
      }
    };
    pollReceipts.current = tick;
    tick();
    const timer = setInterval(tick, 5000);
    return () => {
      mounted = false;
      pollReceipts.current = null;
      clearInterval(timer);
    };
  }, [
    access.wallet,
    access.identity.chainId,
    access.identity.wallet,
    access.epoch,
    manifest.chainId,
    listingKey,
    remember,
  ]);
  async function run(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice('');
    try {
      await work();
    } catch (error) {
      setNotice(walletError(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function prepare() {
    if (!access.wallet || !access.session)
      throw new Error('Sign in dengan wallet sebelum review pembelian.');
    const version = access.epoch.current;
    setPreview(null);
    const response = checkedResponse<PreparedIntentResponse>(
      'api.PreparedIntentResponse',
      await marketRequest('/transaction-intents', {
        method: 'POST',
        headers: { 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ action: 'BUY_LISTING', listingKey }),
      }),
    );
    if (version !== access.epoch.current) return;
    const p = response.data;
    if (
      p.request.action !== 'BUY_LISTING' ||
      p.request.listingKey !== listingKey ||
      p.walletAddress !== access.identity.wallet ||
      p.chainId !== manifest.chainId
    )
      throw new Error('Context review berubah. Hubungkan kembali wallet.');
    setPreview(p);
    if (p.purchaseSummary)
      setDetail((previous) =>
        previous?.listing.listingKey === listingKey &&
        BigInt(previous.listing.snapshot.blockNumber) >
          BigInt(p.purchaseSummary!.listing.snapshot.blockNumber)
          ? previous
          : p.purchaseSummary!,
      );
    setNotice(
      p.state === 'BLOCKED'
        ? 'Listing belum dapat dibeli. Periksa alasan di bawah.'
        : 'Review diperbarui dari kontrak. Wallet hanya terbuka jika kamu menekan tombol konfirmasi.',
    );
  }
  async function send() {
    if (!preview || !access.wallet || !access.session) return;
    const p = preview;
    // Clear immediately: reject, repeat-click and rerender never reuse a consumed confirmation.
    setPreview(null);
    const version = access.epoch.current;
    const item = await access.wallet.send(p, remember);
    const step = p.steps[0]!;
    // Receipt verification remains independent from an unavailable intent submission endpoint.
    await marketRequest(`/transaction-intents/${p.intentId}/submissions`, {
      method: 'POST',
      headers: { 'idempotency-key': crypto.randomUUID() },
      body: JSON.stringify({
        chainId: p.chainId,
        transactionHash: item.hash,
        stepId: step.stepId,
      }),
    }).catch(() => {});
    if (version === access.epoch.current)
      setNotice(
        'Transaksi dikirim. Menunggu receipt; tidak ada pengiriman ulang otomatis.',
      );
  }
  const price = detail
    ? `${formatUnits(BigInt(detail.listing.priceAtomic), detail.listing.paymentToken.decimals)}`
    : '—';
  const pending = tracked.some(
    (t) =>
      t.wallet === access.identity.wallet &&
      ['PENDING', 'UNKNOWN', 'REORGED'].includes(t.status),
  );
  const expired = preview !== null && now >= preview.expiresAt;
  const canSend =
    detail &&
    preview &&
    !expired &&
    ['READY', 'NEEDS_APPROVAL'].includes(preview.state) &&
    access.session &&
    !pending;
  return (
    <div className={s.page}>
      <Link href="/chat" className={s.back}>
        ← Back to assistant
      </Link>
      <header className={s.heading}>
        <p className={s.eyebrow}>
          LIVE LISTING /{' '}
          {manifest.chainId === 11155111 ? 'SEPOLIA' : 'LOCAL CHAIN'}
        </p>
        <h1>
          Know the terms.
          <br />
          <span>Then make your move.</span>
        </h1>
        <p>
          Data dari marketplace onchain. Harga, status dan wallet diperiksa
          kembali sebelum transaksi.
        </p>
      </header>
      {loading ? (
        <p role="status">Loading listing…</p>
      ) : detail ? (
        <section className={s.offer} aria-label="Live listing details">
          <div className={s.offerTop}>
            <div>
              <h2>{detail.asset.token.symbol}</h2>
              <p className={s.muted}>
                {detail.listing.kind === 'PRIMARY'
                  ? 'Primary income rights'
                  : 'Resale · remaining term'}{' '}
                · Listing #{detail.listing.listingId}
              </p>
            </div>
            <span className={s.badge}>{detail.listing.displayStatus}</span>
          </div>
          <p className={s.price}>
            {price} <small>{detail.listing.paymentToken.symbol}</small>
          </p>
          <dl className={s.facts}>
            <div>
              <dt>Income share</dt>
              <dd>{detail.position.incomeBps / 100}%</dd>
            </div>
            <div>
              <dt>
                {detail.listing.kind === 'PRIMARY'
                  ? 'Term starts at purchase'
                  : 'Rights expire'}
              </dt>
              <dd>
                {detail.listing.kind === 'PRIMARY'
                  ? `${detail.position.durationSeconds / 86400} days`
                  : new Date(detail.position.endAt! * 1000).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt>Backing retained by seller</dt>
              <dd>
                {detail.position.principalTokenAmountAtomic === null
                  ? 'Conversion unavailable'
                  : `${formatUnits(BigInt(detail.position.principalTokenAmountAtomic), detail.asset.token.decimals)} ${detail.asset.token.symbol}`}
              </dd>
            </div>
            <div>
              <dt>Chain snapshot</dt>
              <dd>
                #{detail.listing.snapshot.blockNumber} ·{' '}
                {detail.listing.snapshot.finality}
              </dd>
            </div>
          </dl>
          <p className={s.muted}>
            Yang dibeli adalah hak pendapatan, bukan aset pokok. Pendapatan bisa
            nol; harga pembelian tidak dikembalikan saat hak berakhir.
          </p>
        </section>
      ) : (
        <section className={s.offer}>
          <h2>Listing belum tersedia</h2>
          <p className={s.muted}>
            Data tidak diganti dengan contoh. Muat ulang atau pilih listing lain
            dari assistant.
          </p>
          <Button variant="outline" onClick={() => void refresh()}>
            Try again
          </Button>
        </section>
      )}
      <WalletControls access={access} chainId={manifest.chainId} />
      <section className={s.review} aria-label="Purchase review">
        <h2>Review your purchase</h2>
        <p className={s.muted}>
          Persetujuan token dan pembelian adalah dua langkah terpisah. Setelah
          approval selesai, review ulang untuk membeli.
        </p>
        <div className={s.actions}>
          <Button
            isLoading={busy}
            disabled={!access.session || !detail || pending}
            onClick={() => void run(prepare)}
          >
            Refresh purchase review
          </Button>
        </div>
        {preview && (
          <>
            <dl className={s.facts}>
              <div>
                <dt>Status</dt>
                <dd>{expired ? 'EXPIRED' : preview.state}</dd>
              </div>
              <div>
                <dt>Wallet</dt>
                <dd>
                  {preview.walletAddress.slice(0, 8)}…
                  {preview.walletAddress.slice(-6)}
                </dd>
              </div>
            </dl>
            <ul>
              {preview.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            {preview.state === 'NEEDS_APPROVAL' && (
              <p className={s.muted}>
                Approve tepat {price} {detail?.listing.paymentToken.symbol}{' '}
                untuk kontrak marketplace {manifest.market}. Ini belum membeli
                hak.
              </p>
            )}
            <div className={s.actions}>
              <Button
                variant="accent"
                disabled={!canSend || busy}
                onClick={() => void run(send)}
              >
                {preview.state === 'NEEDS_APPROVAL'
                  ? 'Confirm token approval in wallet'
                  : 'Confirm purchase in wallet'}
              </Button>
            </div>
          </>
        )}
      </section>
      {notice && (
        <p className={s.notice} role="status" aria-live="polite">
          {notice}
        </p>
      )}
      {tracked.some((t) => t.wallet === access.identity.wallet) && (
        <section className={s.review}>
          <h2>Wallet activity</h2>
          <ul className={s.transactions}>
            {tracked
              .filter((t) => t.wallet === access.identity.wallet)
              .map((t) => (
                <li key={t.hash}>
                  <span className={s.badge}>{t.status}</span>{' '}
                  {manifest.chainId === 11155111 ? (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${t.replacementHash ?? t.hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t.replacementHash ?? t.hash}
                    </a>
                  ) : (
                    <code>{t.replacementHash ?? t.hash}</code>
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
