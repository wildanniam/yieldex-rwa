import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  createPublicClient,
  createWalletClient,
  createTestClient,
  http,
  encodeAbiParameters,
  keccak256,
  toHex,
  type Address,
  type Hex,
  type Abi,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';
import { implementationAbis as abi } from '@rwa/shared/abi';
import { validateDeploymentManifest } from '@rwa/shared/config';
import { ChainReader, entityKey } from '@rwa/shared/chain';
import { prepareTransaction } from '@rwa/shared/transactions';
import { validateData } from '@rwa/shared/validation';
import type {
  PrepareIntentRequest,
  PreparedIntent,
  Session,
} from '@rwa/shared';
import { createDatabase } from '../../apps/worker/src/database.js';
import { Web3Sessions } from '../../apps/web/src/server/auth/service.js';
import { TransactionIntents } from '../../apps/web/src/server/transactions/service.js';
import { transactionStatus } from '../../apps/web/src/server/transactions/status.js';
const rpc = 'http://127.0.0.1:8545',
  client = createPublicClient({
    chain: foundry,
    transport: http(rpc),
    pollingInterval: 50,
  });
assert.equal(await client.getChainId(), 31337);
const test = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http(rpc),
  }),
  base = createWalletClient({ chain: foundry, transport: http(rpc) }),
  [admin, finalizer] = await base.getAddresses();
const m = validateDeploymentManifest(
    JSON.parse(await readFile('.local/deployment.json', 'utf8')),
    31337,
  ),
  reader = new ChainReader(client, m),
  asset = m.assets[1]!,
  assetKey = entityKey(31337, m.registry, asset.assetId),
  market = m.market as Address,
  token = asset.token as Address,
  id = asset.assetId as Hex;
const db = createDatabase(
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  ),
  intents = new TransactionIntents(db, reader);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (url !== 'http://127.0.0.1:54321' || !key)
  throw new Error('Local auth env required');
const sessions = new Web3Sessions(db, {
  url,
  key,
  origin: 'http://localhost:3000',
  chainId: 31337,
});
const alice = privateKeyToAccount(generatePrivateKey()),
  bob = privateKeyToAccount(generatePrivateKey()),
  carol = privateKeyToAccount(generatePrivateKey());
