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
import { TransactionIntents } from '../../apps/web/src/server/transactions/service.js';
import { ApiFailure } from '../../apps/web/src/server/http.js';
import type { Session } from '@rwa/shared';
import { RegistryOutbox } from '../../apps/worker/src/finalizer/outbox.js';
import {
  ReviewedReconciler,
  type ReviewedReport,
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
const dbName = 'rwa_edges_' + randomUUID().replaceAll('-', '');
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
    '202610080004_intent_submissions.sql',
  ])
    await db.unsafe(await readFile('supabase/migrations/' + name, 'utf8'));
  // Upgrade a populated schema, including legacy intent and every old job status.
  const legacyUser = randomUUID(),
    legacyIntent = randomUUID();
  const fixtureAddress = '0x' + '11'.repeat(20);
  await db`insert into auth.users(id) values(${legacyUser})`;
  await db`insert into public.transaction_intents(id,user_id,idempotency_key,wallet,action,request_hash,preview,expires_at,transaction_hash) values(${legacyIntent},${legacyUser},${randomUUID()},${fixtureAddress},'CREATE_PRIMARY_LISTING',${evidence},'{}',now(),${evidence})`;
  for (const status of ['READY', 'SUBMITTING', 'PENDING', 'CONFIRMED', 'HELD'])
    await db`insert into app_private.worker_outbox(idempotency_key,command_hash,chain_id,token,status,payload) values(${'upgrade:' + status},${evidence},31337,${fixtureAddress},${status},'{}')`;
  const beforeJobs =
    await db`select * from app_private.worker_outbox order by idempotency_key`;
  const beforeIntent = (
    await db`select * from public.transaction_intents where id=${legacyIntent}`
  )[0]!;
  const securitySnapshot = () =>
    db`select c.oid::regclass::text as name,c.relrowsecurity,c.relacl::text from pg_class c where c.oid in('public.transaction_intents'::regclass,'app_private.worker_outbox'::regclass) order by c.oid`;
  const beforeSecurity = await securitySnapshot();
  await db.unsafe(
    await readFile(
      'supabase/migrations/202610080007_recovery_identity.sql',
      'utf8',
    ),
  );
  assert.deepEqual(
    await db`select * from app_private.worker_outbox order by idempotency_key`,
    beforeJobs,
  );
  assert.deepEqual(
    (
      await db`select * from public.transaction_intents where id=${legacyIntent}`
    )[0],
    { ...beforeIntent, transaction_nonce: null },
  );
  assert.deepEqual(await securitySnapshot(), beforeSecurity);
  await assert.rejects(
    () =>
      db`update public.transaction_intents set transaction_nonce=-1 where id=${legacyIntent}`,
  );
  await db`delete from app_private.worker_outbox where idempotency_key like 'upgrade:%'`;
  await db`delete from auth.users where id=${legacyUser}`;
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
  const results: string[] = [
    'Migration 007: populated upgrade preserves all old statuses, legacy intent, RLS flags and grants; nullable nonce rejects negative values',
  ];
  if (process.argv[2] !== 'intents') {
    const a = m.assets[0]!,
      id = a.assetId as Hex,
      token = a.token as Address;
    const fresh = () =>
      new RegistryOutbox(
        db,
        new ChainReader(client, m),
        createWalletClient({
          account: signer,
          chain: foundry,
          transport: http(rpc),
        }),
      );
    const policy = {
      assetId: id,
      tokenRuntimeCodeHash: keccak256(
        (await client.getCode({ address: token }))!,
      ),
      implementationAddress: null,
    };
    const step = (report: ReviewedReport) =>
      new ReviewedReconciler(new ChainReader(client, m), fresh(), policy).step(
        report,
      );
    const at = (await client.getBlock()).timestamp + 10000n;
    async function schedule(n: bigint) {
      await write(token, 'DemoShareToken', 'schedule', [
        n * 10n ** 16n,
        1n,
        at,
      ]);
    }
    async function report(label: string): Promise<ReviewedReport> {
      const b = await client.getBlock();
      await test.mine({ blocks: 64 });
      return {
        assetId: id,
        sourceKind: 'SIMULATOR',
        evidenceHash: keccak256(toHex(label)),
        sourceBlockNumber: b.number,
        sourceBlockHash: b.hash!,
        sourceBlockTimestamp: b.timestamp,
        reviewedThrough: b.timestamp,
        events: [],
      };
    }
    async function complete(r: ReviewedReport) {
      for (let i = 0; i < 8; i++) {
        const status = await step(r);
        if (status === 'COMPLETE') return;
        assert.equal(status, 'PENDING');
        await test.mine({ blocks: 64 });
      }
      assert.fail('Reconciliation stuck');
    }
    async function failBeforeSigning(r: ReviewedReport) {
      const call = client.call.bind(client);
      client.call = async () => {
        throw Error('Injected pre-sign RPC failure');
      };
      try {
        await assert.rejects(() => step(r), /Injected pre-sign/);
      } finally {
        client.call = call;
      }
      const [row] =
        await db`select * from app_private.worker_outbox where status='READY' and payload->>'assetId'=${id}`;
      assert.ok(row);
      assert.equal(row.signed_transaction, null);
      assert.equal(row.nonce, null);
      return row;
    }
    await schedule(102n);
    const reportA = await report('A');
    const old = await failBeforeSigning(reportA);
    await schedule(103n);
    // A is still finalized, B is only latest. Do not retire just because simulation fails.
    await assert.rejects(() => fresh().run(old.job_id));
    assert.equal(
      (
        await db`select status from app_private.worker_outbox where job_id=${old.job_id}`
      )[0]!.status,
      'READY',
    );
    const reportB = await report('B');
    const read = client.readContract.bind(client);
    client.readContract = async (args) => {
      if (args.functionName === 'readSnapshot')
        throw Error('Injected snapshot RPC failure');
      return read(args);
    };
    try {
      await assert.rejects(() => fresh().run(old.job_id), /Injected snapshot/);
    } finally {
      client.readContract = read;
    }
    assert.equal(
      (
        await db`select status from app_private.worker_outbox where job_id=${old.job_id}`
      )[0]!.status,
      'READY',
    );
    await complete(reportB);
    const [retired] =
      await db`select * from app_private.worker_outbox where job_id=${old.job_id}`;
    assert.equal(retired!.status, 'SUPERSEDED');
    assert.equal(retired!.nonce, null);
    assert.equal(retired!.transaction_hash, null);
    assert.equal(retired!.signed_transaction, null);
    assert.equal(retired!.command_hash, old.command_hash);
    assert.deepEqual(retired!.payload, old.payload);
    assert.equal(await fresh().run(old.job_id), 'SUPERSEDED');
    // Retire C, let it recur before any ACK of D: same anchor/key, new reviewed evidence.
    await schedule(104n);
    const reportC = await report('C');
    const oldC = await failBeforeSigning(reportC);
    await schedule(105n);
    await report('D');
    assert.equal(await fresh().run(oldC.job_id), 'SUPERSEDED');
    await schedule(104n);
    const again = await report('C-again');
    await Promise.all([step(again), step(again)]);
    await test.mine({ blocks: 64 });
    await complete(again);
    const sameKey =
      await db`select job_id,status,command_hash from app_private.worker_outbox where idempotency_key=${oldC.idempotency_key}`;
    assert.equal(sameKey.length, 2);
    assert.equal(sameKey.filter((x) => x.status === 'SUPERSEDED').length, 1);
    assert.equal(sameKey.filter((x) => x.status === 'CONFIRMED').length, 1);
    assert.equal(
      sameKey.find((x) => x.job_id === oldC.job_id)!.command_hash,
      oldC.command_hash,
    );
    const ackLogs = await client.getContractEvents({
      address: registry,
      abi: abi.CorporateActionRegistry,
      eventName: 'AssetSnapshotAcknowledged',
      args: { assetId: id },
      fromBlock: BigInt(m.deploymentBlock),
      toBlock: 'latest',
      strict: true,
    });
    assert.equal(ackLogs.length, 2);
    // Once signed, preserve exact bytes even when schedule changes; never supersede it.
    await schedule(106n);
    const signedReport = await report('signed');
    const send = client.sendRawTransaction.bind(client);
    client.sendRawTransaction = async () => {
      throw Error('Injected uncertain broadcast');
    };
    try {
      assert.equal(await step(signedReport), 'PENDING');
    } finally {
      client.sendRawTransaction = send;
    }
    const [signed] =
      await db`select * from app_private.worker_outbox where status='PENDING' and payload->>'assetId'=${id}`;
    assert.ok(signed!.signed_transaction);
    await assert.rejects(
      () =>
        db`update app_private.worker_outbox set status='SUPERSEDED' where job_id=${signed!.job_id}`,
      (e: unknown) => (e as { code: string }).code === '23514',
    );
    await schedule(107n);
    await report('signed-now-stale');
    await fresh().run(signed!.job_id);
    await test.mine({ blocks: 64 });
    assert.equal(await fresh().run(signed!.job_id), 'HELD');
    const [held] =
      await db`select * from app_private.worker_outbox where job_id=${signed!.job_id}`;
    assert.equal(held!.signed_transaction, signed!.signed_transaction);
    assert.equal(held!.nonce, signed!.nonce);
    assert.equal(held!.transaction_hash, signed!.transaction_hash);
    assert.equal(await fresh().drain(id), 'HELD');
    results.push(
      'Unsigned ACK: pre-sign failure → override → SUPERSEDED history → new ACK; unfinalized/RPC error preserved; recurring key/concurrency deduplicated; signed/reverted HELD job never discarded',
    );
  }
  if (process.argv[2] !== 'worker') {
    const a = m.assets[1]!,
      userId = randomUUID();
    await db`insert into auth.users(id) values(${userId})`;
    const session = {
      userId,
      walletAddress: alice.toLowerCase(),
      authChainId: 31337,
      expiresAt: Number((await client.getBlock()).timestamp) + 10000,
    } as Session;
    const service = () =>
      new TransactionIntents(db, new ChainReader(client, m));
    const request = {
      action: 'CREATE_PRIMARY_LISTING',
      assetKey: `eip155:31337:${m.registry}:${a.assetId}`,
      depositTokenAmountAtomic: (100n * 10n ** 18n).toString(),
      minReceivedShares: (100n * 10n ** 18n).toString(),
      incomeBps: 5000,
      durationSeconds: 600,
      priceAtomic: '90000000',
      listingExpiresAt: Number((await client.getBlock()).timestamp) + 300,
    } as const;
    const { intent } = await service().prepare(session, randomUUID(), request);
    assert.equal(intent.state, 'NEEDS_APPROVAL');
    const action = intent.steps[0]!;
    const submit = (hash: Hex, key = randomUUID()) =>
      service().submit(session, intent.intentId, key, {
        chainId: 31337,
        transactionHash: hash,
        stepId: action.stepId,
      });
    await test.setAutomine(false);
    const original = await wallet.sendTransaction({
      account: alice,
      to: action.to as Address,
      data: action.data as Hex,
      value: 0n,
      gas: 150000n,
      gasPrice: 2000000000n,
    });
    const tx = await client.getTransaction({ hash: original });
    const accepted = await submit(original);
    assert.equal(accepted.verified, true);
    assert.equal(accepted.status.status, 'PENDING');
    const repriced = await wallet.sendTransaction({
      account: alice,
      to: action.to as Address,
      data: action.data as Hex,
      value: 0n,
      gas: 150000n,
      gasPrice: 4000000000n,
      nonce: tx.nonce,
    });
    await test.mine({ blocks: 1 });
    await test.setAutomine(true);
    await assert.rejects(() => client.getTransaction({ hash: original }));
    const [one, two] = await Promise.all([submit(repriced), submit(repriced)]);
    assert.equal(one.verified, true);
    assert.equal(two.verified, true);
    assert.equal(one.status.status, 'CONFIRMED');
    assert.equal(one.status.transactionHash, repriced);
    const [stored] =
      await db`select transaction_nonce,transaction_hash from public.transaction_intents where id=${intent.intentId}`;
    assert.equal(stored!.transaction_hash, repriced);
    assert.equal(BigInt(stored!.transaction_nonce), BigInt(tx.nonce));
    const replayKey = randomUUID();
    await submit(repriced, replayKey);
    await submit(repriced, replayKey);
    // A new action with identical calldata but a different nonce is not a replacement.
    const unrelated = await wallet.sendTransaction({
      account: alice,
      to: action.to as Address,
      data: action.data as Hex,
      value: 0n,
      gas: 150000n,
    });
    await receipt(unrelated, 'same data different nonce');
    await assert.rejects(
      () => submit(unrelated),
      (e: unknown) =>
        e instanceof ApiFailure && e.code === 'TRANSACTION_MISMATCH',
    );
    const wrongFrom = await wallet.sendTransaction({
      account: bob,
      to: action.to as Address,
      data: action.data as Hex,
      value: 0n,
      gas: 150000n,
    });
    await receipt(wrongFrom, 'different signer');
    await assert.rejects(
      () => submit(wrongFrom),
      (e: unknown) =>
        e instanceof ApiFailure && e.code === 'TRANSACTION_MISMATCH',
    );
    const cancellation = await wallet.sendTransaction({
      account: alice,
      to: alice,
      value: 0n,
    });
    await receipt(cancellation, 'different calldata/target');
    await assert.rejects(
      () => submit(cancellation),
      (e: unknown) =>
        e instanceof ApiFailure && e.code === 'TRANSACTION_MISMATCH',
    );
    await assert.rejects(
      () =>
        service().submit(session, intent.intentId, randomUUID(), {
          chainId: 11155111,
          transactionHash: repriced,
          stepId: action.stepId,
        }),
      (e: unknown) =>
        e instanceof ApiFailure && e.code === 'UNSUPPORTED_DEPLOYMENT',
    );
    assert.deepEqual(
      (
        await db`select transaction_nonce,transaction_hash from public.transaction_intents where id=${intent.intentId}`
      )[0],
      stored,
    );
    // Legacy rows have no nonce: re-verify the stored transaction when it still exists.
    await db`update public.transaction_intents set transaction_nonce=null where id=${intent.intentId}`;
    await submit(repriced);
    assert.equal(
      BigInt(
        (
          await db`select transaction_nonce from public.transaction_intents where id=${intent.intentId}`
        )[0]!.transaction_nonce,
      ),
      BigInt(tx.nonce),
    );
    // Lost legacy original cannot be replaced without evidence, and must return a clear conflict.
    await db`update public.transaction_intents set transaction_hash=${original},transaction_nonce=null where id=${intent.intentId}`;
    await assert.rejects(
      () => submit(repriced),
      (e: unknown) =>
        e instanceof ApiFailure &&
        e.status === 409 &&
        e.code === 'ORIGINAL_TRANSACTION_UNAVAILABLE',
    );
    const [legacy] =
      await db`select transaction_hash,transaction_nonce from public.transaction_intents where id=${intent.intentId}`;
    assert.equal(legacy!.transaction_hash, original);
    assert.equal(legacy!.transaction_nonce, null);
    // Controlled RPC retention: return the genuine original captured before eviction.
    // Replacement receipt and persistence still use the real chain/database.
    const retainedClient = new Proxy(client, {
      get(target, property) {
        if (property === 'getTransaction')
          return (args: { hash: Hex }) =>
            args.hash === original
              ? Promise.resolve(tx)
              : target.getTransaction(args);
        return Reflect.get(target, property);
      },
    });
    const legacyRecovered = await new TransactionIntents(
      db,
      new ChainReader(retainedClient, m),
    ).submit(session, intent.intentId, randomUUID(), {
      chainId: 31337,
      transactionHash: repriced,
      stepId: action.stepId,
    });
    assert.equal(legacyRecovered.status.status, 'CONFIRMED');
    assert.deepEqual(
      (
        await db`select transaction_nonce,transaction_hash from public.transaction_intents where id=${intent.intentId}`
      )[0],
      stored,
    );
    results.push(
      'Intent: pending original → actual same-nonce speed-up after eviction → receipt/DB replacement; restart/concurrent/replay verified; wrong nonce/signer/action/chain rejected without row change; legacy backfill, explicit 409 and controlled RPC retention recovery',
    );
  }
  await mkdir('.local/recovery-edge-evidence', { recursive: true });
  await writeFile(
    '.local/recovery-edge-evidence/result.json',
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
          'isolated Anvil + temporary PostgreSQL; fixture session, not auth/browser/Sepolia proof',
        results,
        receipts,
      },
      null,
      2,
    ),
  );
  console.log('PASS recovery edge cases:', results.join('; '));
} finally {
  await db.end();
  if (created) await control.unsafe(`drop database "${dbName}" with (force)`);
  await control.end();
  child.kill('SIGTERM');
}
