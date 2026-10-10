import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  createPublicClient,
  createWalletClient,
  createTestClient,
  http,
  type Abi,
  type Address,
  type Hex,
} from 'viem';
import { foundry } from 'viem/chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { implementationAbis as abi } from '@rwa/shared/abi';
import { validateDeploymentManifest } from '@rwa/shared/config';
import { ChainReader } from '@rwa/shared/chain';
import { validateData } from '@rwa/shared/validation';
import type { AssistantCard, ListingsPage, Session } from '@rwa/shared';
import { createDatabase } from '../../apps/web/src/server/database.js';
import { FinalizedIndexer } from '../../apps/worker/src/indexer/index.js';
import { MarketReads } from '../../apps/web/src/server/market/reads.js';
import { Cursors } from '../../apps/web/src/server/market/cursor.js';
import { Web3Sessions } from '../../apps/web/src/server/auth/service.js';
import { History } from '../../apps/web/src/server/history/service.js';
import { HistoryCursor } from '../../apps/web/src/server/history/cursor.js';
import { TransactionIntents } from '../../apps/web/src/server/transactions/service.js';
import {
  assistantTools,
  type AssistantServices,
} from '../../apps/web/src/server/assistant/tools.js';
import { defaultSearch } from '../../apps/web/src/features/assistant/inputs.js';
import {
  AssistantState,
  type AssistantMessage,
} from '../../apps/web/src/server/assistant/state.js';

// Deliberately fixed loopback targets: no environment may redirect this test to hosted services.
const rpc = 'http://127.0.0.1:8545';
const authUrl = 'http://127.0.0.1:54331';
const dbUrl = 'postgresql://postgres:postgres@127.0.0.1:54332/postgres';
const local = JSON.parse(
  await readFile('.local/chatbot-supabase.json', 'utf8'),
);
assert.equal(
  local.API_URL,
  authUrl,
  'Use the separate chatbot QA Supabase stack',
);
assert.equal(new URL(local.DB_URL).port, '54332');
const manifest = validateDeploymentManifest(
  JSON.parse(await readFile('.local/deployment.json', 'utf8')),
  31337,
);
const client = createPublicClient({
  chain: foundry,
  transport: http(rpc),
  pollingInterval: 50,
});
assert.equal(await client.getChainId(), 31337);
const test = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http(rpc),
});
const base = createWalletClient({ chain: foundry, transport: http(rpc) });
const [admin, , seller] = await base.getAddresses();
assert.ok(admin && seller);
const reader = new ChainReader(client, manifest);
await reader.verify();
const db = createDatabase(dbUrl);
const reads = new MarketReads(
  db,
  manifest,
  new Cursors('isolated-chatbot-test-cursor-secret'.repeat(2)),
);
const intents = new TransactionIntents(db, reader);
const auth = new Web3Sessions(db, {
  url: authUrl,
  key: local.PUBLISHABLE_KEY || local.ANON_KEY,
  origin: 'http://localhost:3000',
  chainId: 31337,
});
const history = new History(
  db,
  new HistoryCursor('isolated-chatbot-history-secret'.repeat(2)),
);
const receipts: { action: string; hash: Hex; blockNumber: string }[] = [];
const checks: string[] = [];
const users: string[] = [];
const threadIds: string[] = [];
const conversations: { session: Session; id: string }[] = [];
const asset = manifest.assets[1]!;
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
  const hash = await base.writeContract(simulation.request);
  const receipt = await client.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, 'success');
  receipts.push({
    action: functionName,
    hash,
    blockNumber: receipt.blockNumber.toString(),
  });
}
async function index() {
  await test.mine({ blocks: 65 });
  const indexer = new FinalizedIndexer(db, reader);
  for (let i = 0; i < 50; i++) {
    const result = await indexer.runOnce();
    if (result.status === 'IDLE') return;
    assert.equal(result.status, 'INDEXED');
  }
  throw Error('Indexer did not catch up');
}
async function login() {
  const account = privateKeyToAccount(generatePrivateKey());
  const c = await auth.challenge(account.address);
  const providerSession = await auth.exchange(
    c.challengeId,
    await account.signMessage({ message: c.message }),
    c.challengeId,
  );
  const session = await auth.verify(providerSession.access_token);
  users.push(session.userId);
  return { account, session };
}
const dependencies: AssistantServices = {
  market: async () => ({ db, reads, reader }),
  compare: async () => {
    throw Error('External quote is not part of isolated chain evidence');
  },
  prepare: async (session, key, listingKey) => {
    const { intent } = await intents.prepare(session, key, {
      action: 'BUY_LISTING',
      listingKey,
    });
    return {
      meta: {
        schemaVersion: '1.0',
        requestId: randomUUID(),
        observedAt: Math.floor(Date.now() / 1000),
      },
      data: intent,
    };
  },
};
const toolsFor = (session: Session | null) =>
  assistantTools(session, new AbortController().signal, dependencies);
