import type { ChainSnapshot } from '@rwa/shared';
import type { ChainReader } from '@rwa/shared/chain';
import { implementationAbis } from '@rwa/shared/abi';
import type { Address } from 'viem';
import { ApiFailure } from '../http';
import type { Payload } from './reads';
import type { PageCursor } from './cursor';
type View = { payload: Payload; snapshot: ChainSnapshot };
const invalidated = () =>
  new ApiFailure(
    409,
    'CURSOR_INVALIDATED',
    'Chain changed; refresh the marketplace.',
  );

/** A disposable latest-state view, never persisted into the finalized index. */
export class LiveMarket {
  constructor(private reader: ChainReader) {}
  load = async (base: View, cursor: PageCursor | null): Promise<View> => {
    const r = this.reader;
    const snapshot = await r.snapshot(
      cursor ? BigInt(cursor.blockNumber) : 'latest',
    );
    if (cursor && snapshot.blockHash !== cursor.blockHash) throw invalidated();
    const from = BigInt(base.snapshot.blockNumber) + 1n;
    const to = BigInt(snapshot.blockNumber);
    if (from > to + 1n) throw invalidated();
    // Bound public RPC work. Never silently return an incomplete marketplace.
    if (to - from > 512n)
      throw new ApiFailure(
        503,
        'INDEXER_UNAVAILABLE',
        'Index is catching up. Retry shortly.',
      );
    const canonicalBase = await r.snapshot(BigInt(base.snapshot.blockNumber));
    if (canonicalBase.blockHash !== base.snapshot.blockHash)
      throw invalidated();
    const ids = new Map(
      base.payload.listings.map((l) => [
        l.listingId,
        BigInt(l.createdBlockNumber),
      ]),
    );
    const event = implementationAbis.IncomeRightsMarket.find(
      (e) => e.type === 'event' && e.name === 'ListingCreated',
    )!;
    // Hosted RPC accepts at most ten blocks per log request.
    for (let start = from; start <= to; start += 10n) {
      const logs = await r.client.getLogs({
        address: r.manifest.market as Address,
        event,
        fromBlock: start,
        toBlock: start + 9n < to ? start + 9n : to,
      });
      for (const log of logs) {
        if (
          log.removed ||
          log.blockNumber === null ||
          log.args.listingId === undefined
        )
          throw invalidated();
        ids.set(log.args.listingId.toString(), log.blockNumber);
      }
    }
    const assets = await Promise.all(
      r.manifest.assets.map((a) => r.asset(a.assetId, snapshot)),
    );
    const listings: Payload['listings'] = [];
    const positions = new Map<string, Payload['positions'][number]>();
    // Bounded concurrency prevents one request flooding the provider.
    const entries = [...ids];
    for (let i = 0; i < entries.length; i += 3) {
      const details = await Promise.all(
        entries
          .slice(i, i + 3)
          .map(([id, block]) => r.listing(BigInt(id), block, snapshot)),
      );
      for (const detail of details) {
        listings.push(detail.listing);
        positions.set(detail.position.positionKey, detail.position);
      }
    }
    // Detect reorgs during the multi-call read instead of returning mixed state.
    if ((await r.snapshot(to)).blockHash !== snapshot.blockHash)
      throw invalidated();
    return {
      snapshot,
      payload: {
        ...base.payload,
        assets,
        listings,
        positions: [...positions.values()],
      },
    };
  };
}
