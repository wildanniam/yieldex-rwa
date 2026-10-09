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
import { parseReviewedFile } from '../../apps/worker/src/finalizer/review-file.js';
import { RegistryOutbox } from '../../apps/worker/src/finalizer/outbox.js';
import {
  ReviewedReconciler,
  type ReviewedReport,
} from '../../apps/worker/src/finalizer/reconcile.js';
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
  [admin] = await base.getAddresses(),
  m = validateDeploymentManifest(
    JSON.parse(await readFile('.local/deployment.json', 'utf8')),
    31337,
  ),
  asset = m.assets[2]!,
  token = asset.token as Address,
  registry = m.registry as Address,
  id = asset.assetId as Hex,
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
  outbox = new RegistryOutbox(db, reader, wallet),
  policy = {
    assetId: id,
    tokenRuntimeCodeHash: keccak256(
      (await client.getCode({ address: token }))!,
    ),
    implementationAddress: null,
  },
  reconciler = new ReviewedReconciler(reader, outbox, policy);
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
  const baseline = await client.readContract({
    address: registry,
    abi: abi.CorporateActionRegistry,
    functionName: 'getAssetHead',
    args: [id],
  });
  assert.equal(
    baseline.eventCount,
    0n,
    'Use a fresh deployment for this isolated review test',
  );
  const effective = (await client.getBlock()).timestamp + 10n;
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
  const source = await client.getBlock(),
    evidence = keccak256(toHex('SYNTHETIC reviewed simulator feed')),
    report: ReviewedReport = {
      assetId: id,
      sourceKind: 'SIMULATOR',
      evidenceHash: evidence,
      sourceBlockNumber: source.number,
      sourceBlockHash: source.hash!,
      sourceBlockTimestamp: source.timestamp,
      reviewedThrough: source.timestamp,
      events: [],
    };
  assert.equal(await reconciler.step(report), 'WAITING_SOURCE');
  await test.mine({ blocks: 64 });
  assert.equal(
    await reconciler.step(report),
    'WAITING_SOURCE',
    'Missing classification cannot advance snapshot/coverage',
  );
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
  report.events = [event];
  const parsed = parseReviewedFile(
    JSON.stringify({ policy, report }, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v,
    ),
  );
  assert.deepEqual(parsed.report, report);
  let state = await reconciler.step(report);
  assert.equal(state, 'PENDING');
  assert.equal(
    await reconciler.step(report),
    'PENDING',
    'Successful receipt is not final completion',
  );
  for (let i = 0; i < 6 && state !== 'COMPLETE'; i++) {
    await test.mine({ blocks: 64 });
    state = await reconciler.step(report);
  }
  assert.equal(state, 'COMPLETE');
  const head = await client.readContract({
    address: registry,
    abi: abi.CorporateActionRegistry,
    functionName: 'getAssetHead',
    args: [id],
  });
  assert.equal(head.eventCount, 1n);
  assert.equal(head.finalizedThrough, report.reviewedThrough);
  const nonce = await client.getTransactionCount({ address: account.address });
  assert.equal(await reconciler.step(report), 'COMPLETE');
  assert.equal(
    await client.getTransactionCount({ address: account.address }),
    nonce,
  );
  const correction = {
    ...report,
    evidenceHash: keccak256(toHex('SYNTHETIC conflicting correction')),
    events: [{ ...event, kind: 1, sourceRevision: 2 }],
  };
  assert.equal(await reconciler.step(correction), 'HELD');
  await test.mine({ blocks: 64 });
  await outbox.drain(id);
  assert.equal(
    await client.readContract({
      address: registry,
      abi: abi.CorporateActionRegistry,
      functionName: 'finalityConflict',
      args: [id],
    }),
    true,
  );
  assert.equal(
    (
      await client.readContract({
        address: registry,
        abi: abi.CorporateActionRegistry,
        functionName: 'getAssetEvent',
        args: [id, 1n],
      })
    ).kind,
    0,
  );
  const badPolicy = {
    ...policy,
    tokenRuntimeCodeHash: keccak256(toHex('unexpected implementation')),
  };
  assert.equal(
    await new ReviewedReconciler(reader, outbox, badPolicy).step(report),
    'HELD',
  );
  await test.mine({ blocks: 64 });
  await outbox.drain(id);
  assert.equal(
    (
      await client.readContract({
        address: registry,
        abi: abi.CorporateActionRegistry,
        functionName: 'getAsset',
        args: [id],
      })
    ).safetyState,
    2,
  );
  console.log(
    'PASS reviewed-source reconciliation: finalized source required, missing classification held, ordered append/ack/coverage with final receipts, repeat report no mutation, immutable correction incident, runtime/implementation policy mismatch escalates transfer quarantine. Simulator feed explicitly trusted, not live issuer finality.',
  );
} finally {
  await db.end();
}
