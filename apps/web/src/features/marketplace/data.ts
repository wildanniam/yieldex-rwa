import { formatUnits, parseUnits } from 'viem';
import type { ChainSnapshot, ListingDetail, Position } from '@rwa/shared';

export const shortAddress = (value: string) =>
  `${value.slice(0, 6)}…${value.slice(-4)}`;
export const amount = (value: string | null, decimals: number) =>
  value === null ? 'Unavailable' : formatUnits(BigInt(value), decimals);
export const company = (symbol: string) =>
  ({ demoAAPL: 'Apple', demoMSFT: 'Microsoft', demoSPY: 'S&P 500' })[symbol] ??
  symbol;
export const listingHref = (key: string) =>
  `/marketplace/${encodeURIComponent(key)}`;
export const positionHref = (key: string) =>
  `/positions/${encodeURIComponent(key)}`;
export function positiveAtomic(value: string, decimals: number) {
  if (
    value.length > 100 ||
    !/^\d+(?:\.\d+)?$/.test(value) ||
    (value.split('.')[1]?.length ?? 0) > decimals
  )
    return null;
  const n = parseUnits(value, decimals);
  return n > 0n && n < 2n ** 256n ? n.toString() : null;
}
export function mergeSnapshots<T extends { snapshot: ChainSnapshot }>(
  indexed: T[],
  overlays: T[],
  key: (row: T) => string,
): T[] {
  const result = new Map(indexed.map((row) => [key(row), row]));
  for (const row of overlays) {
    const previous = result.get(key(row));
    if (
      !previous ||
      BigInt(row.snapshot.blockNumber) > BigInt(previous.snapshot.blockNumber)
    )
      result.set(key(row), row);
  }
  return [...result.values()];
}
export function positionActions(
  p: Position,
  wallet: string | null,
  now: number,
  listing?: ListingDetail['listing'],
) {
  const principal = !!wallet && p.principalOwner === wallet;
  const rights = !!wallet && p.rightsOwner === wallet;
  const ended = p.endAt !== null && p.endAt <= now;
  const released = p.storedState === 'RELEASED';
  const current =
    listing?.positionKey === p.positionKey &&
    listing?.listingId === p.currentListingId
      ? listing
      : undefined;
  const live = current
    ? current.storedStatus === 'OPEN' && current.expiresAt > now
    : !!p.activeListingKey;
  return {
    checkpoint: !released && p.storedState !== 'SETTLED',
    settle: p.storedState === 'ACTIVE' && ended,
    release: principal && ['CANCELLED', 'SETTLED'].includes(p.storedState),
    // Primary cancellation changes the position state. An expired OFFERED
    // position therefore still has a cancellable current listing (MKT-004).
    cancel:
      (principal &&
        p.storedState === 'OFFERED' &&
        p.currentListingId !== '0') ||
      (rights &&
        p.storedState === 'ACTIVE' &&
        (current
          ? current.storedStatus === 'OPEN' && current.seller === wallet
          : !!p.activeListingKey)),
    resale: rights && p.storedState === 'ACTIVE' && !ended && !live,
    relist: principal && p.storedState === 'OFFERED' && !live,
  };
}
export const remainingTerm = (d: ListingDetail) =>
  d.listing.kind === 'PRIMARY'
    ? `${Math.round((d.position.durationSeconds / 86400) * 100) / 100} days`
    : `Ends ${new Date(d.position.endAt! * 1000).toLocaleDateString()}`;

// Next route params may still contain URL escapes. Decode exactly once, then
// accept only canonical deployment keys (never legacy display IDs or URLs).
export function routeKey(segment: string): string | null {
  try {
    const key = decodeURIComponent(segment);
    const match =
      /^eip155:(31337|11155111):0x[0-9a-f]{40}:([1-9][0-9]{0,77})$/.exec(key);
    return match && BigInt(match[2]!) < 2n ** 256n ? key : null;
  } catch {
    return null;
  }
}
