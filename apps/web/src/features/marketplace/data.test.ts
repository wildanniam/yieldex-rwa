import { describe, expect, it } from 'vitest';
import type { Position, ChainSnapshot } from '@rwa/shared';
import {
  amount,
  positiveAtomic,
  positionActions,
  mergeSnapshots,
  listingHref,
  routeKey,
} from './data';

const owner = '0x' + '11'.repeat(20),
  buyer = '0x' + '22'.repeat(20);
const position = (override: Partial<Position> = {}) =>
  ({
    positionKey: 'position-1',
    currentListingId: '9',
    principalOwner: owner,
    rightsOwner: buyer,
    storedState: 'ACTIVE',
    endAt: 200,
    startAt: 100,
    activeListingKey: null,
    ...override,
  }) as Position;

describe('financial presentation boundaries', () => {
  it('keeps unknown balances distinct from zero and preserves large exact amounts', () => {
    expect(amount(null, 18)).toBe('Unavailable');
    expect(amount('0', 18)).toBe('0');
    expect(amount('123456789012345678901234567890', 18)).toBe(
      '123456789012.34567890123456789',
    );
    expect(positiveAtomic('1.0000001', 6)).toBeNull();
    expect(positiveAtomic('1.000001', 6)).toBe('1000001');
    for (const bad of [
      '1e3',
      '-1',
      'Infinity',
      '0',
      '.1',
      '1.',
      '9'.repeat(90),
    ])
      expect(positiveAtomic(bad, 18)).toBeNull();
  });
  it('shows ownership-specific lifecycle actions, with expiry boundaries', () => {
    expect(positionActions(position(), buyer, 199)).toMatchObject({
      resale: true,
      release: false,
      settle: false,
    });
    expect(positionActions(position(), buyer, 200)).toMatchObject({
      resale: false,
      release: false,
      settle: true,
    });
    expect(positionActions(position(), owner, 200).release).toBe(false);
    expect(
      positionActions(position({ activeListingKey: 'listing' }), owner, 199)
        .cancel,
    ).toBe(false);
    expect(
      positionActions(position({ activeListingKey: 'listing' }), buyer, 199),
    ).toMatchObject({ cancel: true, resale: false });
    expect(positionActions(position(), null, 199)).toMatchObject({
      resale: false,
      release: false,
    });
  });
  it('distinguishes cancellation, relisting, settlement, and released backing', () => {
    expect(
      positionActions(
        position({
          storedState: 'CANCELLED',
          rightsOwner: null,
          startAt: null,
          endAt: null,
        }),
        owner,
        200,
      ),
    ).toMatchObject({ relist: false, release: true, settle: false });
    expect(
      positionActions(position({ storedState: 'RELEASED' }), owner, 300),
    ).toMatchObject({
      relist: false,
      release: false,
      settle: false,
      checkpoint: false,
    });
  });
  it('never lets an older receipt overwrite a newer indexed or receipt snapshot', () => {
    const row = (id: string, n: string) => ({
      id,
      snapshot: { blockNumber: n } as ChainSnapshot,
    });
    const newer = row('1', '101'),
      older = row('1', '100'),
      other = row('2', '90');
    expect(mergeSnapshots([newer], [older, other], (r) => r.id)).toEqual([
      newer,
      other,
    ]);
    expect(mergeSnapshots([older], [newer], (r) => r.id)).toEqual([newer]);
    expect(mergeSnapshots([newer], [row('1', '101')], (r) => r.id)[0]).toBe(
      newer,
    );
  });
  it('encodes canonical keys without routing to presentation-only IDs', () => {
    expect(listingHref('eip155:31337:0xabc:1')).toBe(
      '/marketplace/eip155%3A31337%3A0xabc%3A1',
    );
  });
});

it('accepts encoded or decoded route keys and rejects malformed or foreign formats', () => {
  const key = `eip155:31337:0x${'a'.repeat(40)}:6`;
  expect(routeKey(key)).toBe(key);
  expect(routeKey(encodeURIComponent(key))).toBe(key);
  for (const invalid of [
    'L-1042',
    '%bad%',
    encodeURIComponent(encodeURIComponent(key)),
    key.replace(':6', ':0'),
    key.replace(':6', `:${2n ** 256n}`),
  ])
    expect(routeKey(invalid)).toBeNull();
});

// MKT-004 and contract Market.t.sol: expired OFFERED can relist, cancelled cannot.
it('keeps cancellation, expiry and settlement aligned with the contract lifecycle', () => {
  const offered = position({
    storedState: 'OFFERED',
    rightsOwner: null,
    startAt: null,
    endAt: null,
  });
  expect(positionActions(offered, owner, 300)).toMatchObject({
    cancel: true,
    relist: true,
    release: false,
    settle: false,
  });
  expect(
    positionActions({ ...offered, activeListingKey: 'listing' }, owner, 300)
      .relist,
  ).toBe(false);
  expect(
    positionActions(position({ storedState: 'SETTLED' }), owner, 300),
  ).toMatchObject({
    release: true,
    settle: false,
    resale: false,
    cancel: false,
  });
  const expiredResale = {
    positionKey: 'position-1',
    listingId: '9',
    seller: buyer,
    storedStatus: 'OPEN',
    expiresAt: 150,
  } as import('@rwa/shared').Listing;
  expect(positionActions(position(), buyer, 180, expiredResale)).toMatchObject({
    cancel: true,
    resale: true,
  });
  expect(
    positionActions(position(), buyer, 180, {
      ...expiredResale,
      storedStatus: 'CANCELLED',
    }),
  ).toMatchObject({ cancel: false, resale: true });
  expect(
    positionActions(position(), buyer, 180, {
      ...expiredResale,
      listingId: '8',
    }).cancel,
  ).toBe(false);
});
