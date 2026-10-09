import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { spawn, execFileSync } from 'node:child_process';
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
import { createDatabase } from '../../apps/worker/src/database.js';
import { parseReviewedFile } from '../../apps/worker/src/finalizer/review-file.js';
import { RegistryOutbox } from '../../apps/worker/src/finalizer/outbox.js';
import {
  ReviewedReconciler,
  type ReviewedReport,
  type AssetPolicy,
} from '../../apps/worker/src/finalizer/reconcile.js';

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
const dbName = 'rwa_worker_' + randomUUID().replaceAll('-', '');
const control = createDatabase(
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
);
const db = createDatabase(
  `postgresql://postgres:postgres@127.0.0.1:54322/${dbName}`,
);
let created = false;
const evidence = keccak256(toHex('LOCAL SIMULATION: worker regression'));
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
  const reader = new ChainReader(client, m);

  const signerWallet = createWalletClient({
    account: signer,
    chain: foundry,
    transport: http(rpc),
  });
  const freshOutbox = () =>
    new RegistryOutbox(db, new ChainReader(client, m), signerWallet);
  const policy = async (a: (typeof m.assets)[number]) => ({
    assetId: a.assetId as Hex,
    tokenRuntimeCodeHash: keccak256(
      (await client.getCode({ address: a.token as Address }))!,
    ),
    implementationAddress: null,
  });
  const head = (id: Hex) =>
    client.readContract({
      address: registry,
      abi: abi.CorporateActionRegistry,
      functionName: 'getAssetHead',
      args: [id],
    });
  async function reportFor(
    id: Hex,
    events: ReviewedReport['events'] = [],
    evidenceHash = evidence,
  ): Promise<ReviewedReport> {
    const source = await client.getBlock();
    await test.mine({ blocks: 64 });
    return {
      assetId: id,
      sourceKind: 'SIMULATOR',
      evidenceHash,
      sourceBlockNumber: source.number,
      sourceBlockHash: source.hash!,
      sourceBlockTimestamp: source.timestamp,
      reviewedThrough: source.timestamp,
      events,
    };
  }
  async function complete(report: ReviewedReport, p: AssetPolicy) {
    for (let i = 0; i < 8; i++) {
      // New instances on every poll exercise durable restart, not in-memory state.
      const r = new ReviewedReconciler(
        new ChainReader(client, m),
        freshOutbox(),
        p,
      );
      const status = await r.step(report);
      if (status === 'COMPLETE') return;
      assert.equal(status, 'PENDING');
      await test.mine({ blocks: 64 });
    }
    assert.fail('Reviewed report did not complete after restart/retries');
  }
  const results: string[] = [];
  if (process.argv[2] !== 'recurrence') {
    const a = m.assets[0]!,
      id = a.assetId as Hex,
      token = a.token as Address;
    const p = await policy(a);
    await write(usd, 'DemoUSD', 'mint', [bob, 1000n * 10n ** 6n]);
    await write(usd, 'DemoUSD', 'approve', [market, 1000n * 10n ** 6n], bob);
    await write(
      token,
      'DemoShareToken',
      'approve',
      [market, 100n * 10n ** 18n],
      alice,
    );
    await write(
      market,
      'IncomeRightsMarket',
      'createPrimaryListing',
      [
        {
          assetId: id,
          depositTokenAmountAtomic: 100n * 10n ** 18n,
          minReceivedShares: 100n * 10n ** 18n,
          incomeBps: 5000,
          durationSeconds: 600n,
          priceAtomic: 90n * 10n ** 6n,
          listingExpiresAt: (await client.getBlock()).timestamp + 300n,
        },
      ],
      alice,
    );
    const listing = await client.readContract({
      address: market,
      abi: abi.IncomeRightsMarket,
      functionName: 'getListing',
      args: [1n],
    });
    await write(
      market,
      'IncomeRightsMarket',
      'buyListing',
      [
        {
          listingId: 1n,
          expectedTermsHash: listing.termsHash,
          expectedAssetHeadHash: (await head(id)).assetHeadHash,
          maxPriceAtomic: listing.priceAtomic,
          deadline: (await client.getBlock()).timestamp + 100n,
          maxEvents: 32,
        },
      ],
      bob,
    );
    const effective = (await client.getBlock()).timestamp + 5n;
    await write(token, 'DemoShareToken', 'schedule', [
      10n ** 18n,
      1n,
      effective,
    ]);
    await test.setNextBlockTimestamp({ timestamp: effective });
    await test.mine({ blocks: 1 });
    const occurrence = keccak256(toHex('NO_INCOME:worker:1'));
    const report = await reportFor(id, [
      {
        eventId: keccak256(
          encodeAbiParameters(
            [{ type: 'uint256' }, { type: 'address' }, { type: 'bytes32' }],
            [31337n, token, occurrence],
          ),
        ),
        sequence: 1n,
        kind: 3,
        effectiveAt: effective,
        multiplierBefore: 10n ** 18n,
        multiplierAfter: 10n ** 18n,
        issuerNonceAfter: 1n,
        historyIndex: 1n,
        sourceRevision: 1,
        sourceOccurrenceKey: occurrence,
        evidenceHash: evidence,
      },
    ]);
    assert.equal(
      await new ReviewedReconciler(reader, freshOutbox(), p).step({
        ...report,
        events: [],
      }),
      'WAITING_SOURCE',
    );
    const parsed = parseReviewedFile(
      JSON.stringify({ policy: p, report }, (_, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    );
    await complete(parsed.report, parsed.policy);
    await write(market, 'IncomeRightsMarket', 'checkpointPosition', [1n, 32]);
    const position = await client.readContract({
      address: market,
      abi: abi.IncomeRightsMarket,
      functionName: 'getPosition',
      args: [1n],
    });
    assert.equal(position.principalShares, 100n * 10n ** 18n);
    assert.equal(position.principalOwner.toLowerCase(), alice.toLowerCase());
    assert.equal(position.rightsOwner.toLowerCase(), bob.toLowerCase());
    assert.equal(position.eventCursor, 1n);
    assert.equal(
      await client.readContract({
        address: market,
        abi: abi.IncomeRightsMarket,
        functionName: 'totalClaimShares',
        args: [id],
      }),
      0n,
    );
    assert.equal((await head(id)).issuerNonce, 1n);
    assert.equal((await head(id)).eventCount, 1n);
    assert.equal((await head(id)).finalizedThrough, report.reviewedThrough);
    await complete(parsed.report, parsed.policy);
    assert.equal((await head(id)).eventCount, 1n);
    results.push(
      'NO_INCOME JSON → append/ack/coverage/checkpoint: principal unchanged, zero claims, cursor/nonce advanced, missing classification blocked, replay deduplicated',
    );
  }
  const a = m.assets[1]!,
    id = a.assetId as Hex,
    token = a.token as Address,
    p = await policy(a);
  const at = (await client.getBlock()).timestamp + 10000n;
  let firstReport: ReviewedReport | undefined;
  const hashes: Hex[] = [];
  for (const [i, multiplier] of [102n, 103n, 102n, 103n, 102n].entries()) {
    await write(token, 'DemoShareToken', 'schedule', [
      multiplier * 10n ** 16n,
      1n,
      at,
    ]);
    const current = await reportFor(
      id,
      [],
      i < 3 ? evidence : keccak256(toHex('review:' + i)),
    );
    firstReport ??= current;
    // Reuse even the original source report on A's second occurrence. Its coverage
    // must not regress; identical live state does not erase the intervening ACK.
    const report = i === 2 ? firstReport : current;
    if (i === 0) await test.setAutomine(false);
    const outbox = freshOutbox();
    const r = new ReviewedReconciler(reader, outbox, p);
    if (i === 1) {
      const realLogs = client.getContractEvents.bind(client);
      const jobsBefore = (
        await db`select count(*)::int as n from app_private.worker_outbox`
      )[0]!.n;
      client.getContractEvents = async () => {
        throw Error('Injected history RPC failure');
      };
      try {
        await assert.rejects(() => r.step(report), /history RPC failure/);
      } finally {
        client.getContractEvents = realLogs;
      }
      assert.equal(
        (await db`select count(*)::int as n from app_private.worker_outbox`)[0]!
          .n,
        jobsBefore,
      );
      // Exercise the empty newest range and backwards search to the previous ACK.
      await test.mine({ blocks: 2001 });
    }
    const realSend = client.sendRawTransaction.bind(client);
    if (i === 0)
      client.sendRawTransaction = async (args) => {
        await realSend(args);
        throw Error('Injected response loss after actual broadcast');
      };
    try {
      const statuses = await Promise.all([r.step(report), r.step(report)]);
      assert.ok(
        statuses.every((s) => s === 'PENDING' || s === 'COMPLETE'),
        JSON.stringify({ i, statuses }),
      );
    } finally {
      client.sendRawTransaction = realSend;
    }
    const [pending] =
      await db`select job_id,signed_transaction,transaction_hash,nonce from app_private.worker_outbox where payload->>'assetId'=${id} order by nonce desc limit 1`;
    assert.ok(pending?.signed_transaction);
    if (i === 0) await test.setAutomine(true);
    await test.mine({ blocks: 64 });
    const originalReceipt = await client.getTransactionReceipt({
      hash: pending!.transaction_hash as Hex,
    });
    assert.equal(originalReceipt.status, 'success');
    const previousNonce = await client.getTransactionCount({
      address: signer.address,
    });
    assert.equal(await freshOutbox().run(String(pending!.job_id)), 'CONFIRMED');
    assert.equal(await freshOutbox().run(String(pending!.job_id)), 'CONFIRMED');
    assert.equal(
      await client.getTransactionCount({ address: signer.address }),
      previousNonce,
      'Restart retry must not allocate a second nonce',
    );
    const [persisted] =
      await db`select signed_transaction,transaction_hash,nonce from app_private.worker_outbox where job_id=${pending!.job_id}`;
    assert.equal(persisted!.signed_transaction, pending!.signed_transaction);
    assert.equal(persisted!.transaction_hash, pending!.transaction_hash);
    assert.equal(persisted!.nonce, pending!.nonce);
    await complete(report, p);
    const snapshot = await client.readContract({
      address: adapter,
      abi: abi.XStocksAdapter,
      functionName: 'readSnapshot',
      args: [token],
    });
    const hash = keccak256(
      encodeAbiParameters(
        abi.XStocksAdapter.find(
          (x) => x.type === 'function' && x.name === 'readSnapshot',
        )!.outputs,
        [snapshot],
      ),
    );
    hashes.push(hash);
    assert.equal((await head(id)).acknowledgedSnapshotHash, hash);
    const logs = await client.getContractEvents({
      address: registry,
      abi: abi.CorporateActionRegistry,
      eventName: 'AssetSnapshotAcknowledged',
      args: { assetId: id },
      fromBlock: BigInt(m.deploymentBlock),
      toBlock: 'latest',
      strict: true,
    });
    assert.equal(
      logs.length,
      i + 1,
      'Exactly one ACK per transition under concurrent retries',
    );
    const countBefore = (
      await db`select count(*)::int as n from app_private.worker_outbox`
    )[0]!.n;
    await complete(report, p);
    assert.equal(
      (await db`select count(*)::int as n from app_private.worker_outbox`)[0]!
        .n,
      countBefore,
      'Complete report replay must not enqueue another job',
    );
  }
  assert.equal(hashes[0], hashes[2]);
  assert.equal(hashes[0], hashes[4]);
  assert.equal(hashes[1], hashes[3]);
  const [unfinished] =
    await db`select count(*)::int as n from app_private.worker_outbox where status!='CONFIRMED'`;
  assert.equal(unfinished!.n, 0);
  results.push(
    'A/B/A/B/A: same and changed evidence, reused old source, concurrent retries, lost broadcast response, restart, identical signed bytes/nonce, exactly one ACK per transition',
  );
  const incidentAsset = m.assets[2]!.assetId as Hex;
  const incidentOutbox = freshOutbox();
  const raceJob = await incidentOutbox.enqueue('broadcast-race', {
    kind: 'QUARANTINE',
    assetId: incidentAsset,
    state: 1,
    evidenceHash: evidence,
  });
  // Controlled interleaving: simulate another worker broadcasting AFTER both
  // not-found queries, but BEFORE this worker observes the consumed nonce.
  const realCount = client.getTransactionCount.bind(client);
  let injected = false;
  client.getTransactionCount = async (args) => {
    if (
      !injected &&
      args.blockTag === 'latest' &&
      args.address.toLowerCase() === signer.address.toLowerCase()
    ) {
      injected = true;
      const [row] =
        await db`select signed_transaction from app_private.worker_outbox where job_id=${raceJob}`;
      await client.sendRawTransaction({
        serializedTransaction: row!.signed_transaction as Hex,
      });
    }
    return realCount(args);
  };
  try {
    assert.equal(await incidentOutbox.run(raceJob), 'PENDING');
  } finally {
    client.getTransactionCount = realCount;
  }
  assert.equal(injected, true);
  assert.equal(
    (
      await db`select status from app_private.worker_outbox where job_id=${raceJob}`
    )[0]!.status,
    'PENDING',
  );
  await test.mine({ blocks: 64 });
  assert.equal(await freshOutbox().run(raceJob), 'CONFIRMED');
  // An actually unknown same-nonce transaction must still hold, not mint a retry nonce.
  const replacementJob = await incidentOutbox.enqueue('unknown-replacement', {
    kind: 'QUARANTINE',
    assetId: incidentAsset,
    state: 2,
    evidenceHash: evidence,
  });
  const realSend = client.sendRawTransaction.bind(client);
  client.sendRawTransaction = async () => {
    throw Error('Injected transport loss before broadcast');
  };
  try {
    assert.equal(await incidentOutbox.run(replacementJob), 'PENDING');
  } finally {
    client.sendRawTransaction = realSend;
  }
  const [replacement] =
    await db`select nonce,transaction_hash from app_private.worker_outbox where job_id=${replacementJob}`;
  await receipt(
    await signerWallet.sendTransaction({
      to: signer.address,
      value: 0n,
      nonce: Number(replacement!.nonce),
    }),
    'controlled unknown nonce replacement',
  );
  await test.mine({ blocks: 64 });
  assert.equal(await freshOutbox().run(replacementJob), 'HELD');
  assert.equal(await freshOutbox().run(replacementJob), 'HELD');
  const [held] =
    await db`select reason_code,transaction_hash,nonce from app_private.worker_outbox where job_id=${replacementJob}`;
  assert.equal(held!.reason_code, 'NONCE_UNRESOLVED');
  assert.equal(held!.transaction_hash, replacement!.transaction_hash);
  assert.equal(held!.nonce, replacement!.nonce);
  results.push(
    'Controlled broadcast/nonce race recovers; actual unknown same-nonce replacement stays HELD without fresh signing; history RPC failure enqueues nothing; bounded backwards history search passes',
  );
  await mkdir('.local/worker-regression-evidence', { recursive: true });
  await writeFile(
    '.local/worker-regression-evidence/result.json',
    JSON.stringify(
      {
        sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
          encoding: 'utf8',
        }).trim(),
        sourceDirty:
          execFileSync('git', ['status', '--porcelain'], {
            encoding: 'utf8',
          }).trim().length > 0,
        environment:
          'isolated Anvil and temporary PostgreSQL; not Sepolia/auth proof',
        results,
        receipts,
      },
      null,
      2,
    ),
  );
  console.log('PASS isolated worker regression:', results.join('; '));
} finally {
  await db.end();
  if (created) await control.unsafe(`drop database "${dbName}" with (force)`);
  await control.end();
  child.kill('SIGTERM');
}
