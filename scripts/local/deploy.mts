import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
  keccak256,
  toHex,
  type Abi,
  type Address,
  type Hex,
} from 'viem';
import { foundry } from 'viem/chains';
import { implementationAbis as abi } from '@rwa/shared/abi';
import {
  deriveAssetId,
  DEMO_ASSET_PRESETS,
  validateDeploymentManifest,
  type DeploymentManifest,
} from '@rwa/shared/config';

// This script deliberately has no configurable remote URL or private key.
// All transactions use unlocked accounts on a caller-started local Anvil only.
const rpc = 'http://127.0.0.1:8545';
const publicClient = createPublicClient({
  pollingInterval: 50,
  chain: foundry,
  transport: http(rpc),
});
if ((await publicClient.getChainId()) !== 31337)
  throw new Error('Local Anvil chain required');
// Deterministic virtual time prevents CI wall-clock latency from changing scheduled events.
await createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http(rpc),
}).setBlockTimestampInterval({ interval: 1 });
const base = createWalletClient({ chain: foundry, transport: http(rpc) });
const accounts = await base.getAddresses();
if (accounts.length < 5)
  throw new Error('Need five isolated unlocked local accounts');
const [admin, finalizer, alice, bob, carol] = accounts as [
  Address,
  Address,
  Address,
  Address,
  Address,
];
const wallet = createWalletClient({
  account: admin,
  chain: foundry,
  transport: http(rpc),
});
const root = resolve(import.meta.dirname, '../..');
const receipts: { hash: Hex; blockNumber: string; action: string }[] = [];
async function receipt(hash: Hex, action: string) {
  const r = await publicClient.waitForTransactionReceipt({ hash });
  if (r.status !== 'success')
    throw new Error(`Local transaction reverted: ${action}`);
  receipts.push({ hash, blockNumber: r.blockNumber.toString(), action });
  return r;
}
async function deploy(name: string, args: unknown[]) {
  const artifact = JSON.parse(
    await readFile(
      resolve(root, `packages/contracts/out/${name}.sol/${name}.json`),
      'utf8',
    ),
  );
  const r = await receipt(
    await wallet.deployContract({
      abi: artifact.abi as Abi,
      bytecode: artifact.bytecode.object as Hex,
      args,
    }),
    `deploy ${name}`,
  );
  if (!r.contractAddress) throw new Error('Missing deployment address');
  return r.contractAddress;
}
const registry = await deploy('CorporateActionRegistry', [admin, finalizer]);
const adapter = await deploy('XStocksAdapter', []);
const usd = await deploy('DemoUSD', [admin]);
const market = await deploy('IncomeRightsMarket', [registry, usd]);
const assets: DeploymentManifest['assets'] = [];
const evidence = keccak256(toHex('LOCAL SIMULATION: no real stock backing'));
for (const preset of DEMO_ASSET_PRESETS) {
  const token = await deploy('DemoShareToken', [
    preset.name,
    preset.symbol,
    admin,
  ]);
  await receipt(
    await wallet.writeContract({
      address: registry,
      abi: abi.CorporateActionRegistry,
      functionName: 'registerAsset',
      args: [token, adapter, true, evidence],
    }),
    'register ' + preset.symbol,
  );
  await receipt(
    await wallet.writeContract({
      address: token,
      abi: abi.DemoShareToken,
      functionName: 'mint',
      args: [alice, 1000n * 10n ** 18n],
    }),
    'mint simulated backing',
  );
  assets.push({
    assetId: deriveAssetId(31337, token),
    token,
    adapter,
    symbol: preset.symbol,
    tokenDecimals: 18,
    isDemo: true,
  });
}
for (const account of [alice, bob, carol]) {
  await receipt(
    await wallet.writeContract({
      address: usd,
      abi: abi.DemoUSD,
      functionName: 'mint',
      args: [account, 1000n * 10n ** 6n],
    }),
    'mint DemoUSD',
  );
}
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim();
const sourceDirty =
  execFileSync('git', ['status', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
  }).trim().length > 0;
const manifest = validateDeploymentManifest(
  {
    interfaceVersion: '1.0',
    environment: 'LOCAL',
    chainId: 31337,
    market,
    registry,
    paymentToken: {
      address: usd,
      decimals: 6,
      symbol: 'DemoUSD',
      isDemo: true,
    },
    deploymentBlock: receipts[0]!.blockNumber,
    sourceCommit,
    assets,
  },
  31337,
);
await mkdir(resolve(root, '.local'), { recursive: true });
await writeFile(
  resolve(root, '.local/deployment.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
await writeFile(
  resolve(root, '.local/deployment-evidence.json'),
  JSON.stringify(
    {
      sourceCommit,
      sourceDirty,
      accounts: { admin, finalizer, alice, bob, carol },
      receipts,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `Local simulated deployment: ${receipts.length} successful receipts. Manifest: .local/deployment.json. sourceDirty=${sourceDirty}`,
);
