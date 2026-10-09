import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import {
  createPublicClient,
  createWalletClient,
  createTestClient,
  http,
  keccak256,
  toHex,
  encodeAbiParameters,
  type Address,
  type Hex,
  type Abi,
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { foundry } from 'viem/chains';
import { implementationAbis as abi } from '@rwa/shared/abi';
import {
  validateDeploymentManifest,
  deriveAssetId,
  DEMO_ASSET_PRESETS,
} from '@rwa/shared/config';
import { ChainReader } from '@rwa/shared/chain';
import { prepareTransaction } from '@rwa/shared/transactions';
import { createDatabase } from '../../apps/worker/src/database.js';
import { FinalizedIndexer } from '../../apps/worker/src/indexer/index.js';
import { RegistryOutbox } from '../../apps/worker/src/finalizer/outbox.js';
import {
  ReviewedReconciler,
  type ReviewedReport,
} from '../../apps/worker/src/finalizer/reconcile.js';
import { MarketReads } from '../../apps/web/src/server/market/reads.js';
import { Cursors } from '../../apps/web/src/server/market/cursor.js';

// Isolated Anvil and a newly-created database. Never touch the user's /lab chain/data.
const socket = createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const address = socket.address();
assert(address && typeof address !== 'string');
const port = address.port;
await new Promise<void>((resolve) => socket.close(() => resolve()));
const child = spawn(
  'node_modules/.bin/anvil',
  [
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--chain-id',
    '31337',
    '--silent',
  ],
  { stdio: 'ignore' },
);
const rpc = `http://127.0.0.1:${port}`;
const client = createPublicClient({
  chain: foundry,
  transport: http(rpc, { retryCount: 0 }),
  pollingInterval: 20,
});
const test = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http(rpc),
});
const wallet = createWalletClient({ chain: foundry, transport: http(rpc) });
const dbName = 'rwa_recovery_' + randomUUID().replaceAll('-', '');
const control = createDatabase(
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
);
const db = createDatabase(
  `postgresql://postgres:postgres@127.0.0.1:54322/${dbName}`,
);
let created = false;
const evidence = keccak256(toHex('LOCAL SIMULATION: recovery regression'));
const receipts: { hash: Hex; action: string }[] = [];
try {
  for (let i = 0; ; i++) {
    try {
      assert.equal(await client.getChainId(), 31337);
      break;
    } catch (e) {
      if (i === 40 || child.exitCode !== null) throw e;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  await test.setBlockTimestampInterval({ interval: 1 });
  await control.unsafe(`create database "${dbName}"`);
  created = true;
  // Only the prerequisites for the exact production read-model migrations; not an auth test.
  await db.unsafe(
    'create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;',
  );
  for (const name of [
    '202610080001_core.sql',
    '202610080002_read_snapshots.sql',
    '202610080006_finalizer_outbox.sql',
    '202610080007_recovery_identity.sql',
  ])
    await db.unsafe(await readFile('supabase/migrations/' + name, 'utf8'));
  const [admin, alice, bob] = await wallet.getAddresses();
  assert(admin && alice && bob);
  async function receipt(hash: Hex, action: string) {
    const r = await client.waitForTransactionReceipt({ hash });
    assert.equal(r.status, 'success');
    receipts.push({ hash, action });
    return r;
  }
  async function deploy(name: string, args: readonly unknown[]) {
    const artifact = JSON.parse(
      await readFile(`packages/contracts/out/${name}.sol/${name}.json`, 'utf8'),
    );
    const r = await receipt(
      await wallet.deployContract({
        account: admin!,
        abi: artifact.abi as Abi,
        bytecode: artifact.bytecode.object as Hex,
        args,
      }),
      `deploy ${name}`,
    );
    assert(r.contractAddress);
    return r.contractAddress;
  }
  async function write(
    target: Address,
    contract: keyof typeof abi,
    name: string,
    args: readonly unknown[],
    account = admin!,
  ) {
    return receipt(
      await wallet.writeContract({
        account,
        address: target,
        abi: abi[contract] as Abi,
        functionName: name,
        args,
      }),
      name,
    );
  }
  const signer = privateKeyToAccount(generatePrivateKey());
  await test.setBalance({ address: signer.address, value: 10n ** 20n });
  const registry = await deploy('CorporateActionRegistry', [
    admin,
    signer.address,
  ]);
  const first = await client.getBlock();
  const adapter = await deploy('XStocksAdapter', []),
    usd = await deploy('DemoUSD', [admin]),
    market = await deploy('IncomeRightsMarket', [registry, usd]);
  const assets = [];
  for (const preset of DEMO_ASSET_PRESETS) {
    const token = await deploy('DemoShareToken', [
      preset.name,
      preset.symbol,
      admin,
    ]);
    await write(registry, 'CorporateActionRegistry', 'registerAsset', [
      token,
      adapter,
      true,
      evidence,
    ]);
    await write(token, 'DemoShareToken', 'mint', [alice, 1000n * 10n ** 18n]);
    assets.push({
      assetId: deriveAssetId(31337, token),
      token,
      adapter,
      symbol: preset.symbol,
      tokenDecimals: 18 as const,
      isDemo: true,
    });
  }
  const m = validateDeploymentManifest(
    {
      interfaceVersion: '1.0',
      environment: 'LOCAL',
      chainId: 31337,
      registry,
      market,
      paymentToken: {
        address: usd,
        decimals: 6,
        symbol: 'DemoUSD',
        isDemo: true,
      },
      deploymentBlock: first.number.toString(),
      sourceCommit: '0'.repeat(40),
      assets,
    },
    31337,
  );
  const reader = new ChainReader(client, m),
    indexer = new FinalizedIndexer(db, reader, 256);
  await write(usd, 'DemoUSD', 'mint', [bob, 1000n * 10n ** 6n]);
  await write(usd, 'DemoUSD', 'approve', [market, 1000n * 10n ** 6n], bob);
  for (const a of assets) {
    await write(
      a.token,
      'DemoShareToken',
      'approve',
      [market, 1000n * 10n ** 18n],
      alice,
    );
    const now = (await client.getBlock()).timestamp;
    await write(
      market,
      'IncomeRightsMarket',
      'createPrimaryListing',
      [
        {
          assetId: a.assetId,
          depositTokenAmountAtomic: 100n * 10n ** 18n,
          minReceivedShares: 100n * 10n ** 18n,
          incomeBps: 5000,
          durationSeconds: 600n,
          priceAtomic: 90n * 10n ** 6n,
          listingExpiresAt: now + 300n,
        },
      ],
      alice,
    );
  }
  const token = assets[0]!.token,
    id = assets[0]!.assetId as Hex;
  const l = await client.readContract({
    address: market,
    abi: abi.IncomeRightsMarket,
    functionName: 'getListing',
    args: [1n],
  });
  const h = await client.readContract({
    address: registry,
    abi: abi.CorporateActionRegistry,
    functionName: 'getAssetHead',
    args: [id],
  });
  await write(
    market,
    'IncomeRightsMarket',
    'buyListing',
    [
      {
        listingId: 1n,
        expectedTermsHash: l.termsHash,
        expectedAssetHeadHash: h.assetHeadHash,
        maxPriceAtomic: l.priceAtomic,
        deadline: (await client.getBlock()).timestamp + 100n,
        maxEvents: 32,
      },
    ],
    bob,
  );
  const effective = (await client.getBlock()).timestamp + 5n;
  await write(token, 'DemoShareToken', 'schedule', [
    102n * 10n ** 16n,
    1n,
    effective,
  ]);
  await test.setNextBlockTimestamp({ timestamp: effective });
  await test.mine({ blocks: 1 });
  await write(registry, 'CorporateActionRegistry', 'setAssetSafetyState', [
    id,
    1,
    evidence,
  ]);
  const source = await client.getBlock();
  await test.mine({ blocks: 64 });
  const occurrence = keccak256(toHex('demo:recovery:1'));
  const report: ReviewedReport = {
    assetId: id,
    sourceKind: 'SIMULATOR',
    evidenceHash: evidence,
    sourceBlockNumber: source.number,
    sourceBlockHash: source.hash!,
    sourceBlockTimestamp: source.timestamp,
    reviewedThrough: source.timestamp,
    events: [
      {
        eventId: keccak256(
          encodeAbiParameters(
            [{ type: 'uint256' }, { type: 'address' }, { type: 'bytes32' }],
            [31337n, token, occurrence],
          ),
        ),
        sequence: 1n,
        kind: 0,
        effectiveAt: effective,
        multiplierBefore: 10n ** 18n,
        multiplierAfter: 102n * 10n ** 16n,
        issuerNonceAfter: 1n,
        historyIndex: 1n,
        sourceRevision: 1,
        sourceOccurrenceKey: occurrence,
        evidenceHash: evidence,
      },
    ],
  };
  const outbox = new RegistryOutbox(
    db,
    reader,
    createWalletClient({
      account: signer,
      chain: foundry,
      transport: http(rpc),
    }),
  );
  const reconciler = new ReviewedReconciler(reader, outbox, {
    assetId: id,
    tokenRuntimeCodeHash: keccak256(
      (await client.getCode({ address: token }))!,
    ),
    implementationAddress: null,
  });
  let status = await reconciler.step(report);
  for (let i = 0; i < 10 && status !== 'HELD'; i++) {
    await test.mine({ blocks: 64 });
    status = await reconciler.step(report);
  }
  assert.equal(status, 'HELD');
  assert.equal(
    (
      await client.readContract({
        address: registry,
        abi: abi.CorporateActionRegistry,
        functionName: 'getAssetHead',
        args: [id],
      })
    ).eventCount,
    1n,
  );
  assert.equal(
    (
      await client.readContract({
        address: registry,
        abi: abi.CorporateActionRegistry,
        functionName: 'getAsset',
        args: [id],
      })
    ).safetyState,
    1,
  );
  assert.equal(
    await client.readContract({
      address: market,
      abi: abi.IncomeRightsMarket,
      functionName: 'totalClaimShares',
      args: [id],
    }),
    0n,
  );
  const [badJobs] =
    await db`select count(*)::int as n from app_private.worker_outbox where status='HELD'`;
  assert.equal(
    badJobs!.n,
    0,
    'Administrative wait must not poison outbox jobs',
  );
  await write(registry, 'CorporateActionRegistry', 'setAssetSafetyState', [
    id,
    0,
    evidence,
  ]);
  status = await reconciler.step(report);
  for (let i = 0; i < 5 && status !== 'COMPLETE'; i++) {
    await test.mine({ blocks: 64 });
    status = await reconciler.step(report);
  }
  assert.equal(status, 'COMPLETE');
  await write(market, 'IncomeRightsMarket', 'checkpointPosition', [1n, 32]);
  async function index() {
    await test.mine({ blocks: 65 });
    for (let i = 0; i < 20; i++)
      if ((await indexer.runOnce()).status === 'IDLE') return;
    throw Error('Indexer failed to catch up');
  }
  await index();
  const api = new MarketReads(
    db,
    m,
    new Cursors('isolated-test-cursor-secret-32-bytes'),
  );
  const read = (path: string[]) =>
    api.read(path, new URLSearchParams(), randomUUID());
  const assetPath = ['chains', '31337', 'registries', m.registry, 'assets'];
  const marketPath = ['chains', '31337', 'markets', m.market];
  // A second unsold position in the affected asset tests safe cancellation.
  await write(
    market,
    'IncomeRightsMarket',
    'createPrimaryListing',
    [
      {
        assetId: id,
        depositTokenAmountAtomic: 10n * 10n ** 18n,
        minReceivedShares: 9n * 10n ** 18n,
        incomeBps: 5000,
        durationSeconds: 600n,
        priceAtomic: 10n * 10n ** 6n,
        listingExpiresAt: (await client.getBlock()).timestamp + 300n,
      },
    ],
    alice,
  );
  const original = (await client.getCode({ address: token }))!;
  await write(registry, 'CorporateActionRegistry', 'setAssetSafetyState', [
    id,
    2,
    evidence,
  ]);
  // Controlled incompatible token code, ONLY on this test-owned Anvil.
  await test.setCode({ address: token, bytecode: '0x60006000fd' });
  await index();
  const page = (await read(assetPath)) as {
    items: {
      assetId: string;
      syncStatus: string;
      currentMultiplier: string | null;
    }[];
  };
  assert.equal(page.items.length, 3);
  assert.equal(
    page.items.find((a) => a.assetId === id)!.syncStatus,
    'ADAPTER_UNAVAILABLE',
  );
  assert.equal(page.items.find((a) => a.assetId !== id)!.syncStatus, 'SYNCED');
  const position = (await read([...marketPath, 'positions', '1'])) as {
    data: {
      principalShares: string;
      principalTokenAmountAtomic: string | null;
    };
  };
  assert(position.data.principalShares !== '0');
  assert.equal(position.data.principalTokenAmountAtomic, null);
  const claims = (await read([
    ...marketPath,
    'accounts',
    bob.toLowerCase(),
    'claims',
  ])) as {
    items: { claimShares: string; claimTokenAmountAtomic: string | null }[];
  };
  assert(
    claims.items.some(
      (c) => BigInt(c.claimShares) > 0n && c.claimTokenAmountAtomic === null,
    ),
  );
  const blocked = await prepareTransaction(
    reader,
    {
      action: 'CLAIM_INCOME',
      assetKey: `eip155:31337:${m.registry}:${id}`,
      shares: '1',
    },
    bob,
    { intentId: randomUUID(), stepId: randomUUID() },
  );
  assert.equal(blocked.state, 'BLOCKED');
  assert.deepEqual(blocked.blockers, ['ADAPTER_UNAVAILABLE']);
  const safeCancel = await prepareTransaction(
    reader,
    {
      action: 'CANCEL_LISTING',
      listingKey: `eip155:31337:${m.market}:4`,
    },
    alice,
    { intentId: randomUUID(), stepId: randomUUID() },
  );
  assert.equal(safeCancel.state, 'READY');
  await write(market, 'IncomeRightsMarket', 'cancelListing', [4n], alice);
  const prepared = await prepareTransaction(
    reader,
    { action: 'CANCEL_LISTING', listingKey: `eip155:31337:${m.market}:2` },
    alice,
    { intentId: randomUUID(), stepId: randomUUID() },
  );
  assert.equal(prepared.state, 'READY');
  await write(market, 'IncomeRightsMarket', 'cancelListing', [2n], alice);
  await index();
  const listing = (await read([...marketPath, 'listings', '2'])) as {
    data: { listing: { storedStatus: string } };
  };
  assert.equal(listing.data.listing.storedStatus, 'CANCELLED');
  const blockBefore = (
    await db`select next_block::text as n from public.chain_cursors where contract_address=${m.market}`
  )[0]!.n;
  await test.setCode({ address: token, bytecode: original });
  await index();
  const recovered = (await read(assetPath)) as typeof page;
  assert.equal(
    recovered.items.find((a) => a.assetId === id)!.syncStatus,
    'TRANSFER_QUARANTINED',
  );
  assert.notEqual(
    recovered.items.find((a) => a.assetId === id)!.currentMultiplier,
    null,
  );
  await write(registry, 'CorporateActionRegistry', 'setAssetSafetyState', [
    id,
    0,
    evidence,
  ]);
  await index();
  const blockAfter = (
    await db`select next_block::text as n from public.chain_cursors where contract_address=${m.market}`
  )[0]!.n;
  assert(BigInt(blockAfter) > BigInt(blockBefore));
  await mkdir('.local/recovery-evidence', { recursive: true });
  await writeFile(
    '.local/recovery-evidence/result.json',
    JSON.stringify(
      {
        status: 'PASS',
        receipts,
        scenarios: [
          'reviewed append+ack while quarantined',
          'admin-only resume, coverage then checkpoint',
          'isolated incompatible token with actual RPC+DB+read API',
          'healthy listing cancel/index update during fault',
          'shares preserved, null token conversions',
          'adapter restored and admin resume',
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    'PASS: quarantine worker recovery and isolated adapter failure across actual RPC/PostgreSQL/read API; ephemeral state cleaned.',
  );
} finally {
  await db.end();
  if (created) await control.unsafe(`drop database "${dbName}" with (force)`);
  await control.end();
  child.kill('SIGTERM');
}
