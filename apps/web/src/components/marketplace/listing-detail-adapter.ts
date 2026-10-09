import type { ListingDetail, ListingResponse } from '@rwa/shared';

export interface ListingDetailViewModel {
  id: string;
  symbol: string;
  title: string;
  seller: string;
  status: 'Listed';
  contractAddress: string;
  backing: string;
  backingNote: string;
  incomeSold: string;
  incomeSoldNote: string;
  period: string;
  periodNote: string;
  payout: string;
  payoutNote: string;
  price: string;
  priceNote: string;
  deadline: string;
  estimate: string;
  networkFee: string;
  snapshotLabel: string;
}

export type ListingDetailState =
  | {
      status: 'ready';
      response: ListingResponse | null;
      view: ListingDetailViewModel;
    }
  | { status: 'unavailable'; response: null; view: null; message: string };

const l0142: ListingDetailViewModel = {
  id: 'L-0142',
  symbol: 'dAAPL',
  title: 'dAAPL income rights',
  seller: 'Alice',
  status: 'Listed',
  contractAddress: '0xD4a7...B618',
  backing: '100 dAAPL',
  backingNote: 'Principal stays with Alice',
  incomeSold: '50%',
  incomeSoldNote: 'Alice retains the other 50%',
  period: '6 months',
  periodNote: 'Starts when you buy',
  payout: 'dAAPL',
  payoutNote: 'No auto-conversion',
  price: '90 DemoUSD',
  priceNote: 'Paid upfront',
  deadline: 'Ends 6 months after you buy',
  estimate: 'about 1.00 dAAPL',
  networkFee: 'about 0.0007 ETH',
  snapshotLabel: 'Simulated issuer feed · Illustrative only',
};

const fixtures: Record<string, ListingDetailViewModel> = {
  'L-0142': l0142,
};

export function getListingDetail(id: string): ListingDetailState {
  const view = fixtures[id];
  if (!view) {
    return {
      status: 'unavailable',
      response: null,
      view: null,
      message: `Listing ${id} is unavailable.`,
    };
  }

  return { status: 'ready', response: null, view };
}

export function adaptListingResponse(
  response: ListingResponse,
): ListingDetailState {
  const detail: ListingDetail = response.data;
  return {
    status: 'ready',
    response,
    view: {
      ...l0142,
      id: detail.listing.listingKey,
      incomeSold: `${detail.position.incomeBps} bps`,
      price: `${detail.listing.priceAtomic} atomic payment units`,
      snapshotLabel: `${detail.listing.snapshot.finality} snapshot`,
    },
  };
}
