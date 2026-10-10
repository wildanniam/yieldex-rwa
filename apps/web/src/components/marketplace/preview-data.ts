import type { SearchListingsQuery } from '@rwa/shared';

/** Presentation fixtures only. These IDs are never passed to a transaction API. */
export type PreviewAssetSymbol = 'demoAAPL' | 'demoMSFT' | 'demoSPY';
export type PreviewMarket = SearchListingsQuery['market'];
export type PreviewSort = SearchListingsQuery['sort'];
export interface PreviewListing {
  id: string;
  market: 'PRIMARY' | 'SECONDARY';
  symbol: PreviewAssetSymbol;
  company: string;
  ticker: string;
  seller: string;
  backingAtomic: string;
  priceAtomic: string;
  incomeBps: number;
  termDays: number;
  order: number;
}

const assetNames = {
  demoAAPL: { company: 'Apple', ticker: 'AAPL' },
  demoMSFT: { company: 'Microsoft', ticker: 'MSFT' },
  demoSPY: { company: 'S&P 500', ticker: 'SPY' },
} as const;

function offer(
  id: string,
  symbol: PreviewAssetSymbol,
  seller: string,
  backing: string,
  priceAtomic: string,
  incomeBps: number,
  termDays: number,
  market: PreviewListing['market'],
  order: number,
): PreviewListing {
  return {
    id,
    symbol,
    ...assetNames[symbol],
    seller,
    backingAtomic: (BigInt(backing) * 10n ** 18n).toString(),
    priceAtomic,
    incomeBps,
    termDays,
    market,
    order,
  };
}

export const previewListings: readonly PreviewListing[] = [
  offer(
    'L-0142',
    'demoAAPL',
    'Alice',
    '100',
    '90000000',
    5000,
    180,
    'PRIMARY',
    8,
  ),
  offer(
    'L-0143',
    'demoMSFT',
    'Rafi',
    '80',
    '125000000',
    6000,
    180,
    'PRIMARY',
    7,
  ),
  offer(
    'L-0144',
    'demoSPY',
    'Carol',
    '120',
    '110000000',
    5000,
    90,
    'PRIMARY',
    6,
  ),
  offer(
    'L-0211',
    'demoAAPL',
    'Bob',
    '60',
    '72000000',
    5000,
    42,
    'SECONDARY',
    5,
  ),
  offer(
    'L-0212',
    'demoMSFT',
    'Nadia',
    '40',
    '98000000',
    7500,
    67,
    'SECONDARY',
    4,
  ),
  offer(
    'L-0213',
    'demoSPY',
    'Dimas',
    '90',
    '84000000',
    5000,
    95,
    'SECONDARY',
    3,
  ),
  offer('L-0214', 'demoAAPL', 'Maya', '75', '88000000', 6000, 90, 'PRIMARY', 2),
  offer(
    'L-0215',
    'demoMSFT',
    'Bima',
    '55',
    '102000000',
    5000,
    180,
    'PRIMARY',
    1,
  ),
];

export function getPreviewListing(id: string): PreviewListing | undefined {
  return previewListings.find((listing) => listing.id === id);
}

/** Exact display formatting: no floating-point conversion of token amounts. */
export function formatAtomic(value: string, decimals: number, digits = 2) {
  const atomic = BigInt(value);
  const scale = 10n ** BigInt(decimals);
  const whole = (atomic / scale)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = (atomic % scale)
    .toString()
    .padStart(decimals, '0')
    .slice(0, digits);
  return digits ? `${whole}.${fraction.padEnd(digits, '0')}` : whole;
}

export function incomePercent(bps: number) {
  return formatAtomic(String(bps), 2, 2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
}

export function termLabel(listing: PreviewListing) {
  return listing.market === 'SECONDARY'
    ? `${listing.termDays} days left`
    : `${listing.termDays} days`;
}

export function filterPreviewListings({
  search = '',
  market = 'ANY',
  sort = 'NEWEST',
}: {
  search?: string;
  market?: PreviewMarket;
  sort?: PreviewSort;
} = {}): PreviewListing[] {
  const needle = search.trim().toLocaleLowerCase('en');
  const rows = previewListings.filter(
    (listing) =>
      (market === 'ANY' || listing.market === market) &&
      `${listing.id} ${listing.company} ${listing.symbol} ${listing.ticker} ${listing.seller}`
        .toLocaleLowerCase('en')
        .includes(needle),
  );
  return rows.sort((a, b) => {
    if (sort === 'PRICE_ASC') {
      const first = BigInt(a.priceAtomic),
        second = BigInt(b.priceAtomic);
      if (first !== second) return first < second ? -1 : 1;
    }
    if (sort === 'DURATION_ASC' && a.termDays !== b.termDays)
      return a.termDays - b.termDays;
    return b.order - a.order;
  });
}

export function paginatePreviewListings(
  rows: PreviewListing[],
  page: number,
  size = 6,
) {
  const totalPages = Math.max(1, Math.ceil(rows.length / size));
  const currentPage = Math.max(1, Math.min(totalPages, Math.trunc(page) || 1));
  return {
    items: rows.slice((currentPage - 1) * size, currentPage * size),
    totalPages,
    currentPage,
  };
}
