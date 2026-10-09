'use client';

import { useState } from 'react';
import { AssetCard } from '@/components/marketplace/asset-card';
import { MarketplacePagination } from '@/components/marketplace/marketplace-pagination';
import type {
  MarketplaceListingCard,
  MarketplaceSort,
} from '@/components/marketplace/types';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { Select } from '@/components/ui/select';

const listings: MarketplaceListingCard[] = [
  {
    id: 'L-0142',
    kind: 'PRIMARY',
    symbol: 'dAAPL',
    seller: 'Alice Hartono',
    listingCode: 'L-0142',
    backing: '100 dAAPL',
    incomeShare: '50%',
    period: '3 months',
    payoutToken: 'dAAPL',
    price: '90.00 DemoUSD',
    estimate: 'Est. income about 1.00 dAAPL',
  },
  {
    id: 'L-0143',
    kind: 'PRIMARY',
    symbol: 'dNVDA',
    seller: 'Bob Santoso',
    listingCode: 'L-0143',
    backing: '80 dNVDA',
    incomeShare: '75%',
    period: '6 months',
    payoutToken: 'dNVDA',
    price: '135.00 DemoUSD',
    estimate: 'Est. income about 2.40 dNVDA',
  },
  {
    id: 'L-0144',
    kind: 'PRIMARY',
    symbol: 'dKO',
    seller: 'Carol Wijaya',
    listingCode: 'L-0144',
    backing: '120 dKO',
    incomeShare: '100%',
    period: '12 months',
    payoutToken: 'dKO',
    price: '110.00 DemoUSD',
    estimate: 'Est. income about 3.20 dKO',
  },
  {
    id: 'L-0211',
    kind: 'SECONDARY',
    symbol: 'dAAPL',
    seller: 'Alice Hartono',
    listingCode: 'L-0211',
    backing: '60 dAAPL',
    incomeShare: '50%',
    period: 'Remaining term',
    payoutToken: 'dAAPL',
    price: '72.00 DemoUSD',
    estimate: 'Est. income about 0.60 dAAPL',
  },
  {
    id: 'L-0212',
    kind: 'SECONDARY',
    symbol: 'dNVDA',
    seller: 'Bob Santoso',
    listingCode: 'L-0212',
    backing: '40 dNVDA',
    incomeShare: '75%',
    period: 'Remaining term',
    payoutToken: 'dNVDA',
    price: '98.00 DemoUSD',
    estimate: 'Est. income about 1.10 dNVDA',
  },
  {
    id: 'L-0213',
    kind: 'SECONDARY',
    symbol: 'dKO',
    seller: 'Carol Wijaya',
    listingCode: 'L-0213',
    backing: '90 dKO',
    incomeShare: '100%',
    period: 'Remaining term',
    payoutToken: 'dKO',
    price: '84.00 DemoUSD',
    estimate: 'Est. income about 1.80 dKO',
  },
  {
    id: 'L-0214',
    kind: 'SECONDARY',
    symbol: 'dAAPL',
    seller: 'Dimas Pratama',
    listingCode: 'L-0214',
    backing: '75 dAAPL',
    incomeShare: '60%',
    period: 'Remaining term',
    payoutToken: 'dAAPL',
    price: '88.00 DemoUSD',
    estimate: 'Est. income about 0.85 dAAPL',
  },
  {
    id: 'L-0215',
    kind: 'PRIMARY',
    symbol: 'dNVDA',
    seller: 'Nadia Putri',
    listingCode: 'L-0215',
    backing: '55 dNVDA',
    incomeShare: '50%',
    period: '3 months',
    payoutToken: 'dNVDA',
    price: '102.00 DemoUSD',
    estimate: 'Est. income about 1.35 dNVDA',
  },
  {
    id: 'L-0216',
    kind: 'PRIMARY',
    symbol: 'dKO',
    seller: 'Raka Wijaya',
    listingCode: 'L-0216',
    backing: '180 dKO',
    incomeShare: '80%',
    period: '6 months',
    payoutToken: 'dKO',
    price: '145.00 DemoUSD',
    estimate: 'Est. income about 2.75 dKO',
  },
  {
    id: 'L-0217',
    kind: 'SECONDARY',
    symbol: 'dNVDA',
    seller: 'Sari Lestari',
    listingCode: 'L-0217',
    backing: '30 dNVDA',
    incomeShare: '65%',
    period: 'Remaining term',
    payoutToken: 'dNVDA',
    price: '76.00 DemoUSD',
    estimate: 'Est. income about 0.72 dNVDA',
  },
  {
    id: 'L-0218',
    kind: 'PRIMARY',
    symbol: 'dAAPL',
    seller: 'Bima Santoso',
    listingCode: 'L-0218',
    backing: '90 dAAPL',
    incomeShare: '70%',
    period: '12 months',
    payoutToken: 'dAAPL',
    price: '160.00 DemoUSD',
    estimate: 'Est. income about 2.10 dAAPL',
  },
  {
    id: 'L-0219',
    kind: 'SECONDARY',
    symbol: 'dKO',
    seller: 'Maya Kusuma',
    listingCode: 'L-0219',
    backing: '110 dKO',
    incomeShare: '90%',
    period: 'Remaining term',
    payoutToken: 'dKO',
    price: '95.00 DemoUSD',
    estimate: 'Est. income about 2.05 dKO',
  },
];

