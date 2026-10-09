import type {
  ListingDetail,
  ListingsPage,
  SearchListingsQuery,
} from '@rwa/shared';

export type MarketplaceMarket = SearchListingsQuery['market'];
export type MarketplaceSort = SearchListingsQuery['sort'];

export interface MarketplaceListingCard {
  id: string;
  kind: 'PRIMARY' | 'SECONDARY' | null;
  symbol: string;
  seller: string | null;
  listingCode: string;
  backing: string;
  incomeShare: string;
  period: string;
  payoutToken: string;
  price: string;
  estimate: string;
  highlighted?: boolean;
}

export interface MarketplaceListingsState {
  status: 'ready' | 'unavailable';
  page: ListingsPage | null;
  items: ListingDetail[];
}
