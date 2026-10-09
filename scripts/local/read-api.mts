import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  createPublicClient,
  createWalletClient,
  createTestClient,
  http,
  type Address,
} from 'viem';
import { foundry } from 'viem/chains';
import { implementationAbis as abi } from '@rwa/shared/abi';
import { validateDeploymentManifest } from '@rwa/shared/config';
import { ChainReader } from '@rwa/shared/chain';
import { validateData } from '@rwa/shared/validation';
import type { ListingsPage, AssetsPage, ClaimsPage } from '@rwa/shared';
import { createDatabase } from '../../apps/worker/src/database.js';
import { FinalizedIndexer } from '../../apps/worker/src/indexer/index.js';
import { MarketReads } from '../../apps/web/src/server/market/reads.js';
import { Cursors } from '../../apps/web/src/server/market/cursor.js';
const rpc = 'http://127.0.0.1:8545',
  client = createPublicClient({
    chain: foundry,
    transport: http(rpc),
    pollingInterval: 50,
  });
assert.equal(await client.getChainId(), 31337);
const m = validateDeploymentManifest(
  JSON.parse(await readFile('.local/deployment.json', 'utf8')),
  31337,
);
const base = createWalletClient({ chain: foundry, transport: http(rpc) }),
  accounts = await base.getAddresses(),
  alice = accounts[2]!;
const wallet = createWalletClient({
    account: alice,
    chain: foundry,
    transport: http(rpc),
  }),
  test = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http(rpc),
  });
const market = m.market as Address,
  a = m.assets[1]!;
if (!process.argv.includes('--reuse-seed')) {
  const allowance = await wallet.writeContract({
    address: a.token as Address,
    abi: abi.DemoShareToken,
    functionName: 'approve',
    args: [market, 10n * 10n ** 18n],
  });
  await client.waitForTransactionReceipt({ hash: allowance });
  for (const price of [10n, 2n, 20n, 3n, 40n, 1n, 100n, 99n, 4n, 5n]) {
    const block = await client.getBlock();
    const hash = await wallet.writeContract({
      address: market,
      abi: abi.IncomeRightsMarket,
      functionName: 'createPrimaryListing',
      args: [
        {
          assetId: a.assetId as `0x${string}`,
          depositTokenAmountAtomic: 10n ** 18n,
          minReceivedShares: 10n ** 18n,
          incomeBps: 5000,
          durationSeconds: 600n,
          priceAtomic: price * 10n ** 6n,
          listingExpiresAt: block.timestamp + 3000n,
        },
      ],
    });
    assert.equal(
      (await client.waitForTransactionReceipt({ hash })).status,
      'success',
    );
  }
}
await test.mine({ blocks: 64 });
const db = createDatabase(
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
);
const indexer = new FinalizedIndexer(db, new ChainReader(client, m));
try {
  for (let i = 0; i < 30; i++) {
    const r = await indexer.runOnce();
    if (r.status === 'IDLE') break;
    assert.equal(r.status, 'INDEXED');
  }
  const service = new MarketReads(
    db,
    m,
    new Cursors('local-test-only-key'.repeat(3)),
  );
  const path = ['chains', '31337', 'markets', m.market, 'listings'];
  const query = new URLSearchParams({
    sort: 'PRICE_ASC',
    limit: '2',
    maxPriceAtomic: '10000000',
  });
  const first = (await service.read(path, query, randomUUID())) as ListingsPage;
  assert.ok(validateData('api.ListingsPage', first).success);
  assert.deepEqual(
    first.items.map((d) => d.listing.priceAtomic),
    ['1000000', '2000000'],
  );
  assert.ok(first.pagination.hasMore);
  const ids = new Set(first.items.map((d) => d.listing.listingId));
  let cursor = first.pagination.nextCursor;
  // Publish a later batch between pages; old cursor must retain its pinned block.
  await test.mine({ blocks: 1 });
  await indexer.runOnce();
  while (cursor) {
    query.set('cursor', cursor);
    const next = (await service.read(
      path,
      query,
      randomUUID(),
    )) as ListingsPage;
    assert.equal(next.snapshot.blockHash, first.snapshot.blockHash);
    for (const item of next.items) {
      assert.ok(!ids.has(item.listing.listingId));
      ids.add(item.listing.listingId);
    }
    cursor = next.pagination.nextCursor;
  }
  assert.equal(ids.size, 6);
  const changed = new URLSearchParams({
    sort: 'NEWEST',
    limit: '2',
    cursor: first.pagination.nextCursor!,
  });
  await assert.rejects(() => service.read(path, changed, randomUUID()));
  await assert.rejects(() =>
    service.read(path, new URLSearchParams({ sql: 'DROP' }), randomUUID()),
  );
  await assert.rejects(() =>
    service.read(
      ['chains', '1', 'markets', m.market, 'listings'],
      new URLSearchParams(),
      randomUUID(),
    ),
  );
  const assets = (await service.read(
    ['chains', '31337', 'registries', m.registry, 'assets'],
    new URLSearchParams(),
    randomUUID(),
  )) as AssetsPage;
  assert.equal(assets.items.length, 3);
  const claims = (await service.read(
    [
      'chains',
      '31337',
      'markets',
      m.market,
      'accounts',
      accounts[3]!,
      'claims',
    ],
    new URLSearchParams(),
    randomUUID(),
  )) as ClaimsPage;
  assert.equal(claims.items.length, 3);
  assert.ok(claims.items.every((c) => c.claimShares === '0'));
  await db`update public.chain_cursors set state='REBUILDING' where chain_id=31337 and contract_address=${m.market}`;
  await assert.rejects(
    () => service.read(path, new URLSearchParams(), randomUUID()),
    /direkonsiliasi/,
  );
  await db`update public.chain_cursors set state='READY' where chain_id=31337 and contract_address=${m.market}`;
  console.log(
    'PASS read service with real DB/RPC: numeric filtering/order, 6 unique paged listings, pinned snapshot through index advance, signed-filter cursor, three assets/zero claims, unknown input/deployment rejection, rebuilding hold.',
  );
} finally {
  await db.end();
}
