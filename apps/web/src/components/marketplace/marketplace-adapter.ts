import type {
  ListingDetail,
  ListingsPage,
  SearchListingsQuery,
} from '@rwa/shared';

export interface MarketplaceUnavailable {
  status: 'unavailable';
  error: {
    code: 'API_ERROR' | 'INVALID_RESPONSE';
    message: string;
  };
  page: null;
  items: [];
}

export interface MarketplaceReady {
  status: 'ready';
  error: null;
  page: ListingsPage;
  items: ListingDetail[];
}

export type MarketplaceAdapterResult =
  MarketplaceReady | MarketplaceUnavailable;

export function normalizeListingsQuery(
  input: Partial<SearchListingsQuery> = {},
): SearchListingsQuery {
  return {
    assetIds: input.assetIds ?? [],
    market: input.market ?? 'ANY',
    maxPriceAtomic: input.maxPriceAtomic ?? null,
    maxRemainingDurationSeconds: input.maxRemainingDurationSeconds ?? null,
    incomeBpsMin: input.incomeBpsMin ?? null,
    sort: input.sort ?? 'NEWEST',
    limit: Math.min(20, Math.max(1, input.limit ?? 20)),
    cursor: input.cursor ?? null,
  };
}

export function adaptListingsPage(page: ListingsPage): MarketplaceReady {
  return {
    status: 'ready',
    error: null,
    page,
    items: page.items,
  };
}

export function unavailable(
  code: MarketplaceUnavailable['error']['code'],
  message: string,
): MarketplaceUnavailable {
  return {
    status: 'unavailable',
    error: { code, message },
    page: null,
    items: [],
  };
}