async function call(
  tools: ReturnType<typeof toolsFor>,
  name: string,
  input: unknown,
) {
  const tool = tools.find((t) => t.name === name);
  assert.ok(tool, name + ' must be registered');
  return (tool.execute as (input: unknown) => Promise<unknown>)(input);
}
function payload<T>(value: unknown): T {
  assert.ok(
    value && typeof value === 'object' && 'payload' in value,
    'Expected validated card result',
  );
  return value.payload as T;
}
const guest = toolsFor(null);
try {
  assert.ok(!guest.some((t) => t.name === 'preparePurchase'));
  assert.ok(
    !guest.some((t) => /^(sign|send|approve|swap|transfer)/i.test(t.name)),
  );
  checks.push(
    'Guest exposes five canonical read tools and no prepare/sign/send/swap',
  );
  await index();
  const empty = payload<ListingsPage>(
    await call(guest, 'searchListings', defaultSearch),
  );
  assert.equal(
    empty.items.length,
    0,
    'Run on a fresh local deployment; no dummy listing fallback',
  );
  checks.push('Fresh finalized empty market returns zero real listings');
  await tx(seller, asset.token as Address, abi.DemoShareToken, 'approve', [
    manifest.market,
    300n * 10n ** 18n,
  ]);
  for (const price of [90n, 72n, 9007199254740993n]) {
    const now = (await client.getBlock()).timestamp;
    await tx(
      seller,
      manifest.market as Address,
      abi.IncomeRightsMarket,
      'createPrimaryListing',
      [
        {
          assetId: asset.assetId,
          depositTokenAmountAtomic: 100n * 10n ** 18n,
          minReceivedShares: 100n * 10n ** 18n,
          incomeBps: 5000,
          durationSeconds: 86400n * 90n,
          priceAtomic: price * 10n ** 6n,
          listingExpiresAt: now + 86400n,
        },
      ],
    );
  }
  await index();
  const query = { ...defaultSearch, sort: 'PRICE_ASC' as const };
  const aiPage = payload<ListingsPage>(
    await call(guest, 'searchListings', query),
  );
  const apiPage = (await reads.read(
    ['chains', '31337', 'markets', manifest.market, 'listings'],
    new URLSearchParams({ market: 'ANY', sort: 'PRICE_ASC', limit: '20' }),
    randomUUID(),
  )) as ListingsPage;
  assert.deepEqual(aiPage.items, apiPage.items);
  assert.deepEqual(aiPage.snapshot, apiPage.snapshot);
  assert.deepEqual(
    aiPage.items.map((v) => v.listing.priceAtomic),
    ['72000000', '90000000', '9007199254740993000000'],
  );
  const selected = aiPage.items[0]!;
  const detail = await call(guest, 'getListing', {
    listingKey: selected.listing.listingKey,
  });
  const parsedDetail = validateData('api.ListingResponse', detail);
  assert.ok(parsedDetail.success);
  assert.deepEqual(parsedDetail.data.data, selected);
  const emptyFilter = payload<ListingsPage>(
    await call(guest, 'searchListings', {
      ...defaultSearch,
      maxPriceAtomic: '1',
    }),
  );
  assert.equal(emptyFilter.items.length, 0);
  checks.push(
    'Canonical search/detail equal API DTOs including exact amount above Number precision; empty filter has no fixtures',
  );
  const bob = await login();
  const carol = await login();
  await tx(
    admin,
    manifest.paymentToken.address as Address,
    abi.DemoUSD,
    'mint',
    [bob.account.address, 1000n * 10n ** 6n],
  );
  const beforeNonce = await client.getTransactionCount({
    address: bob.account.address,
  });
  const bobTools = toolsFor(bob.session);
  const first = payload<{ data: import('@rwa/shared').PreparedIntent }>(
    await call(bobTools, 'preparePurchase', {
      listingKey: selected.listing.listingKey,
    }),
  );
  assert.equal(first.data.state, 'NEEDS_APPROVAL');
  assert.equal(first.data.walletAddress, bob.session.walletAddress);
  assert.equal(
    first.data.purchaseSummary?.listing.listingKey,
    selected.listing.listingKey,
  );
  assert.equal(first.data.maxPriceAtomic, '72000000');
  assert.equal(first.data.steps[0]?.allowanceAmountAtomic, '72000000');
  const repeated = payload<{ data: import('@rwa/shared').PreparedIntent }>(
    await call(bobTools, 'preparePurchase', {
      listingKey: selected.listing.listingKey,
    }),
  );
  assert.equal(repeated.data.intentId, first.data.intentId);
  assert.equal(
    await client.getTransactionCount({ address: bob.account.address }),
    beforeNonce,
  );
  await assert.rejects(() => intents.get(carol.session, first.data.intentId));
  checks.push(
    'Native Web3 verified buyer prepares exact allowance-bound intent; repeat dedupes; zero wallet broadcast; other user cannot read intent',
  );
  await test.setBalance({ address: bob.account.address, value: 10n ** 18n });
  const buyerWallet = createWalletClient({
    account: bob.account,
    chain: foundry,
    transport: http(rpc),
  });
  const approvalHash = await buyerWallet.sendTransaction({
    to: first.data.steps[0]!.to as Address,
    data: first.data.steps[0]!.data as Hex,
    value: 0n,
  });
  const approvalReceipt = await client.waitForTransactionReceipt({
    hash: approvalHash,
  });
  assert.equal(approvalReceipt.status, 'success');
  receipts.push({
    action: 'buyer explicit approve',
    hash: approvalHash,
    blockNumber: approvalReceipt.blockNumber.toString(),
  });
  const ready = payload<{ data: import('@rwa/shared').PreparedIntent }>(
    await call(toolsFor(bob.session), 'preparePurchase', {
      listingKey: selected.listing.listingKey,
    }),
  ).data;
  assert.equal(ready.state, 'READY');
  assert.equal(ready.simulation, 'PASSED');
  assert.equal(ready.steps[0]?.kind, 'ACTION');
  checks.push(
    'Explicit test-wallet approval confirms separately; fresh authenticated tool preview becomes READY with canonical simulation',
  );
  await tx(
    seller,
    manifest.market as Address,
    abi.IncomeRightsMarket,
    'cancelListing',
    [BigInt(selected.listing.listingId)],
  );
  const staleCache = payload<ListingsPage>(
    await call(guest, 'searchListings', query),
  );
  assert.ok(
    staleCache.items.some(
      (i) => i.listing.listingKey === selected.listing.listingKey,
    ),
    'Deliberately keep finalized cache older than cancellation',
  );
  const freshTools = toolsFor(bob.session);
  const rejected = await call(freshTools, 'preparePurchase', {
    listingKey: selected.listing.listingKey,
  });
  const blocked = payload<{ data: import('@rwa/shared').PreparedIntent }>(
    rejected,
  ).data;
  assert.equal(blocked.state, 'BLOCKED');
  assert.deepEqual(blocked.blockers, ['LISTING_UNAVAILABLE']);
  assert.equal(blocked.steps.length, 0);
  checks.push(
    'Stale indexed OPEN listing is rejected against latest cancelled contract state',
  );
  await index();
  const refreshed = payload<ListingsPage>(
    await call(guest, 'searchListings', query),
  );
  assert.ok(
    !refreshed.items.some(
      (i) => i.listing.listingKey === selected.listing.listingKey,
    ),
  );
  assert.equal(refreshed.items.length, 2);
  checks.push(
    'Finalized index catches up and removes cancelled offer while preserving two real open listings',
  );
  const c = await history.create(bob.session, randomUUID(), {
    title: 'Isolated chatbot integration',
  });
  const id = c.data.conversationId;
  conversations.push({ session: bob.session, id });
  const card: AssistantCard = {
    cardId: 'local:tool:LISTING_COMPARISON',
    toolCallId: 'tool',
    kind: 'LISTING_COMPARISON',
    payload: aiPage,
  };
  const messageId = randomUUID();
  const pair = await Promise.all([
    history.appendUser(bob.session, id, messageId, 'Cari hak pendapatan'),
    history.appendUser(bob.session, id, messageId, 'Cari hak pendapatan'),
  ]);
  assert.equal(pair[0].messageId, pair[1].messageId);
  await history.appendAssistant(
    bob.session,
    id,
    randomUUID(),
    'Berikut data dari marketplace.',
    [card],
  );
  const restored = await history.messages(
    bob.session,
    id,
    new URLSearchParams(),
  );
  assert.equal(restored.items.length, 2);
  assert.deepEqual(restored.items[1]?.cards[0], card);
  await assert.rejects(() =>
    history.messages(carol.session, id, new URLSearchParams()),
  );
  await assert.rejects(() =>
    history.appendUser(carol.session, id, randomUUID(), 'forbidden'),
  );
  await assert.rejects(() => history.remove(carol.session, id));
  checks.push(
    'Persisted user/assistant semantic pairing and exact cards survive reload; concurrent dedupe and cross-user read/write/delete denied',
  );
  const stateA = new AssistantState(db),
    stateB = new AssistantState(db);
  const principal =
    bob.session.userId + ':' + bob.session.walletAddress + ':31337';
  const thread = await stateA.create(principal, id);
  threadIds.push(thread.id);
  const msg: AssistantMessage = {
    id: randomUUID(),
    role: 'user',
    content: 'Durable test',
  };
  await assert.rejects(
    () =>
      stateA.acquire(thread.id, principal, randomUUID(), msg, async (sql) => {
        await history
          .withTransaction(sql)
          .appendUser(bob.session, id, msg.id, 'Rollback user');
        throw Error('Controlled persistence failure');
      }),
    /Controlled persistence failure/,
  );
  assert.equal((await stateB.get(thread.id, principal)).messages.length, 0);
  assert.equal(
    (await history.messages(bob.session, id, new URLSearchParams())).items
      .length,
    2,
  );
  const runA = randomUUID(),
    runB = randomUUID();
  const races = await Promise.allSettled([
    stateA.acquire(thread.id, principal, runA, msg),
    stateB.acquire(thread.id, principal, runB, { ...msg, id: randomUUID() }),
  ]);
  assert.equal(races.filter((r) => r.status === 'fulfilled').length, 1);
  const winnerIndex = races.findIndex((r) => r.status === 'fulfilled');
  const owned = races[winnerIndex];
  assert.ok(owned?.status === 'fulfilled');
  const runId = winnerIndex === 0 ? runA : runB;
  await assert.rejects(
    () =>
      stateA.finish(
        thread.id,
        runId,
        owned.value.version,
        owned.value.messages,
        async (sql) => {
          await history
            .withTransaction(sql)
            .appendAssistant(
              bob.session,
              id,
              randomUUID(),
              'Rollback assistant',
              [],
            );
          throw Error('Controlled finish failure');
        },
      ),
    /Controlled finish failure/,
  );
  assert.equal((await stateB.get(thread.id, principal)).running, true);
  assert.equal(
    (await history.messages(bob.session, id, new URLSearchParams())).items
      .length,
    2,
  );
  checks.push(
    'History and durable run admission/completion roll back atomically on controlled callback failure',
  );
  await assert.rejects(() => stateB.get(thread.id, carol.session.userId));
  assert.equal(await stateB.stop(thread.id, principal, randomUUID()), true);
  assert.equal(
    await stateA.heartbeat(thread.id, runId, owned.value.version),
    false,
    'A stop request for another run must not cancel the current run',
  );
  assert.equal(await stateB.stop(thread.id, principal, runId), true);
  assert.equal(
    await stateA.heartbeat(thread.id, runId, owned.value.version),
    true,
  );
  await db`update app_private.assistant_threads set lease_until=now()-interval '1 second' where id=${thread.id}`;
  const runC = randomUUID();
  const replacement = await stateB.acquire(thread.id, principal, runC, {
    ...msg,
    id: randomUUID(),
  });
  assert.equal(
    await stateA.finish(thread.id, runId, owned.value.version, []),
    false,
  );
  assert.equal(
    await stateB.finish(
      thread.id,
      runC,
      replacement.version,
      replacement.messages,
    ),
    true,
  );
  assert.deepEqual(
    (await stateA.get(thread.id, principal)).messages,
    replacement.messages,
  );
  await assert.rejects(() =>
    stateA.acquire(
      thread.id,
      principal,
      randomUUID(),
      replacement.messages.at(-1)!,
    ),
  );
  const lateRunId = randomUUID();
  const late = await stateA.acquire(thread.id, principal, lateRunId, {
    ...msg,
    id: randomUUID(),
  });
  await db`update app_private.assistant_threads set lease_until=now()-interval '1 second' where id=${thread.id}`;
  assert.equal(
    await stateB.finish(thread.id, lateRunId, late.version, late.messages),
    true,
    'An expired worker can finish if no newer run took ownership',
  );
  assert.deepEqual(
    (await stateA.get(thread.id, principal)).messages,
    late.messages,
  );
  const bucket = randomUUID();
  const quotas = await Promise.allSettled([
    stateA.budget(bucket, 1),
    stateB.budget(bucket, 1),
  ]);
  assert.equal(quotas.filter((r) => r.status === 'fulfilled').length, 1);
  await db`update app_private.assistant_threads set expires_at=now()-interval '1 second' where id=${thread.id}`;
  await assert.rejects(() => stateB.get(thread.id, principal));
  checks.push(
    'Two service instances share run lease, cross-user isolation, stop flag, replay protection, stale-worker fence, restored messages, expiry and atomic quota',
  );
  const earlyThread = await stateA.create(principal);
  threadIds.push(earlyThread.id);
  const earlyRun = randomUUID();
  assert.equal(await stateB.stop(earlyThread.id, principal), false);
  assert.equal(
    await stateB.stop(earlyThread.id, carol.session.userId, earlyRun),
    false,
  );
  assert.equal(await stateB.stop(earlyThread.id, principal, earlyRun), true);
  assert.equal(await stateB.stop(earlyThread.id, principal, earlyRun), true);
  const early = await stateA.acquire(earlyThread.id, principal, earlyRun, {
    id: randomUUID(),
    role: 'user',
    content: 'Cancelled before admission',
  });
  assert.equal(early.cancelled, true);
  assert.equal(
    await stateA.heartbeat(earlyThread.id, earlyRun, early.version),
    true,
  );
  assert.equal(early.messages.length, 1);
  const [earlyCount] =
    await db`select count(*)::int as total from app_private.assistant_run_controls where thread_id=${earlyThread.id}`;
  assert.equal(earlyCount?.total, 1, 'Repeated Stop must reuse one run record');
  await assert.rejects(
    () =>
      stateB.acquire(earlyThread.id, principal, earlyRun, {
        ...msg,
        id: randomUUID(),
      }),
    { code: 'RUN_ACTIVE' },
  );
  const cancelledMessages: AssistantMessage[] = [
    ...early.messages,
    {
      id: `grounded-${earlyRun}`,
      role: 'assistant',
      content: 'Permintaan ini terhenti.',
    },
  ];
  assert.equal(
    await stateA.finish(
      earlyThread.id,
      earlyRun,
      early.version,
      cancelledMessages,
    ),
    true,
  );
  assert.equal(await stateB.stop(earlyThread.id, principal, earlyRun), false);
  await assert.rejects(
    () =>
      stateA.acquire(earlyThread.id, principal, earlyRun, {
        ...msg,
        id: randomUUID(),
      }),
    { code: 'RUN_REPLAY' },
  );
  const nextRun = randomUUID();
  const next = await stateA.acquire(earlyThread.id, principal, nextRun, {
    ...msg,
    id: randomUUID(),
    content: 'A distinct next question',
  });
  assert.equal(next.cancelled, false);
  assert.equal(await stateB.stop(earlyThread.id, principal, earlyRun), false);
  assert.equal(
    await stateB.stop(earlyThread.id, principal, randomUUID()),
    true,
  );
  assert.equal(
    await stateA.heartbeat(earlyThread.id, nextRun, next.version),
    false,
    'Delayed completed-run Stop and unrelated pending Stop must not cancel a newer run',
  );
  assert.deepEqual(next.messages.slice(0, 2), cancelledMessages);
  await stateA.finish(earlyThread.id, nextRun, next.version, next.messages);
  checks.push(
    'Before-admission Stop survives duplicate requests, cancels only its exact run, rejects same-run replay and preserves the next question',
  );
  for (let i = 0; i < 8; i++) {
    const concurrentThread = await stateA.create(principal);
    threadIds.push(concurrentThread.id);
    const concurrentRun = randomUUID();
    const [lease, stop]: [
      Awaited<ReturnType<AssistantState['acquire']>>,
      boolean,
    ] = await Promise.all([
      stateA.acquire(concurrentThread.id, principal, concurrentRun, {
        ...msg,
        id: randomUUID(),
      }),
      stateB.stop(concurrentThread.id, principal, concurrentRun),
    ]);
    assert.equal(stop, true);
    assert.equal(
      await stateA.heartbeat(concurrentThread.id, concurrentRun, lease.version),
      true,
      'Both possible transaction orders must preserve cancellation',
    );
    assert.equal(lease.messages.length, 1);
    await stateA.finish(
      concurrentThread.id,
      concurrentRun,
      lease.version,
      lease.messages,
    );
  }
  checks.push(
    'Concurrent Stop and admission across two service instances preserve cancellation and one user message',
  );
  const boundedThread = await stateA.create(principal);
  threadIds.push(boundedThread.id);
  const boundedRun = randomUUID();
  const boundedLease = await stateA.acquire(
    boundedThread.id,
    principal,
    boundedRun,
    { ...msg, id: randomUUID() },
  );
  const pendingIds = Array.from({ length: 127 }, () => randomUUID());
  const pendingStops = await Promise.all(
    pendingIds.map((id) => stateB.stop(boundedThread.id, principal, id)),
  );
  assert.ok(pendingStops.every(Boolean));
  await assert.rejects(
    () => stateB.stop(boundedThread.id, principal, randomUUID()),
    { code: 'CHAT_LIMIT' },
  );
  assert.equal(
    await stateB.stop(boundedThread.id, principal, boundedRun),
    true,
    'A full ledger must still allow stopping its active run',
  );
  await stateA.finish(
    boundedThread.id,
    boundedRun,
    boundedLease.version,
    boundedLease.messages,
  );
  await assert.rejects(
    () =>
      stateA.acquire(boundedThread.id, principal, randomUUID(), {
        ...msg,
        id: randomUUID(),
      }),
    { code: 'CHAT_LIMIT' },
  );
  const knownPending = await stateA.acquire(
    boundedThread.id,
    principal,
    pendingIds[0]!,
    { ...msg, id: randomUUID() },
  );
  assert.equal(knownPending.cancelled, true);
  await stateA.finish(
    boundedThread.id,
    pendingIds[0]!,
    knownPending.version,
    knownPending.messages,
  );
  const [boundedCount] =
    await db`select count(*)::int as total from app_private.assistant_run_controls where thread_id=${boundedThread.id}`;
  assert.equal(boundedCount?.total, 128);
  await db`delete from app_private.assistant_threads where id=${boundedThread.id}`;
  const [deletedCount] =
    await db`select count(*)::int as total from app_private.assistant_run_controls where thread_id=${boundedThread.id}`;
  assert.equal(deletedCount?.total, 0);
  checks.push(
    'Run-control records are bounded under concurrent pending stops, retain active/known-run cancellation at capacity and cascade on thread deletion',
  );
  const evidence = {
    source: 'ISOLATED_LOCAL_ANVIL_SUPABASE_REAL_SERVICES_NO_LLM',
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim(),
    sourceDirty:
      execFileSync('git', ['status', '--porcelain'], {
        encoding: 'utf8',
      }).trim().length > 0,
    checks,
    receipts,
    listingKeys: aiPage.items.map((i) => i.listing.listingKey),
    limitations:
      'Actual local EVM receipts, finalized index, PostgreSQL and native Web3 auth. Controlled stale cache/lease expiry. No browser wallet extension, real LLM, mainnet quote or Sepolia proof.',
  };
  await mkdir('.local', { recursive: true });
  await writeFile(
    '.local/chatbot-integration-evidence.json',
    JSON.stringify(evidence, null, 2) + '\n',
    { mode: 0o600 },
  );
  for (const check of checks) console.log('PASS', check);
} finally {
  for (const { session, id } of conversations)
    await history.remove(session, id).catch(() => {});
  for (const id of threadIds)
    await db`delete from app_private.assistant_threads where id=${id}`;
  for (const id of users) await db`delete from auth.users where id=${id}`;
  await db.end();
}
