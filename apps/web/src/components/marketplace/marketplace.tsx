'use client';

// Adapts diamondver's PR #12 marketplace composition to the shared product shell.
import Link from 'next/link';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AssetCard } from './asset-card';
import { MarketplacePagination } from './marketplace-pagination';
import {
  filterPreviewListings,
  paginatePreviewListings,
  previewListings,
  type PreviewMarket,
  type PreviewSort,
} from './preview-data';
import styles from './marketplace.module.css';

export function Marketplace() {
  const [market, setMarket] = useState<PreviewMarket>('ANY');
  const [sort, setSort] = useState<PreviewSort>('NEWEST');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const rows = filterPreviewListings({ search, market, sort });
  const visible = paginatePreviewListings(rows, page);

  function resetFilters() {
    setSearch('');
    setMarket('ANY');
    setSort('NEWEST');
    setPage(1);
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
          <span>Create an offer</span>
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
                setPage(1);
              }}
            >
              {value === 'ANY'
                ? 'All offers'
                : value === 'PRIMARY'
                  ? 'Primary'
                  : 'Resale'}
              <span>
                {value === 'ANY'
                  ? previewListings.length
                  : previewListings.filter((item) => item.market === value)
                      .length}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.tools}>
          <label className={styles.search}>
            <Icon name="search" alt="" inheritColor size={17} />
            <input
              type="search"
              aria-label="Search offers"
              placeholder="Search assets or offers"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Sort offers"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as PreviewSort);
              setPage(1);
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
          {rows.length} {rows.length === 1 ? 'offer' : 'offers'}
          {search.trim() ? ` for “${search.trim()}”` : ' to explore'}
        </span>
        <span className={styles.previewBadge}>UI preview</span>
      </div>
      {rows.length ? (
        <div className={view === 'grid' ? styles.grid : styles.list}>
          {visible.items.map((listing) => (
            <AssetCard
              listing={listing}
              list={view === 'list'}
              key={listing.id}
            />
          ))}
        </div>
      ) : (
        <section className={styles.empty}>
          <Icon name="search" alt="" size={30} inheritColor />
          <h2>No offers match yet.</h2>
          <p>Try another asset, seller or offer number.</p>
          <button type="button" onClick={resetFilters}>
            Clear filters <span aria-hidden="true">↗</span>
          </button>
        </section>
      )}
      <MarketplacePagination
        currentPage={visible.currentPage}
        totalPages={visible.totalPages}
        onPageChange={setPage}
      />
      <p className={styles.previewNote}>
        Illustrative offers for this design preview. No live listings or income
        estimates are shown.
      </p>
    </div>
  );
}
