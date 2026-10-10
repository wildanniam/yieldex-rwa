'use client';
// Preserves diamondver's composition with canonical cursor-backed search.
import Link from 'next/link';
import { useState } from 'react';
import type {
  AssetsPage,
  ListingsPage,
  SearchListingsQuery,
} from '@rwa/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { usePlatform } from '@/features/marketplace/platform-provider';
import { useRead } from '@/features/marketplace/use-read';
import { AssetCard } from './asset-card';
import styles from './marketplace.module.css';

export function Marketplace() {
  const { manifest: m, revision } = usePlatform();
  const [market, setMarket] = useState<SearchListingsQuery['market']>('ANY');
  const [sort, setSort] = useState<SearchListingsQuery['sort']>('NEWEST');
  const [assetId, setAssetId] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const assets = useRead<AssetsPage>(
    `/chains/${m.chainId}/registries/${m.registry}/assets`,
    'api.AssetsPage',
    revision,
  );
  const query = new URLSearchParams({ market, sort, limit: '6' });
  if (assetId) query.set('assetId', assetId);
  if (cursors.at(-1)) query.set('cursor', cursors.at(-1)!);
  const data = useRead<ListingsPage>(
    `/chains/${m.chainId}/markets/${m.market}/listings?${query}`,
    'api.ListingsPage',
    revision,
  );
  function reset() {
    setMarket('ANY');
    setAssetId('');
    setSort('NEWEST');
    setCursors([null]);
    data.refresh();
  }
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>A different way to own income</span>
          <h1>Explore the marketplace.</h1>
          <p>Choose the income. Keep your options open.</p>
        </div>
        <Link href="/sell" className={buttonVariants({ size: 'md' })}>
          <Icon name="plus" inheritColor alt="" size={18} />
          Create an offer
        </Link>
      </header>
      <div className={styles.toolbar}>
        <div className={styles.filters} aria-label="Listing type">
          {(['ANY', 'PRIMARY', 'SECONDARY'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={market === value}
              onClick={() => {
                setMarket(value);
                setCursors([null]);
              }}
            >
              {value === 'ANY'
                ? 'All offers'
                : value === 'PRIMARY'
                  ? 'Primary'
                  : 'Resale'}
            </button>
          ))}
        </div>
        <div className={styles.tools}>
          <select
            aria-label="Filter by asset"
            value={assetId}
            onChange={(e) => {
              setAssetId(e.target.value);
              setCursors([null]);
            }}
          >
            <option value="">All assets</option>
            {assets.data?.items.map((a) => (
              <option key={a.assetId} value={a.assetId}>
                {a.token.symbol}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort offers"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SearchListingsQuery['sort']);
              setCursors([null]);
            }}
          >
            <option value="NEWEST">Newest</option>
            <option value="PRICE_ASC">Price: low to high</option>
            <option value="DURATION_ASC">Shortest term</option>
          </select>
          <div className={styles.viewToggle} aria-label="View style">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className={styles.resultsMeta}>
        <span aria-live="polite">
          {data.loading
            ? 'Loading offers…'
            : data.data
              ? `${data.data.items.length} offers on this page`
              : 'Offers unavailable'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={data.loading}
          onClick={() => {
            setCursors([null]);
            data.refresh();
          }}
        >
          Refresh
        </Button>
      </div>
      {assets.error && (
        <p role="status">
          Asset filters unavailable.{' '}
          <button onClick={assets.refresh}>Retry filters</button>
        </p>
      )}
      {data.error ? (
        <section className={styles.empty} role="alert">
          <h2>We couldn’t load the offers.</h2>
          <p>
            {data.error === 'CURSOR_INVALIDATED'
              ? 'The snapshot changed. Refresh to start from the latest page.'
              : data.error}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setCursors([null]);
              data.refresh();
            }}
          >
            Try again
          </Button>
        </section>
      ) : data.loading ? (
        <p role="status">Reading the marketplace…</p>
      ) : data.data?.items.length ? (
        <div className={view === 'grid' ? styles.grid : styles.list}>
          {data.data.items.map((d) => (
            <AssetCard
              key={d.listing.listingKey}
              listing={d}
              list={view === 'list'}
            />
          ))}
        </div>
      ) : (
        <section className={styles.empty}>
          <Icon name="tag" alt="" size={30} inheritColor />
          <h2>
            {assetId || market !== 'ANY'
              ? 'No offers match these filters.'
              : 'The next offer could be yours.'}
          </h2>
          <p>
            {assetId || market !== 'ANY'
              ? 'Try another asset or listing type.'
              : 'There are no open offers in the latest indexed snapshot.'}
          </p>
          {assetId || market !== 'ANY' ? (
            <Button variant="outline" onClick={reset}>
              Clear filters
            </Button>
          ) : (
            <Link href="/sell" className={buttonVariants({ size: 'sm' })}>
              Create a listing
            </Link>
          )}
        </section>
      )}
      {(cursors.length > 1 || data.data?.pagination.hasMore) && (
        <nav className={styles.resultsMeta} aria-label="Marketplace pages">
          <Button
            variant="ghost"
            disabled={cursors.length === 1 || data.loading}
            onClick={() => setCursors((old) => old.slice(0, -1))}
          >
            Previous
          </Button>
          <span>Page {cursors.length}</span>
          <Button
            variant="ghost"
            disabled={!data.data?.pagination.hasMore || data.loading}
            onClick={() =>
              setCursors((old) => [...old, data.data!.pagination.nextCursor])
            }
          >
            Next
          </Button>
        </nav>
      )}
      {data.data && (
        <p className={styles.previewNote}>
          Block #{data.data.snapshot.blockNumber} ·{' '}
          {data.data.snapshot.finality.toLowerCase()} ·{' '}
          {data.data.snapshot.indexerStatus.toLowerCase()}. Offers are checked
          again before purchase.
        </p>
      )}
    </div>
  );
}