async function login(a: typeof alice) {
  const c = await sessions.challenge(a.address),
    s = await sessions.exchange(
      c.challengeId,
      await a.signMessage({ message: c.message }),
      c.challengeId,
    );
  return sessions.verify(s.access_token);
}
async function tx(
  account: Address,
  address: Address,
  contractAbi: Abi,
  functionName: string,
  args: readonly unknown[],
) {
  const simulation = await client.simulateContract({
    account,
    address,
    abi: contractAbi,
    functionName,
    args,
  });
  const h = await base.writeContract(simulation.request);
  const r = await client.waitForTransactionReceipt({ hash: h });
  assert.equal(r.status, 'success');
  return r;
}
const now = async () => Number((await client.getBlock()).timestamp);
async function prepare(s: Session, request: PrepareIntentRequest) {
  return (await intents.prepare(s, randomUUID(), request)).intent;
}
let actionCount = 0;
async function execute(a: typeof alice, s: Session, p: PreparedIntent) {
  assert.ok(
    ['READY', 'NEEDS_APPROVAL'].includes(p.state),
    JSON.stringify(p.blockers),
  );
  assert.ok(validateData('api.PreparedIntent', p).success);
  const step = p.steps[0]!;
  const w = createWalletClient({
      account: a,
      chain: foundry,
      transport: http(rpc),
    }),
    hash = await w.sendTransaction({
      to: step.to as Address,
      data: step.data as Hex,
      value: 0n,
    });
  const r = await client.waitForTransactionReceipt({ hash });
  assert.equal(r.status, 'success');
  const result = await intents.submit(s, p.intentId, randomUUID(), {
    chainId: 31337,
    transactionHash: hash,
    stepId: step.stepId,
  });
  assert.ok(result.verified);
  assert.equal(result.status.status, 'CONFIRMED');
  assert.ok(validateData('api.TransactionStatus', result.status).success);
  assert.equal((await intents.get(s, p.intentId)).state, 'SUBMITTED');
  actionCount++;
  return { hash, status: result.status };
}
try {
  const a = await login(alice),
    b = await login(bob),
    c = await login(carol);
  for (const who of [alice, bob, carol]) {
    await test.setBalance({ address: who.address, value: 10n ** 20n });
    await tx(admin!, m.paymentToken.address as Address, abi.DemoUSD, 'mint', [
      who.address,
      1000n * 10n ** 6n,
    ]);
  }
  await tx(admin!, token, abi.DemoShareToken, 'mint', [
    alice.address,
    1000n * 10n ** 18n,
  ]);
  const create: PrepareIntentRequest = {
    action: 'CREATE_PRIMARY_LISTING',
    assetKey,
    depositTokenAmountAtomic: (100n * 10n ** 18n).toString(),
    minReceivedShares: '1',
    incomeBps: 5000,
    durationSeconds: 600,
    priceAtomic: '90000000',
    listingExpiresAt: (await now()) + 300,
  };
  const ik = randomUUID(),
    race = await Promise.all([
      intents.prepare(a, ik, create),
      intents.prepare(a, ik, create),
    ]);
  assert.equal(race.filter((x) => x.created).length, 1);
  assert.equal(race[0]!.intent.intentId, race[1]!.intent.intentId);
  const first = race[0]!.intent;
  assert.equal(first.state, 'NEEDS_APPROVAL');
  assert.equal(
    first.steps[0]!.allowanceAmountAtomic,
    create.depositTokenAmountAtomic,
  );
  assert.equal(first.steps[0]!.to, token);
  assert.equal(first.steps[0]!.allowanceSpender, market);
  await assert.rejects(
    () => intents.prepare(a, ik, { ...create, priceAtomic: '1' }),
    /Key/,
  );
  await assert.rejects(() => intents.get(b, first.intentId), /tidak ditemukan/);
  await assert.rejects(
    () => intents.prepare({ ...a, authChainId: 1 }, randomUUID(), create),
    /Chain/,
  );
  await assert.rejects(
    () => intents.prepare(a, randomUUID(), { ...create, to: market }),
    /tidak valid/,
  );
  await execute(alice, a, first);
  assert.equal((await prepare(a, create)).state, 'READY');
  const made = await execute(alice, a, await prepare(a, create));
  const positionKey = made.status.positionKey!,
    listingKey = made.status.listingKey!;
  assert.ok(positionKey && listingKey);
  const buy: PrepareIntentRequest = { action: 'BUY_LISTING', listingKey };
  assert.equal((await prepare(a, buy)).state, 'BLOCKED');
  let p = await prepare(b, buy);
  assert.equal(p.state, 'NEEDS_APPROVAL');
  assert.equal(p.purchaseSummary!.listing.priceAtomic, '90000000');
  assert.equal(p.expectedTermsHash, p.purchaseSummary!.listing.termsHash);
  await execute(bob, b, p);
  p = await prepare(b, buy);
  assert.equal(p.state, 'READY');
  const pendingKey = randomUUID(),
    unknown = '0x' + '1'.repeat(64);
  assert.equal(
    (
      await intents.submit(b, p.intentId, pendingKey, {
        chainId: 31337,
        transactionHash: unknown,
        stepId: p.steps[0]!.stepId,
      })
    ).verified,
    false,
  );
  await assert.rejects(
    () =>
      intents.submit(b, p.intentId, pendingKey, {
        chainId: 31337,
        transactionHash: made.hash,
        stepId: p.steps[0]!.stepId,
      }),
    /Key/,
  );
  await assert.rejects(
    () =>
      intents.submit(b, p.intentId, randomUUID(), {
        chainId: 31337,
        transactionHash: made.hash,
        stepId: p.steps[0]!.stepId,
      }),
    /tidak cocok/,
  );
  await execute(bob, b, p);
  assert.equal((await prepare(c, buy)).state, 'BLOCKED'); // Latest overrides stale finalized discovery.
  const pos = await reader.position(
    BigInt(positionKey.split(':').at(-1)!),
    await reader.snapshot('latest'),
  );
  // Deliberate simulated issuer dividend, independent of any HTTP issuer claim.
  const head = await client.readContract({
      address: m.registry as Address,
      abi: abi.CorporateActionRegistry,
      functionName: 'getAssetHead',
      args: [id],
    }),
    seq = head.eventCount + 1n,
    effective = BigInt((await now()) + 3),
    after = (head.multiplier * 102n) / 100n,
    evidence = keccak256(toHex('SYNTHETIC intent integration'));
  await tx(admin!, token, abi.DemoShareToken, 'schedule', [
    after,
    head.issuerNonce + 1n,
    effective,
  ]);
  await test.setNextBlockTimestamp({ timestamp: effective });
  await test.mine({ blocks: 1 });
  const occurrence = keccak256(toHex(randomUUID())),
    eventId = keccak256(
      encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'address' }, { type: 'bytes32' }],
        [31337n, token, occurrence],
      ),
    );
  await tx(
    finalizer!,
    m.registry as Address,
    abi.CorporateActionRegistry,
    'appendFinalizedEvents',
    [
      id,
      [
        {
          eventId,
          sequence: seq,
          kind: 0,
          effectiveAt: effective,
          multiplierBefore: head.multiplier,
          multiplierAfter: after,
          issuerNonceAfter: head.issuerNonce + 1n,
          historyIndex: head.consumedHistoryIndex + 1n,
          sourceRevision: 1,
          sourceOccurrenceKey: occurrence,
          evidenceHash: evidence,
        },
      ],
    ],
  );
  const snapshot = await client.readContract({
    address: asset.adapter as Address,
    abi: abi.XStocksAdapter,
    functionName: 'readSnapshot',
    args: [token],
  });
  await tx(
    finalizer!,
    m.registry as Address,
    abi.CorporateActionRegistry,
    'acknowledgeAssetSnapshot',
    [id, snapshot, evidence],
  );
  p = await prepare(c, {
    action: 'CHECKPOINT_POSITION',
    positionKey,
    maxEvents: 32,
  });
  assert.equal(p.pendingEventCount, '1');
  await execute(carol, c, p);
  const claim = await reader.claim(
    id,
    bob.address,
    await reader.snapshot('latest'),
  );
  assert.ok(BigInt(claim.claimShares) > 0n);
  await execute(
    bob,
    b,
    await prepare(b, {
      action: 'CLAIM_INCOME',
      assetKey,
      shares: claim.claimShares,
    }),
  );
  assert.equal(
    (
      await prepare(b, {
        action: 'CLAIM_INCOME',
        assetKey,
        shares: claim.claimShares,
      })
    ).state,
    'BLOCKED',
  );
  const resale = await execute(
    bob,
    b,
    await prepare(b, {
      action: 'CREATE_SECONDARY_LISTING',
      positionKey,
      priceAtomic: '50000000',
      listingExpiresAt: pos.endAt! - 10,
    }),
  );
  const secondary: PrepareIntentRequest = {
    action: 'BUY_LISTING',
    listingKey: resale.status.listingKey!,
  };
  await execute(carol, c, await prepare(c, secondary));
  await execute(carol, c, await prepare(c, secondary));
  assert.equal(
    (
      await reader.position(
        BigInt(pos.positionId),
        await reader.snapshot('latest'),
      )
    ).endAt,
    pos.endAt,
  );
  await test.setNextBlockTimestamp({ timestamp: BigInt(pos.endAt! + 1) });
  await test.mine({ blocks: 1 });
  assert.equal(
    (
      await prepare(a, {
        action: 'SETTLE_POSITION',
        positionKey,
        maxEvents: 32,
      })
    ).state,
    'BLOCKED',
  );
  async function cover() {
    const block = await client.getBlock();
    await test.setNextBlockTimestamp({ timestamp: block.timestamp + 1n });
    await test.mine({ blocks: 1 });
    await tx(
      finalizer!,
      m.registry as Address,
      abi.CorporateActionRegistry,
      'advanceFinalityCoverage',
      [
        id,
        {
          finalizedThrough: block.timestamp,
          sourceBlockTimestamp: block.timestamp,
          sourceBlockNumber: block.number,
          sourceBlockHash: block.hash,
          evidenceHash: evidence,
        },
      ],
    );
  }
  await cover();
  await execute(
    carol,
    c,
    await prepare(c, { action: 'SETTLE_POSITION', positionKey, maxEvents: 32 }),
  );
  await execute(
    alice,
    a,
    await prepare(a, {
      action: 'RELEASE_PRINCIPAL',
      positionKey,
      maxEvents: 32,
    }),
  );
  // Separate unsold listing exercises expiry/relist/cancel without resetting a live lease.
  const fresh = { ...create, listingExpiresAt: (await now()) + 62 };
  p = await prepare(a, fresh);
  if (p.state === 'NEEDS_APPROVAL') await execute(alice, a, p);
  const unsold = await execute(alice, a, await prepare(a, fresh)),
    unsoldPosition = unsold.status.positionKey!;
  const expiredIntent = await prepare(a, {
    action: 'CANCEL_LISTING',
    listingKey: unsold.status.listingKey!,
  });
  // Anvil's deterministic block interval overrides increaseTime on the next block.
  await test.setNextBlockTimestamp({
    timestamp: BigInt(expiredIntent.expiresAt),
  });
  await test.mine({ blocks: 1 });
  assert.ok(
    (await client.getBlock()).timestamp >= BigInt(expiredIntent.expiresAt),
  );
  assert.equal((await intents.get(a, expiredIntent.intentId)).state, 'EXPIRED');
  assert.equal((await intents.get(a, expiredIntent.intentId)).steps.length, 0);
  const relisted = await execute(
    alice,
    a,
    await prepare(a, {
      action: 'RELIST_PRIMARY_POSITION',
      positionKey: unsoldPosition,
      priceAtomic: '12000000',
      listingExpiresAt: (await now()) + 300,
    }),
  );
  await execute(
    alice,
    a,
    await prepare(a, {
      action: 'CANCEL_LISTING',
      listingKey: relisted.status.listingKey!,
    }),
  );
  await cover();
  await execute(
    alice,
    a,
    await prepare(a, {
      action: 'RELEASE_PRINCIPAL',
      positionKey: unsoldPosition,
      maxEvents: 32,
    }),
  );
  // API must hold preparation while canonical index conflict is unresolved.
  await db`update public.chain_cursors set state='REBUILDING' where chain_id=31337 and contract_address=${m.market}`;
  await assert.rejects(
    () => intents.prepare(a, randomUUID(), create),
    /riwayat/,
  );
  await db`update public.chain_cursors set state='READY' where chain_id=31337 and contract_address=${m.market}`;
  const wrong = await prepareTransaction(
    reader,
    { action: 'BUY_LISTING', listingKey: entityKey(1, m.market, '1') },
    bob.address,
    { intentId: randomUUID(), stepId: randomUUID() },
  );
  assert.equal(wrong.state, 'BLOCKED');
  assert.deepEqual(wrong.steps, []);
  await test.mine({ blocks: 64 });
  assert.equal(
    (await transactionStatus(reader, made.hash)).status,
    'FINALIZED',
  );
  console.log(
    `PASS real RPC + PostgreSQL + Supabase intent lifecycle: all 9 actions, ${actionCount} verified successful steps; exact approvals, schema/calldata/account binding, concurrent idempotency, cross-user/chain rejection, unknown/mismatched submission, stale listing, claim retry, expiry, safety coverage hold, snapshot/receipt keys and finalized status.`,
  );
} finally {
  await db.end();
}
