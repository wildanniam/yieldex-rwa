import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  createPublicClient,
  createWalletClient,
  createTestClient,
  http,
  keccak256,
  toHex,
  encodeAbiParameters,
  type Hex,
  type Address,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';
import { implementationAbis as abi } from '@rwa/shared/abi';
import { validateDeploymentManifest } from '@rwa/shared/config';
import { ChainReader } from '@rwa/shared/chain';
import { createDatabase } from '../../apps/worker/src/database.js';
import { RegistryOutbox } from '../../apps/worker/src/finalizer/outbox.js';
const rpc = 'http://127.0.0.1:8545',
  client = createPublicClient({
    pollingInterval: 50,
    chain: foundry,
    transport: http(rpc),
  });
assert.equal(await client.getChainId(), 31337);
const test = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http(rpc),
  }),
  base = createWalletClient({ chain: foundry, transport: http(rpc) }),
  [admin] = await base.getAddresses();
const m = validateDeploymentManifest(
    JSON.parse(await readFile('.local/deployment.json', 'utf8')),
    31337,
  ),
  reader = new ChainReader(client, m),
  db = createDatabase(
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  );
const account = privateKeyToAccount(generatePrivateKey()),
  wallet = createWalletClient({
    account,
    chain: foundry,
    transport: http(rpc),
  }),
  worker = new RegistryOutbox(db, reader, wallet),
  asset = m.assets[2]!,
  id = asset.assetId as Hex,
  registry = m.registry as Address,
  token = asset.token as Address,
  evidence = keccak256(toHex('SYNTHETIC outbox integration'));
try {
  await test.setBalance({ address: account.address, value: 10n ** 20n });
  let hash = await base.writeContract({
    account: admin!,
    address: registry,
    abi: abi.CorporateActionRegistry,
    functionName: 'grantRole',
    args: [keccak256(toHex('EVENT_FINALIZER_ROLE')), account.address],
  });
  await client.waitForTransactionReceipt({ hash });
  await worker.verify();
  const effective = (await client.getBlock()).timestamp + 30n;
  hash = await base.writeContract({
    account: admin!,
    address: token,
    abi: abi.DemoShareToken,
    functionName: 'schedule',
    args: [102n * 10n ** 16n, 1n, effective],
  });
  await client.waitForTransactionReceipt({ hash });
  await test.setNextBlockTimestamp({ timestamp: effective });
  await test.mine({ blocks: 1 });
  const occurrence = keccak256(toHex(randomUUID())),
    eventId = keccak256(
      encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'address' }, { type: 'bytes32' }],
        [31337n, token, occurrence],
      ),
    );
  const event = {
    eventId,
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
  } as const;
  const key = randomUUID(),
    job = await worker.enqueue(key, {
      kind: 'APPEND',
      assetId: id,
      events: [event],
    });
  assert.equal(
    await worker.enqueue(key, { kind: 'APPEND', assetId: id, events: [event] }),
    job,
  );
  await assert.rejects(
    () =>
      worker.enqueue(key, {
        kind: 'APPEND',
        assetId: id,
        events: [{ ...event, sourceRevision: 2 }],
      }),
    /IDEMPOTENCY/,
  );
  await assert.rejects(() => worker.run(job), /CHAIN_FINALIZED/);
  await test.mine({ blocks: 64 });
  // Controlled fault: network loses response AFTER real Anvil broadcast succeeds.
  const realSend = client.sendRawTransaction.bind(client);
  client.sendRawTransaction = async (args) => {
    await realSend(args);
    throw new Error('Injected response loss');
  };
  assert.equal(await worker.run(job), 'PENDING');
  client.sendRawTransaction = realSend;
  const [pending] =
    await db`select transaction_hash,nonce,signed_transaction,retry_count from app_private.worker_outbox where job_id=${job}`;
  assert.ok(pending?.transaction_hash);
  assert.ok(pending?.signed_transaction);
  assert.equal(Number(pending!.retry_count), 1);
  const before = await client.getTransactionCount({ address: account.address });
  await test.mine({ blocks: 64 });
  const restarted = new RegistryOutbox(db, new ChainReader(client, m), wallet);
  assert.equal(await restarted.run(job), 'CONFIRMED');
  assert.equal(await restarted.run(job), 'CONFIRMED');
  assert.equal(
    await client.getTransactionCount({ address: account.address }),
    before,
  );
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
  const snapshot = await client.readContract({
    address: asset.adapter as Address,
    abi: abi.XStocksAdapter,
    functionName: 'readSnapshot',
    args: [token],
  });
  const ack = await worker.enqueue(randomUUID(), {
    kind: 'ACKNOWLEDGE',
    assetId: id,
    snapshot,
    evidenceHash: evidence,
  });
  assert.equal(await worker.run(ack), 'PENDING');
  await test.mine({ blocks: 64 });
  assert.equal(await worker.run(ack), 'CONFIRMED');
  const source = await client.getBlock({ blockTag: 'finalized' }),
    coverage = {
      finalizedThrough: source.timestamp,
      sourceBlockTimestamp: source.timestamp,
      sourceBlockNumber: source.number,
      sourceBlockHash: source.hash!,
      evidenceHash: evidence,
    };
  const cover = await worker.enqueue(randomUUID(), {
    kind: 'COVERAGE',
    assetId: id,
    coverage,
  });
  assert.equal(await worker.run(cover), 'PENDING');
  await test.mine({ blocks: 64 });
  assert.equal(await worker.run(cover), 'CONFIRMED');
  const jobs = await Promise.all(
    m.assets.slice(0, 2).map((a) =>
      worker.enqueue(randomUUID(), {
        kind: 'QUARANTINE',
        assetId: a.assetId as Hex,
        state: 1,
        evidenceHash: evidence,
      }),
    ),
  );
  await Promise.all(jobs.map((j) => worker.run(j)));
  await test.mine({ blocks: 64 });
  for (const j of jobs) assert.equal(await worker.run(j), 'CONFIRMED');
  const rows =
    await db`select nonce from app_private.worker_outbox where job_id in ${db(jobs)}`;
  assert.equal(new Set(rows.map((x) => String(x.nonce))).size, 2);
  const conflicting = await worker.enqueue(randomUUID(), {
    kind: 'CONFLICT',
    assetId: id,
    evidenceHash: evidence,
  });
  await worker.run(conflicting);
  await test.mine({ blocks: 64 });
  assert.equal(await worker.run(conflicting), 'CONFIRMED');
  assert.equal(
    await client.readContract({
      address: registry,
      abi: abi.CorporateActionRegistry,
      functionName: 'finalityConflict',
      args: [id],
    }),
    true,
  );
  const badWallet = createWalletClient({
    account: privateKeyToAccount(generatePrivateKey()),
    chain: foundry,
    transport: http(rpc),
  });
  await assert.rejects(
    () => new RegistryOutbox(db, reader, badWallet).verify(),
    /role/,
  );
  console.log(
    'PASS durable local finalizer outbox: restricted role/commands, unfinalized event denied, real broadcast response-loss recovery, identical job no second nonce/event, finalized ack/coverage, concurrent cross-asset unique nonces, immutable conflict latch. No private key stored or printed.',
  );
} finally {
  await db.end();
}
