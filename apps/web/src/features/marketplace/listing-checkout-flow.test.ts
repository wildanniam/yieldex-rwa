import { describe, expect, it, vi } from 'vitest';
import type {
  ListingDetail,
  PreparedIntent,
  PrepareIntentRequest,
} from '@rwa/shared';
import type { MarketplaceWallet, TrackedTransaction } from './wallet';
import { ListingCheckoutFlow } from './listing-checkout-flow';

function setup(approved = false) {
  let allowed = approved;
  let current = true;
  const input = {
    action: 'CREATE_PRIMARY_LISTING',
    assetKey: 'test',
    depositTokenAmountAtomic: '99000000000000000000',
    incomeBps: 4000,
    priceAtomic: '1000000',
  } as PrepareIntentRequest;
  const tx: TrackedTransaction = {
    hash: '0x123',
    wallet: '0xabc',
    chainId: 31337,
    market: '0xdef',
    to: '0xabc',
    data: '0x1234',
    status: 'PENDING',
    replacementHash: null,
    nonce: 1,
    submittedAtBlock: '1',
  };
  const listing = {
    listing: { listingId: '7', listingKey: 'test:7' },
  } as ListingDetail;
  const wallet = {
    prepare: vi.fn(
      async (request: PrepareIntentRequest) =>
        ({
          request,
          state: allowed ? 'READY' : 'NEEDS_APPROVAL',
          steps: [],
          blockers: [],
        }) as unknown as PreparedIntent,
    ),
    send: vi.fn(
      async (_p: PreparedIntent, remember: (t: TrackedTransaction) => void) => {
        remember(tx);
        return tx;
      },
    ),
    track: vi.fn<MarketplaceWallet['track']>(async () => {
      const approval = !allowed;
      allowed = true;
      return {
        tracked: { ...tx, status: 'CONFIRMED' as const },
        listing: approval ? null : listing,
        position: null,
      };
    }),
  } satisfies Pick<MarketplaceWallet, 'prepare' | 'send' | 'track'>;
  const build = vi.fn(async () => input),
    publish = vi.fn(),
    remember = vi.fn();
  const flow = new ListingCheckoutFlow(
    wallet,
    build,
    remember,
    publish,
    () => current,
  );
  return {
    flow,
    wallet,
    build,
    publish,
    input,
    tx,
    listing,
    setCurrent: (v: boolean) => {
      current = v;
    },
    setAllowed: (v: boolean) => {
      allowed = v;
    },
  };
}

