import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
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
import { foundry } from 'viem/chains';
import { implementationAbis as abi } from '@rwa/shared/abi';
import {
  validateDeploymentManifest,
  type DeploymentManifest,
} from '@rwa/shared/config';
import { ChainReader } from '@rwa/shared/chain';

const rpc = 'http://127.0.0.1:8545';
const client = createPublicClient({
  chain: foundry,
  transport: http(rpc),
  pollingInterval: 50,
});
assert.equal(await client.getChainId(), 31337, 'Local chain only');
const test = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http(rpc),
});
const base = createWalletClient({ chain: foundry, transport: http(rpc) });
const [admin, finalizer, alice, bob, carol] = (await base.getAddresses()) as [
  Address,
  Address,
  Address,
  Address,
  Address,
];
const m = validateDeploymentManifest(
  JSON.parse(
    await readFile('.local/deployment.json', 'utf8'),
  ) as DeploymentManifest,
  31337,
);
const reader = new ChainReader(client, m);
await reader.verify();
const market = m.market as Address,
  registry = m.registry as Address,
  usd = m.paymentToken.address as Address;
const asset = m.assets[0]!,
  token = asset.token as Address,
  adapter = asset.adapter as Address,
  id = asset.assetId as Hex;
const transactions: { hash: Hex; action: string; blockNumber: string }[] = [];
async function tx(
  account: Address,
  address: Address,
  contractAbi: Abi,
  functionName: string,
  args: readonly unknown[],
) {
  const w = createWalletClient({
    account,
    chain: foundry,
    transport: http(rpc),
  });
  const simulation = await client.simulateContract({
    account,
    address,
    abi: contractAbi,
    functionName,
    args,
  });
  const hash = await w.writeContract(simulation.request);
  const r = await client.waitForTransactionReceipt({ hash });
  assert.equal(r.status, 'success');
  transactions.push({
    hash,
    action: functionName,
    blockNumber: r.blockNumber.toString(),
  });
  return r;
}
const now = async () => (await client.getBlock()).timestamp;
await tx(alice, token, abi.DemoShareToken, 'approve', [
  market,
  100n * 10n ** 18n,
]);
const created = await tx(
  alice,
  market,
  abi.IncomeRightsMarket,
  'createPrimaryListing',
  [
    {
      assetId: id,
      depositTokenAmountAtomic: 100n * 10n ** 18n,
      minReceivedShares: 100n * 10n ** 18n,
      incomeBps: 5000,
      durationSeconds: 600n,
      priceAtomic: 90n * 10n ** 6n,
      listingExpiresAt: (await now()) + 300n,
    },
  ],
);
let detail = await reader.listing(
  1n,
  created.blockNumber,
  await reader.snapshot('latest'),
);
assert.equal(detail.position.rightsOwner, null);
assert.equal(detail.listing.displayStatus, 'OPEN');
assert.equal(detail.position.principalShares, '100000000000000000000');
async function buy(buyer: Address, listingId: bigint) {
  const listing = await client.readContract({
    address: market,
    abi: abi.IncomeRightsMarket,
    functionName: 'getListing',
    args: [listingId],
  });
  const head = await client.readContract({
    address: registry,
    abi: abi.CorporateActionRegistry,
    functionName: 'getAssetHead',
    args: [id],
  });
  await tx(buyer, usd, abi.DemoUSD, 'approve', [market, listing.priceAtomic]);
  return tx(buyer, market, abi.IncomeRightsMarket, 'buyListing', [
    {
      listingId,
      expectedTermsHash: listing.termsHash,
      expectedAssetHeadHash: head.assetHeadHash,
      maxPriceAtomic: listing.priceAtomic,
      deadline: (await now()) + 100n,
      maxEvents: 32,
    },
  ]);
}
await buy(bob, 1n);
detail = await reader.listing(
  1n,
  created.blockNumber,
  await reader.snapshot('latest'),
);
assert.equal(detail.position.rightsOwner, bob.toLowerCase());
const endAt = detail.position.endAt!;
const evidence = keccak256(
  toHex('SYNTHETIC LOCAL issuer data; not real dividends'),
);
let before = 10n ** 18n;
async function event(kind: number, after: bigint, sequence: bigint) {
  const effective = (await now()) + 3n;
  await tx(admin, token, abi.DemoShareToken, 'schedule', [
    after,
    sequence,
    effective,
  ]);
  await test.setNextBlockTimestamp({ timestamp: effective });
  await test.mine({ blocks: 1 });
  const occurrence = keccak256(toHex(`local-event-${sequence}`));
  const eventId = keccak256(
    encodeAbiParameters(
      [{ type: 'uint256' }, { type: 'address' }, { type: 'bytes32' }],
      [31337n, token, occurrence],
    ),
  );
  await tx(
    finalizer,
    registry,
    abi.CorporateActionRegistry,
    'appendFinalizedEvents',
    [
      id,
      [
        {
          eventId,
          sequence,
          kind,
          effectiveAt: effective,
          multiplierBefore: before,
          multiplierAfter: after,
          issuerNonceAfter: sequence,
          historyIndex: sequence,
          sourceRevision: 1,
          sourceOccurrenceKey: occurrence,
          evidenceHash: evidence,
        },
      ],
    ],
  );
  const snap = await client.readContract({
    address: adapter,
    abi: abi.XStocksAdapter,
    functionName: 'readSnapshot',
    args: [token],
  });
  await tx(
    finalizer,
    registry,
    abi.CorporateActionRegistry,
    'acknowledgeAssetSnapshot',
    [id, snap, evidence],
  );
  await tx(carol, market, abi.IncomeRightsMarket, 'checkpointPosition', [
    1n,
    32,
  ]);
  before = after;
}
await event(0, 102n * 10n ** 16n, 1n);
const first = await reader.claim(id, bob, await reader.snapshot('latest'));
assert.equal(first.claimShares, '980392156862745098');
await tx(bob, market, abi.IncomeRightsMarket, 'createSecondaryListing', [
  1n,
  50n * 10n ** 6n,
  (await now()) + 200n,
]);
await buy(carol, 2n);
await event(0, 10404n * 10n ** 14n, 2n);
assert.equal(
  (await reader.claim(id, bob, await reader.snapshot('latest'))).claimShares,
  first.claimShares,
);
assert.equal(
  (await reader.claim(id, carol, await reader.snapshot('latest'))).claimShares,
  '961168781237985390',
);
await event(1, 20808n * 10n ** 14n, 3n);
assert.equal(
  (await reader.claim(id, bob, await reader.snapshot('latest'))).claimShares,
  first.claimShares,
);
await test.setNextBlockTimestamp({ timestamp: BigInt(endAt) });
await test.mine({ blocks: 1 });
const source = await client.getBlock();
await test.setNextBlockTimestamp({ timestamp: source.timestamp + 1n });
await test.mine({ blocks: 1 });
await tx(
  finalizer,
  registry,
  abi.CorporateActionRegistry,
  'advanceFinalityCoverage',
  [
    id,
    {
      finalizedThrough: BigInt(endAt),
      sourceBlockTimestamp: source.timestamp,
      sourceBlockNumber: source.number,
      sourceBlockHash: source.hash,
      evidenceHash: evidence,
    },
  ],
);
assert.equal(
  (await reader.position(1n, await reader.snapshot('latest'))).displayState,
  'SETTLING',
);
await tx(carol, market, abi.IncomeRightsMarket, 'settlePosition', [1n, 32]);
await tx(alice, market, abi.IncomeRightsMarket, 'releasePrincipal', [1n, 32]);
const reserve = await client.readContract({
  address: market,
  abi: abi.IncomeRightsMarket,
  functionName: 'totalClaimShares',
  args: [id],
});
assert.equal(
  await client.readContract({
    address: token,
    abi: abi.DemoShareToken,
    functionName: 'sharesOf',
    args: [market],
  }),
  reserve,
);
for (const account of [alice, bob, carol]) {
  const claim = await reader.claim(
    id,
    account,
    await reader.snapshot('latest'),
  );
  await tx(account, market, abi.IncomeRightsMarket, 'claimIncome', [
    id,
    BigInt(claim.claimShares),
  ]);
  assert.equal(
    (await reader.claim(id, account, await reader.snapshot('latest')))
      .claimShares,
    '0',
  );
}
assert.equal(
  await client.readContract({
    address: token,
    abi: abi.DemoShareToken,
    functionName: 'sharesOf',
    args: [market],
  }),
  0n,
);
assert.equal(
  (await reader.position(1n, await reader.snapshot('latest'))).storedState,
  'RELEASED',
);
await assert.rejects(() =>
  tx(bob, market, abi.IncomeRightsMarket, 'claimIncome', [id, 1n]),
);
await assert.rejects(() =>
  reader.asset(id, { ...detail.asset.snapshot, chainId: 1 }),
);
await writeFile(
  '.local/lifecycle-evidence.json',
  JSON.stringify(
    {
      environment: 'LOCAL_SIMULATION',
      sourceCommit: m.sourceCommit,
      transactions,
      checks: [
        'primary activation',
        'two dividends',
        'whole resale',
        'old claims retained',
        'split without new income',
        'end unchanged',
        'coverage before release',
        'claim reserve',
        'exact claims',
        'double claim rejected',
        'DTO schema/chain validation',
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `PASS local lifecycle: ${transactions.length} successful RPC transaction receipts; independent expected balances and validated DTOs.`,
);
