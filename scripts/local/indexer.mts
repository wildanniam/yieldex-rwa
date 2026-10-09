import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPublicClient, createTestClient, http } from 'viem';
import { foundry } from 'viem/chains';
import { validateDeploymentManifest } from '@rwa/shared/config';
import { ChainReader } from '@rwa/shared/chain';
import { createDatabase } from '../../apps/worker/src/database.js';
import { FinalizedIndexer } from '../../apps/worker/src/indexer/index.js';

const client = createPublicClient({
  pollingInterval: 50,
  chain: foundry,
  transport: http('http://127.0.0.1:8545'),
});
assert.equal(await client.getChainId(), 31337);
// Anvil deliberately trails finalized by 64 blocks; do not relabel latest.
const finalizerTest = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http('http://127.0.0.1:8545'),
});
await finalizerTest.mine({ blocks: 64 });
const m = validateDeploymentManifest(
  JSON.parse(await readFile('.local/deployment.json', 'utf8')),
  31337,
);
const db = createDatabase(
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
);
const indexer = new FinalizedIndexer(db, new ChainReader(client, m));
try {
  for (let i = 0; i < 20; i++) {
    const r = await indexer.runOnce();
    if (r.status === 'IDLE') break;
    assert.equal(r.status, 'INDEXED');
  }
  const [p] =
    await db`select dto from public.positions where chain_id=31337 and market_address=${m.market} and position_id=1`;
  assert.equal(p?.dto.storedState, 'RELEASED');
  assert.equal(p?.dto.principalShares, '0');
  const [c] =
    await db`select count(*) as count from public.listings where chain_id=31337 and market_address=${m.market}`;
  assert.equal(Number(c?.count), 2);
  const [alloc] =
    await db`select count(*) as count,sum(shares)::text as shares from public.claim_allocations where chain_id=31337 and market_address=${m.market}`;
  assert.equal(Number(alloc?.count), 4);
  assert.equal(alloc?.shares, '3883121876201460976');
  const [claims] =
    await db`select sum(claim_shares)::text as shares from public.claim_balances where chain_id=31337 and market_address=${m.market}`;
  assert.equal(claims?.shares, '0');
  const [count] =
    await db`select count(*) as n from public.chain_logs where chain_id=31337 and contract_address in(${m.market},${m.registry}) and canonical`;
  await Promise.all([
    indexer.runOnce(),
    new FinalizedIndexer(db, new ChainReader(client, m)).runOnce(),
  ]);
  const [again] =
    await db`select count(*) as n from public.chain_logs where chain_id=31337 and contract_address in(${m.market},${m.registry}) and canonical`;
  assert.equal(count?.n, again?.n);
  // Controlled persisted-hash fault, not a naturally occurring finalized reorg.
  await db`update public.chain_cursors set last_block_hash=${'0x' + '11'.repeat(32)} where chain_id=31337 and contract_address=${m.market}`;
  assert.equal((await indexer.runOnce()).status, 'REBUILDING');
  assert.equal((await indexer.runOnce()).status, 'REBUILDING');
  await indexer.rebuildFromBaseline();
  for (let i = 0; i < 20; i++) {
    const r = await indexer.runOnce();
    if (r.status === 'IDLE') break;
    assert.equal(r.status, 'INDEXED');
  }
  const [rebuilt] =
    await db`select dto from public.positions where chain_id=31337 and market_address=${m.market} and position_id=1`;
  assert.equal(rebuilt?.dto.storedState, 'RELEASED');
  const [recount] =
    await db`select count(*) as n from public.chain_logs where chain_id=31337 and contract_address in(${m.market},${m.registry}) and canonical`;
  assert.equal(count?.n, recount?.n);
  // A new empty block must still refresh projections to its pinned timestamp.
  const test = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http('http://127.0.0.1:8545'),
  });
  await test.mine({ blocks: 1 });
  await indexer.runOnce();
  const [latest] =
    await db`select dto from public.assets where chain_id=31337 and registry_address=${m.registry} limit 1`;
  assert.equal(
    latest?.dto.snapshot.blockNumber,
    (await client.getBlock({ blockTag: 'finalized' })).number.toString(),
  );
  console.log(
    'PASS PostgreSQL + RPC indexer: hydration, allocation without double counting, restart, concurrent cursor lock, conflict hold/rebuild, log dedupe and empty-block refresh.',
  );
} finally {
  await db.end();
}
