'use client';
import { useEffect, useState } from 'react';
import type { AssistantCard, ListingDetail, TokenRef } from '@rwa/shared';
import { validateData } from '@rwa/shared/validation';
import { formatUnits } from 'viem';
import styles from './chat.module.css';

export const amount = (
  atomic: string | null,
  token: Pick<TokenRef, 'decimals' | 'symbol'>,
) =>
  atomic === null
    ? 'Belum tersedia'
    : `${formatUnits(BigInt(atomic), token.decimals)} ${token.symbol}`;
const time = (unix: number) => new Date(unix * 1000).toLocaleString('id-ID');
export function parseCard(threadId: string, toolCallId: string, raw: string) {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('kind' in value)) return null;
    const parsed = validateData('api.AssistantCard', {
      cardId: `${threadId}:${toolCallId}:${value.kind}`,
      toolCallId,
      kind: value.kind,
      payload: value.payload,
    });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
function ListingView({ data }: { data: ListingDetail }) {
  const { listing: l, position: p, asset: a } = data;
  return (
    <div className={styles.row}>
      <strong>
        {a.token.symbol} · {l.kind} · #{l.listingId}
      </strong>
      <p>
        Harga hak: <b>{amount(l.priceAtomic, l.paymentToken)}</b>
      </p>
      <p>
        Bagian pendapatan: {formatUnits(BigInt(p.incomeBps), 2)}% (bukan APY).
      </p>
      <p>
        Backing: {amount(p.principalTokenAmountAtomic, a.token)} ·{' '}
        {p.principalShares} shares
      </p>
      <p>
        {l.kind === 'PRIMARY'
          ? `Durasi sejak dibeli: ${p.durationSeconds} detik`
          : `Hak berakhir: ${p.endAt === null ? 'Belum tersedia' : time(p.endAt)}`}
      </p>
      <p>
        Batas penawaran: {time(l.expiresAt)} · {l.displayStatus}
      </p>
      <p>
        {a.safetyState} · {a.syncStatus} · metadata {a.metadataStatus} · posisi
        baru {a.newPositionsEnabled ? 'aktif' : 'ditutup'}
      </p>
      <small>
        Block {l.snapshot.blockNumber} · {l.snapshot.finality} ·{' '}
        {l.snapshot.indexerStatus}
      </small>
      <details>
        <summary>Identitas listing</summary>
        <code>{l.listingKey}</code>
      </details>
      <a href="/lab">Buka marketplace untuk detail dan pembelian</a>
    </div>
  );
}
export function CardView({ card }: { card: AssistantCard }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  switch (card.kind) {
    case 'LISTING_COMPARISON':
      return (
        <section
          className={styles.card}
          data-card-kind={card.kind}
          data-card-id={card.cardId}
        >
          <h4>Penawaran hak pendapatan</h4>
          <p>
            Token simulasi · Harga dalam DemoUSD · Snapshot block{' '}
            {card.payload.snapshot.blockNumber}
          </p>
          {card.payload.items.length === 0 && (
            <p>Belum ada penawaran terbuka yang sesuai filter.</p>
          )}
          {card.payload.items.map((item) => (
            <ListingView key={item.listing.listingKey} data={item} />
          ))}
          <small>
            {card.payload.snapshot.indexerStatus} ·{' '}
            {card.payload.snapshot.finality} · diamati{' '}
            {time(card.payload.meta.observedAt)}
          </small>
          {card.payload.pagination.nextCursor && (
            <p>Masih ada hasil lain. Minta halaman berikutnya lewat chat.</p>
          )}
        </section>
      );
    case 'ASSET_CONTEXT': {
      const d = card.payload.data;
      return (
        <section
          className={`${styles.card} ${styles.asset}`}
          data-card-kind={card.kind}
          data-card-id={card.cardId}
        >
          <h4>Konteks {d.asset.token.symbol}</h4>
          <p>
            {d.isDemo
              ? 'Token simulasi, tanpa klaim backing saham nyata.'
              : 'Periksa terms issuer.'}
          </p>
          <p>{d.summary}</p>
          <ul>
            {d.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {d.sources
            .filter(
              (s) =>
                s.url ===
                'https://github.com/wildanniam/yieldex-rwa/blob/main/docs/spec/ai-and-quotes.md',
            )
            .map((s) => (
              <p key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>{' '}
                · {time(s.observedAt)}
              </p>
            ))}
        </section>
      );
    }
    case 'QUOTE_COMPARISON': {
      const d = card.payload.data;
      const expired = now >= d.expiresAt;
      return (
        <section
          className={`${styles.card} ${styles.quote}`}
          data-card-kind={card.kind}
          data-card-id={card.cardId}
        >
          <h4>Perbandingan quote mainnet</h4>
          <p>
            {d.request.mode} · {d.request.comparisonScope} · {d.rankingBasis}
          </p>
          <p>
            {expired
              ? 'Kedaluwarsa — minta quote baru.'
              : `${d.rankingStatus} · berlaku sampai ${time(d.expiresAt)}`}
          </p>
          {d.quotes.map((q) => (
            <div className={styles.row} key={q.quoteId}>
              <strong>
                Chain {q.chainId} · {q.status}
                {!expired && q.quoteId === d.recommendedQuoteId
                  ? ' · Rekomendasi perhitungan'
                  : ''}
              </strong>
              <p>
                Jual: {amount(q.sellAmountAtomic, q.sellToken)} → terima:{' '}
                {amount(q.buyAmountAtomic, q.buyToken)}
              </p>
              <p>
                {q.mode === 'EXACT_INPUT'
                  ? `Minimum diterima: ${amount(q.minBuyAmountAtomic, q.buyToken)}`
                  : `Maksimum dibayar: ${amount(q.maxSellAmountAtomic, q.sellToken)}`}
              </p>
              <p>
                Biaya: {q.feeCompleteness}. Sumber 0x:{' '}
                {q.sourceNames.join(', ') || 'Tidak tersedia'}.{' '}
                {q.isHypothetical
                  ? 'Asumsi aset sudah berada di chain ini.'
                  : ''}
              </p>
              <details>
                <summary>Rincian biaya dan identitas token</summary>
                <pre>
                  {JSON.stringify(
                    {
                      fees: q.fees,
                      sellToken: q.sellToken,
                      buyToken: q.buyToken,
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
              <small>
                Diambil {time(q.observedAt)} · block{' '}
                {q.blockNumber ?? 'tidak tersedia'}
                {q.reasonCode ? ` · ${q.reasonCode}` : ''}
              </small>
            </div>
          ))}
          <ul>
            {d.disclosures.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
          <p>
            Hanya rekomendasi. Tidak mengeksekusi swap/bridge dan tidak membayar
            listing DemoUSD.
          </p>
        </section>
      );
    }
    case 'PURCHASE_PREVIEW': {
      const d = card.payload.data;
      return (
        <section
          className={styles.card}
          data-card-kind={card.kind}
          data-card-id={card.cardId}
        >
          <h4>Preview pembelian hak</h4>
          <p>
            {now >= d.expiresAt ? 'EXPIRED' : d.state} · Chain {d.chainId}
          </p>
          <p>
            Pembeli: <code>{d.walletAddress}</code>
          </p>
          <p>
            Berlaku sampai {time(d.expiresAt)} · simulasi {d.simulation}
          </p>
          {d.purchaseSummary && <ListingView data={d.purchaseSummary} />}
          <p>
            Block pemeriksaan: {d.preparedAtSnapshot.blockNumber}. Penerima
            pembayaran:{' '}
            <code>{d.purchaseSummary?.listing.seller ?? 'Belum tersedia'}</code>
          </p>
          <ul>
            {[...d.blockers, ...d.disclosures].map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
          <p>
            Belum ada transaksi dikirim. Pilih listing yang sama di marketplace
            untuk preview baru dan persetujuan wallet.
          </p>
        </section>
      );
    }
    case 'TRANSACTION_STATUS':
      return <p>Status transaksi tersedia pada marketplace.</p>;
  }
}
export function ToolResult({
  name,
  threadId,
  toolCallId,
  status,
  result,
}: {
  name: string;
  threadId: string;
  toolCallId: string;
  status: string;
  result?: string | undefined;
}) {
  if (status !== 'complete') return <p role="status">Mengambil data {name}…</p>;
  const card = parseCard(threadId, toolCallId, result ?? '');
  if (card) return <CardView card={card} />;
  let value: unknown;
  try {
    value = JSON.parse(result ?? '');
  } catch {
    value = null;
  }
  {
    const error = validateData('api.ErrorEnvelope', value);
    if (error.success)
      return (
        <p role="alert">
          {error.data.error.message} ({error.data.error.code})
        </p>
      );
    if (name === 'getListing') {
      const r = validateData('api.ListingResponse', value);
      if (r.success)
        return (
          <div className={styles.card}>
            <ListingView data={r.data.data} />
          </div>
        );
    }
    if (name === 'getPosition') {
      const r = validateData('api.PositionResponse', value);
      if (r.success)
        return (
          <div className={styles.card}>
            <h4>Posisi #{r.data.data.positionId}</h4>
            <p>
              {r.data.data.displayState} · {r.data.data.principalShares} shares
              pokok
            </p>
            <p>
              Pemilik hak:{' '}
              <code>{r.data.data.rightsOwner ?? 'Belum dibeli'}</code>
            </p>
            <p>Block {r.data.data.snapshot.blockNumber}</p>
          </div>
        );
    }
  }
  return (
    <p role="alert">
      Hasil belum dapat diverifikasi. Gunakan marketplace untuk memeriksa data.
    </p>
  );
}
