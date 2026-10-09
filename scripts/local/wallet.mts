import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createPublicClient,
  createWalletClient,
  createTestClient,
  http,
  type Address,
} from 'viem';
import { foundry } from 'viem/chains';
import { validateDeploymentManifest } from '@rwa/shared/config';
import {
  MarketplaceWallet,
  validJournalEntry,
  type WalletProvider,
} from '../../apps/web/src/features/marketplace/wallet.js';
const transport = http('http://127.0.0.1:8545'),
  c = createPublicClient({ chain: foundry, transport, pollingInterval: 50 }),
  w = createWalletClient({ chain: foundry, transport }),
  t = createTestClient({ chain: foundry, mode: 'anvil', transport });
assert.equal(await c.getChainId(), 31337);
const m = validateDeploymentManifest(
    JSON.parse(await readFile('.local/deployment.json', 'utf8')),
    31337,
  ),
  accounts = await w.getAddresses(),
  alice = accounts[2]!;
let account = alice,
  chain = 31337,
  sends = 0,
  reject = false,
  delay = 0;
const provider = {
  request: async ({ method, params }: { method: string; params?: unknown }) => {
    if (method === 'eth_accounts' || method === 'eth_requestAccounts')
      return [account];
    if (method === 'eth_chainId') return '0x' + chain.toString(16);
    if (method === 'eth_sendTransaction') {
      sends++;
      await new Promise((r) => setTimeout(r, delay));
      if (reject) throw { code: 4001, message: 'Test rejection' };
    }
    return c.request({ method, params } as never);
  },
} as WalletProvider;
const wallet = new MarketplaceWallet(provider, m),
  asset = m.assets[0]!;
const input = () => ({
  action: 'CREATE_PRIMARY_LISTING' as const,
  assetKey: `eip155:31337:${m.registry}:${asset.assetId}`,
  depositTokenAmountAtomic: '7000000000000000000',
  minReceivedShares: '1',
  incomeBps: 5000,
  durationSeconds: 600,
  priceAtomic: '1000000',
  listingExpiresAt: 0,
});
async function prepare() {
  const req = input();
  req.listingExpiresAt = Number((await c.getBlock()).timestamp) + 300;
  return wallet.prepare(req);
}
const snap = await t.snapshot();
try {
  let p = await prepare();
  assert.equal(p.state, 'NEEDS_APPROVAL');
  account = accounts[3]!;
  await assert.rejects(() => wallet.send(p, () => {}));
  account = alice;
  chain = 1;
  await assert.rejects(() => wallet.send(p, () => {}));
  chain = 31337;
  assert.equal(sends, 0);
  const forged = structuredClone(p);
  forged.steps[0]!.data = '0x12345678';
  await assert.rejects(() => wallet.send(forged, () => {}));
  assert.equal(sends, 0);
  reject = true;
  await assert.rejects(() => wallet.send(p, () => {}));
  reject = false;
  assert.equal(sends, 1);
  await t.setAutomine(false);
  delay = 80;
  const first = wallet.send(p, () => {});
  await assert.rejects(() => wallet.send(p, () => {}), /masih berjalan/);
  const pending = await first;
  assert.equal(pending.status, 'PENDING');
  assert.equal(sends, 2);
  assert.ok(validJournalEntry(pending));
  const original = await c.getTransaction({ hash: pending.hash });
  const replacement = await w.sendTransaction({
    account: alice,
    to: pending.to,
    data: pending.data,
    nonce: original.nonce,
    gas: 150000n,
    maxFeePerGas: 100000000000n,
    maxPriorityFeePerGas: 10000000000n,
  });
  await t.mine({ blocks: 1 });
  await t.setAutomine(true);
  const result = await new MarketplaceWallet(provider, m).track(
    JSON.parse(JSON.stringify(pending)),
    () => {},
  );
  assert.equal(result.tracked.status, 'CONFIRMED');
  assert.equal(result.tracked.hash, pending.hash);
  assert.equal(result.tracked.replacementHash, replacement);
  assert.equal(sends, 2, 'Tracking reload never sends');
  assert.equal(validJournalEntry({ ...pending, data: '0xzz' }), false);
  assert.equal(
    validJournalEntry({ ...pending, submittedAtBlock: '-1' }),
    false,
  );
  p = await prepare();
  assert.equal(p.state, 'READY');
  const beforeCreate = await t.snapshot();
  const created = await wallet.send(p, () => {});
  const confirmed = await wallet.track(created, () => {});
  assert.equal(confirmed.position?.storedState, 'OFFERED');
  await t.revert({ id: beforeCreate });
  const orphan = await wallet.track(confirmed.tracked, () => {});
  assert.equal(orphan.tracked.status, 'REORGED');
  assert.equal(orphan.position, null);
  // Approval amount is changed to force a new review; cancel via a self-transfer at the same nonce.
  const req = input();
  req.depositTokenAmountAtomic = '14000000000000000000';
  req.listingExpiresAt = Number((await c.getBlock()).timestamp) + 300;
  const cancelPreview = await wallet.prepare(req);
  assert.equal(cancelPreview.state, 'NEEDS_APPROVAL');
  await t.setAutomine(false);
  const cancelled = await wallet.send(cancelPreview, () => {});
  const tx = await c.getTransaction({ hash: cancelled.hash });
  await w.sendTransaction({
    account: alice,
    to: alice as Address,
    value: 0n,
    nonce: tx.nonce,
    gas: 21000n,
    maxFeePerGas: 100000000000n,
    maxPriorityFeePerGas: 10000000000n,
  });
  await t.mine({ blocks: 1 });
  await t.setAutomine(true);
  const cancelResult = await new MarketplaceWallet(provider, m).track(
    cancelled,
    () => {},
  );
  assert.equal(cancelResult.tracked.status, 'CANCELLED');
  assert.equal(cancelResult.position, null);
  console.log(
    'PASS wallet RPC: wrong account/chain/tampered review/rejection, concurrent prompt, pending journal reload, exact replacement recognition without resend, cancelled replacement, orphaned receipt reorg. Controlled Anvil fault injection; browser lifecycle tested separately.',
  );
} finally {
  await t.setAutomine(true);
  await t.revert({ id: snap });
}
