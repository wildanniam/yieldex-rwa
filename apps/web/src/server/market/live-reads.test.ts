import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import type postgres from 'postgres';
import type { ListingsPage } from '@rwa/shared';
import type { DeploymentManifest } from '@rwa/shared/config';
import { MarketReads, type Payload } from './reads';
import { Cursors } from './cursor';
const fixture = (name: string) =>
  JSON.parse(readFileSync(`examples/${name}.valid.json`, 'utf8'));
describe('live search API', () => {
  it('uses live values for filtering, details and signed pinned pagination', async () => {
    const a = fixture('asset'),
      p = fixture('position-active'),
      l = fixture('listing-primary').listing;
    const snapshot = { ...a.snapshot, finality: 'LATEST' };
    const rows = [1, 2, 3].map((id) => ({
      ...l,
      listingId: String(id),
      listingKey: l.listingKey.replace(/:\d+$/, `:${id}`),
      priceAtomic: String(id * 100),
      createdBlockNumber: String(id),
      displayStatus: id === 3 ? 'FILLED' : 'OPEN',
      snapshot,
    }));
    const payload: Payload = {
      assets: [{ ...a, snapshot }],
      positions: [
        { ...p, positionKey: l.positionKey, assetKey: a.assetKey, snapshot },
      ],
      listings: rows,
      events: [],
      claims: [],
    };
    const baseSnapshot = { ...snapshot, finality: 'FINALIZED' };
    const base = {
      payload: {
        ...payload,
        assets: payload.assets.map((x) => ({ ...x, snapshot: baseSnapshot })),
        positions: payload.positions.map((x) => ({
          ...x,
          snapshot: baseSnapshot,
        })),
        listings: [],
      },
      snapshot: baseSnapshot,
    };
    const sql = async (strings: TemplateStringsArray) =>
      strings.join('').includes('select state')
        ? [{ state: 'READY' }]
        : [structuredClone(base)];
    const db = {
      begin: async (_: string, fn: (sql: unknown) => unknown) => fn(sql),
    } as unknown as ReturnType<typeof postgres>;
    const m = {
      chainId: a.token.chainId,
      market: l.seller,
      registry: a.registryAddress,
      assets: [{ assetId: a.assetId }],
    } as DeploymentManifest;
    const reads = new MarketReads(
      db,
      m,
      new Cursors('x'.repeat(32), () => snapshot.observedAt),
      () => snapshot.observedAt,
      async (_base, cursor) => {
        if (cursor) expect(cursor.blockHash).toBe(snapshot.blockHash);
        return { payload, snapshot };
      },
    );
    const path = ['chains', String(m.chainId), 'markets', m.market, 'listings'];
    const first = (await reads.read(
      path,
      new URLSearchParams({ limit: '1', sort: 'PRICE_ASC' }),
      '00000000-0000-4000-8000-000000000000',
    )) as ListingsPage;
    expect(first.items.map((x) => x.listing.listingId)).toEqual(['1']);
    const next = (await reads.read(
      path,
      new URLSearchParams({
        limit: '1',
        sort: 'PRICE_ASC',
        cursor: first.pagination.nextCursor!,
      }),
      '00000000-0000-4000-8000-000000000000',
    )) as ListingsPage;
    expect(next.items.map((x) => x.listing.listingId)).toEqual(['2']);
    expect(next.pagination.hasMore).toBe(false);
    const filtered = (await reads.read(
      path,
      new URLSearchParams({ maxPriceAtomic: '150' }),
      '00000000-0000-4000-8000-000000000000',
    )) as ListingsPage;
    expect(filtered.items).toHaveLength(1);
    await expect(
      reads.read(
        path,
        new URLSearchParams({
          sort: 'NEWEST',
          cursor: first.pagination.nextCursor!,
        }),
        '00000000-0000-4000-8000-000000000000',
      ),
    ).rejects.toThrow('Cursor');
    expect(
      (
        (await reads.read(
          [...path, '2'],
          new URLSearchParams(),
          '00000000-0000-4000-8000-000000000000',
        )) as {
          data: { listing: { listingId: string } };
        }
      ).data.listing.listingId,
    ).toBe('2');
  });
});
