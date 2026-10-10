import { describe, it, expect, vi } from 'vitest';
import type { ChainReader } from '@rwa/shared/chain';
import type { ChainSnapshot } from '@rwa/shared';
import { LiveMarket } from './live';
import type { Payload } from './reads';
import type { PageCursor } from './cursor';
const snap = (n: number, hash = `hash${n}`) =>
  ({
    blockNumber: String(n),
    blockHash: hash,
    finality: 'LATEST',
  }) as ChainSnapshot;
function setup() {
  const base = {
    snapshot: snap(100),
    payload: {
      assets: [],
      positions: [],
      events: [],
      claims: [],
      listings: [{ listingId: '1', createdBlockNumber: '90' }],
    } as unknown as Payload,
  };
  const reader = {
    manifest: { market: '0x123', assets: [] },
    snapshot: vi.fn(async (tag: string | bigint) =>
      snap(tag === 'latest' ? 125 : Number(tag)),
    ),
    client: {
      getLogs: vi.fn(async ({ fromBlock }: { fromBlock: bigint }) =>
        fromBlock === 101n
          ? [{ args: { listingId: 2n }, blockNumber: 105n, removed: false }]
          : [],
      ),
    },
    listing: vi.fn(
      async (id: bigint, block: bigint, snapshot: ChainSnapshot) => ({
        listing: {
          listingId: String(id),
          createdBlockNumber: String(block),
          displayStatus: id === 1n ? 'FILLED' : 'OPEN',
          snapshot,
        },
        position: { positionKey: String(id), snapshot },
        asset: { snapshot },
      }),
    ),
  };
  return {
    base,
    reader,
    live: new LiveMarket(reader as unknown as ChainReader),
  };
}
describe('latest marketplace over finalized discovery', () => {
  it('discovers new listings, refreshes filled listings, and pins all reads to one block', async () => {
    const { base, reader, live } = setup();
    const v = await live.load(base, null);
    expect(
      v.payload.listings.map((l) => [l.listingId, l.displayStatus]),
    ).toEqual([
      ['1', 'FILLED'],
      ['2', 'OPEN'],
    ]);
    expect(reader.client.getLogs.mock.calls.map(([a]) => a)).toMatchObject([
      { fromBlock: 101n, toBlock: 110n },
      { fromBlock: 111n, toBlock: 120n },
      { fromBlock: 121n, toBlock: 125n },
    ]);
    expect(
      reader.listing.mock.calls.every((c) => c[2].blockNumber === '125'),
    ).toBe(true);
    expect(base.payload.listings).toHaveLength(1);
  });
  it('shares overlapping reads but fetches fresh state after completion', async () => {
    const { base, reader, live } = setup();
    const [one, two] = await Promise.all([
      live.load(base, null),
      live.load(base, null),
    ]);
    expect(one).toBe(two);
    expect(reader.client.getLogs).toHaveBeenCalledTimes(3);
    await live.load(base, null);
    expect(reader.client.getLogs).toHaveBeenCalledTimes(6);
  });
  it('clears shared failures so a later request can recover', async () => {
    const { base, reader, live } = setup();
    reader.client.getLogs.mockRejectedValueOnce(new Error('rate limited'));
    const results = await Promise.allSettled([
      live.load(base, null),
      live.load(base, null),
    ]);
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect((await live.load(base, null)).payload.listings).toHaveLength(2);
  });
  it('pins a cursor and rejects a changed canonical block', async () => {
    const { base, live } = setup();
    const cursor = { blockNumber: '120', blockHash: 'hash120' } as PageCursor;
    expect((await live.load(base, cursor)).snapshot.blockNumber).toBe('120');
    await expect(
      live.load(base, { ...cursor, blockHash: 'reorg' }),
    ).rejects.toThrow('Chain changed');
  });
  it('rejects a reorg during reading', async () => {
    const { base, reader, live } = setup();
    reader.snapshot.mockImplementation(async (tag) =>
      tag === 125n
        ? snap(125, 'reorg')
        : snap(tag === 'latest' ? 125 : Number(tag)),
    );
    await expect(live.load(base, null)).rejects.toThrow('Chain changed');
  });
  it('does not silently fall back when RPC fails and recovers on the next call', async () => {
    const { base, reader, live } = setup();
    reader.client.getLogs.mockRejectedValueOnce(new Error('RPC unavailable'));
    await expect(live.load(base, null)).rejects.toThrow('RPC unavailable');
    expect((await live.load(base, null)).payload.listings).toHaveLength(2);
  });
  it('rejects a cursor overtaken by the finalized base and excessive catch-up', async () => {
    const { base, reader, live } = setup();
    await expect(
      live.load(base, { blockNumber: '99', blockHash: 'hash99' } as PageCursor),
    ).rejects.toThrow('Chain changed');
    reader.snapshot.mockImplementation(async (tag) =>
      snap(tag === 'latest' ? 1000 : Number(tag)),
    );
    await expect(live.load(base, null)).rejects.toThrow('Index is catching up');
  });
});