describe('same-page listing checkout', () => {
  it('verifies approval, prepares unchanged terms, then waits for an explicit listing click', async () => {
    const { flow, wallet, build, input, listing } = setup();
    await flow.continue();
    expect(flow.state.preview?.state).toBe('NEEDS_APPROVAL');
    await flow.continue();
    expect(flow.state.approvalDone).toBe(true);
    expect(flow.state.preview?.state).toBe('READY');
    expect(flow.state.stage).toBe('ready');
    expect(wallet.send).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledTimes(1);
    expect(wallet.prepare.mock.calls.every(([r]) => r === input)).toBe(true);
    await flow.continue();
    expect(flow.state.stage).toBe('complete');
    expect(flow.state.listing).toBe(listing);
    await flow.continue();
    expect(wallet.send).toHaveBeenCalledTimes(2);
  });
  it('skips approval when allowance is already sufficient', async () => {
    const { flow, wallet } = setup(true);
    await flow.continue();
    expect(flow.state.approvalDone).toBe(true);
    await flow.continue();
    expect(wallet.send).toHaveBeenCalledTimes(1);
    expect(wallet.send.mock.calls[0]![0].state).toBe('READY');
    expect(flow.state.stage).toBe('complete');
  });
  it('retains approval after declining listing confirmation; retry does not approve again', async () => {
    const { flow, wallet } = setup();
    await flow.continue();
    await flow.continue();
    wallet.send.mockRejectedValueOnce(new Error('User rejected'));
    await flow.continue();
    expect(flow.state.approvalDone).toBe(true);
    expect(flow.state.submitted).toBeNull();
    expect(flow.state.error).toBeInstanceOf(Error);
    await flow.continue();
    expect(flow.state.stage).toBe('complete');
    expect(wallet.send.mock.calls.map(([p]) => p.state)).toEqual([
      'NEEDS_APPROVAL',
      'READY',
      'READY',
    ]);
  });
  it('does not progress or retry automatically after rejected approval', async () => {
    const { flow, wallet } = setup();
    await flow.continue();
    wallet.send.mockRejectedValueOnce(new Error('User rejected'));
    await flow.continue();
    expect(flow.state.approvalDone).toBe(false);
    expect(wallet.track).not.toHaveBeenCalled();
    expect(wallet.send).toHaveBeenCalledTimes(1);
  });
  it('rechecks the existing hash after receipt timeout, without rebroadcast', async () => {
    const { flow, wallet, tx } = setup();
    await flow.continue();
    wallet.track.mockRejectedValueOnce(new Error('RPC timeout'));
    await flow.continue();
    expect(flow.state.submitted).toBe(tx);
    await flow.continue();
    expect(wallet.send).toHaveBeenCalledTimes(1);
    expect(wallet.track).toHaveBeenCalledTimes(2);
    expect(flow.state.approvalDone).toBe(true);
  });
  it.each(['REVERTED', 'CANCELLED', 'UNKNOWN', 'REORGED'] as const)(
    'does not mark %s receipts as success',
    async (status) => {
      const { flow, wallet, tx } = setup();
      await flow.continue();
      wallet.track.mockResolvedValueOnce({
        tracked: { ...tx, status },
        listing: null,
        position: null,
      } as Awaited<ReturnType<MarketplaceWallet['track']>>);
      await flow.continue();
      expect(flow.state.approvalDone).toBe(false);
      expect(flow.state.stage).not.toBe('complete');
      expect(flow.state.error).toBeInstanceOf(Error);
      expect(wallet.send).toHaveBeenCalledTimes(1);
    },
  );
  it('requires verified listing data before showing success', async () => {
    const { flow, wallet, tx } = setup(true);
    await flow.continue();
    wallet.track.mockResolvedValueOnce({
      tracked: { ...tx, status: 'CONFIRMED' },
      listing: null,
      position: null,
    });
    await flow.continue();
    expect(flow.state.stage).not.toBe('complete');
    expect(flow.state.submitted).toBe(tx);
    await flow.continue();
    expect(wallet.send).toHaveBeenCalledTimes(1);
    expect(flow.state.stage).toBe('complete');
  });
  it('serializes rapid clicks while a wallet request is unresolved', async () => {
    const { flow, wallet, tx } = setup();
    await flow.continue();
    let resolve!: (t: TrackedTransaction) => void;
    wallet.send.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const first = flow.continue();
    await vi.waitFor(() => expect(wallet.send).toHaveBeenCalledTimes(1));
    await flow.continue();
    await flow.continue();
    resolve(tx);
    await first;
    expect(wallet.send).toHaveBeenCalledTimes(1);
  });
  it.each(['wallet change', 'unmount'])(
    'stops continuation after %s during RPC',
    async (reason) => {
      const { flow, wallet, setCurrent, tx } = setup();
      await flow.continue();
      wallet.track.mockImplementationOnce(async () => {
        if (reason === 'unmount') flow.dispose();
        else setCurrent(false);
        return {
          tracked: { ...tx, status: 'CONFIRMED' },
          listing: null,
          position: null,
        };
      });
      await flow.continue();
      expect(wallet.prepare).toHaveBeenCalledTimes(2);
      expect(wallet.send).toHaveBeenCalledTimes(1);
      expect(flow.state.stage).not.toBe('complete');
    },
  );
  it('shows a changed allowance step before requesting a different transaction', async () => {
    const { flow, wallet, setAllowed } = setup(true);
    await flow.continue();
    setAllowed(false);
    await flow.continue();
    expect(flow.state.preview?.state).toBe('NEEDS_APPROVAL');
    expect(wallet.send).not.toHaveBeenCalled();
  });
});