const sortOptions = [
  { label: 'Newest', value: 'NEWEST' },
  { label: 'Price: low to high', value: 'PRICE_ASC' },
  { label: 'Duration: shortest', value: 'DURATION_ASC' },
];
const listingsPerPage = 6;

export default function MarketplacePage() {
  const [market, setMarket] = useState<'ANY' | 'PRIMARY' | 'SECONDARY'>('ANY');
  const [sort, setSort] = useState<MarketplaceSort>('NEWEST');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const visibleListings =
    market === 'ANY'
      ? listings
      : listings.filter((listing) => listing.kind === market);
  const totalPages = Math.max(
    1,
    Math.ceil(visibleListings.length / listingsPerPage),
  );
  const pageListings = visibleListings.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage,
  );

  const changeMarket = (nextMarket: 'PRIMARY' | 'SECONDARY') => {
    setMarket((currentMarket) =>
      currentMarket === nextMarket ? 'ANY' : nextMarket,
    );
    setCurrentPage(1);
  };

  const changePage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-text-3 uppercase">
            Marketplace
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-text-1">
            Featured across primary and resale
          </h2>
        </div>
        <p className="max-w-sm text-right text-xs leading-5 text-text-3">
          Featured 6 of 16 · Sellers keep principal · No promised returns.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pb-4">
        <div
          className="flex gap-2 border border-border rounded-xl p-2"
          role="tablist"
          aria-label="Listing type"
        >
          {[
            { label: 'Primary offers', count: 12, value: 'PRIMARY' as const },
            { label: 'Resale', count: 4, value: 'SECONDARY' as const },
          ].map((tab) => {
            const active = market === tab.value;
            return (
              <button
                key={tab.value}
                aria-selected={active}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-tint text-green-text'
                    : 'text-text-2 hover:bg-raised hover:text-text-1'
                }`}
                onClick={() => changeMarket(tab.value)}
                role="tab"
                type="button"
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <SearchField
              aria-label="Search assets or listing IDs"
              placeholder="Search assets or listing IDs"
              shortcut="⌘K"
            />
          </div>
          <div className="w-44">
            <Select
              aria-label="Sort listings"
              onChange={(event) =>
                setSort(event.target.value as MarketplaceSort)
              }
              options={sortOptions}
              value={sort}
            />
          </div>
          <div className="flex border border-border p-1">
            <Button
              aria-label="Grid view"
              className={`${view === 'grid' ? 'bg-tint text-green-text' : ''}`}
              leadingIcon="layout-grid"
              onClick={() => setView('grid')}
              size="sm"
              variant="ghost"
            />
            <Button
              aria-label="List view"
              className={`${view === 'list' ? 'bg-tint text-green-text' : ''}`}
              leadingIcon="list"
              onClick={() => setView('list')}
              size="sm"
              variant="ghost"
            />
          </div>
        </div>
      </div>

      <div
        className={
          view === 'grid'
            ? 'mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'
            : 'mt-5 grid grid-cols-1 gap-5'
        }
      >
        {pageListings.map((listing) => (
          <AssetCard key={listing.id} listing={listing} />
        ))}
      </div>

      <MarketplacePagination
        currentPage={currentPage}
        onPageChange={changePage}
        totalPages={totalPages}
      />
    </div>
  );
}
