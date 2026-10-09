import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  encodeDeployData,
  encodeFunctionData,
  parseEther,
  toHex,
  type Abi,
  type Hex,
  type Address,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { implementationAbis as abi } from '@rwa/shared/abi';
import {
  DEMO_ASSET_PRESETS,
  deriveAssetId,
  validateDeploymentManifest,
  type DeploymentManifest,
} from '@rwa/shared/config';

const root = resolve(import.meta.dirname, '../..');
const dir = resolve(
  root,
  process.env.SEPOLIA_DEPLOYMENT_DIR || '.local/sepolia',
);
const stringify = (v: unknown) =>
  JSON.stringify(
    v,
    (_, x: unknown) => (typeof x === 'bigint' ? x.toString() : x),
    2,
  ) + '\n';
async function save(file: string, value: unknown) {
  await writeFile(file + '.tmp', stringify(value), { mode: 0o600 });
  await rename(file + '.tmp', file);
}
async function main() {
  const {
    SEPOLIA_RPC_URL: rpc,
    SEPOLIA_DEPLOYER_PRIVATE_KEY: key,
    SEPOLIA_FINALIZER_PRIVATE_KEY: finalizerKey,
  } = process.env;
  assert(
    rpc && key && finalizerKey,
    'Sepolia RPC and separate signers required',
  );
  assert(
    /^0x[0-9a-fA-F]{64}$/.test(key) && /^0x[0-9a-fA-F]{64}$/.test(finalizerKey),
    'Invalid signer format',
  );
  const admin = privateKeyToAccount(key as Hex),
    finalizer = privateKeyToAccount(finalizerKey as Hex);
  assert.notEqual(
    admin.address,
    finalizer.address,
    'Separate finalizer required',
  );
  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpc, { retryCount: 0, timeout: 15000 }),
    pollingInterval: 3000,
  });
  assert.equal(await client.getChainId(), 11155111, 'Sepolia only');
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const dirty = execFileSync(
    'git',
    ['status', '--porcelain', '--', '.', ':!research/**'],
    {
      cwd: root,
      encoding: 'utf8',
    },
  ).trim();
  const broadcast = process.argv.includes('--broadcast');
  if (broadcast)
    assert.equal(dirty, '', 'Commit and test the deployment revision first');
  const balance = await client.getBalance({ address: admin.address });
  assert(
    balance >= parseEther('0.03'),
    'Deployer needs 0.03 Sepolia ETH available for bounded rollout',
  );
  for (const name of [
    'CorporateActionRegistry',
    'XStocksAdapter',
    'DemoUSD',
    'IncomeRightsMarket',
    'DemoShareToken',
  ]) {
    const a = JSON.parse(
      await readFile(
        resolve(root, `packages/contracts/out/${name}.sol/${name}.json`),
        'utf8',
      ),
    );
    assert(
      a.bytecode.object.startsWith('0x') && a.bytecode.object.length > 2,
      'Build artifacts required',
    );
  }
  console.log(
    stringify({
      mode: broadcast ? 'BROADCAST' : 'PREFLIGHT',
      chainId: 11155111,
      sourceCommit,
      admin: admin.address,
      finalizer: finalizer.address,
      maxDeployerSpendWei: parseEther('0.03'),
      balanceWei: balance,
    }),
  );
  if (!broadcast) return;
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const actorsPath = resolve(dir, 'actors.json');
  let keys: Record<string, Hex>;
  try {
    keys = JSON.parse(await readFile(actorsPath, 'utf8'));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    keys = {
      alice: generatePrivateKey(),
      bob: generatePrivateKey(),
      carol: generatePrivateKey(),
    };
    await save(actorsPath, keys);
  }
  const actors = Object.fromEntries(
    Object.entries(keys).map(([name, k]) => [
      name,
      privateKeyToAccount(k).address,
    ]),
  );
  type Entry = {
    label: string;
    hash: Hex;
    raw: Hex;
    value: string;
    maxCost: string;
    block?: string;
    contract?: Address;
    gasCost?: string;
  };
  type Journal = {
    sourceCommit: string;
    chainId: number;
    admin: Address;
    finalizer: Address;
    actors: Record<string, Address>;
    entries: Entry[];
  };
  const journalPath = resolve(dir, 'deploy-journal.json');
  let journal: Journal;
  try {
    journal = JSON.parse(await readFile(journalPath, 'utf8'));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    journal = {
      sourceCommit,
      chainId: 11155111,
      admin: admin.address,
      finalizer: finalizer.address,
      actors,
      entries: [],
    };
  }
  assert.equal(
    journal.sourceCommit,
    sourceCommit,
    'Resume the exact deployment source revision',
  );
  assert.equal(journal.admin, admin.address);
  assert.equal(journal.finalizer, finalizer.address);
  assert.deepEqual(journal.actors, actors);
  const wallet = createWalletClient({
    account: admin,
    chain: sepolia,
    transport: http(rpc, { retryCount: 0, timeout: 15000 }),
  });
  async function send(label: string, data: Hex, to?: Address, value = 0n) {
    let entry = journal.entries.find((x) => x.label === label);
    if (!entry) {
      const prepared = await wallet.prepareTransactionRequest({
        to,
        data,
        value,
      });
      const cost =
        prepared.gas * (prepared.maxFeePerGas ?? prepared.gasPrice ?? 0n) +
        value;
      const used = journal.entries.reduce(
        (sum, x) =>
          sum +
          BigInt(x.gasCost ?? x.maxCost) +
          (x.gasCost ? BigInt(x.value) : 0n),
        0n,
      );
      assert(
        used + cost <= parseEther('0.03'),
        'Deployment spend cap exceeded; no transaction signed',
      );
      const raw = await wallet.signTransaction(prepared);
      entry = {
        label,
        hash: keccak256(raw),
        raw,
        value: value.toString(),
        maxCost: cost.toString(),
      };
      journal.entries.push(entry);
      await save(journalPath, journal);
    }
    if (!entry.block) {
      const existing = await client
        .getTransactionReceipt({ hash: entry.hash })
        .catch(() => null);
      if (!existing) {
        try {
          await client.sendRawTransaction({ serializedTransaction: entry.raw });
        } catch {
          console.log(
            'Broadcast response uncertain; checking the persisted transaction hash only.',
          );
        }
      }
      const receipt =
        existing ??
        (await client.waitForTransactionReceipt({
          hash: entry.hash,
          timeout: 180000,
        }));
      assert.equal(receipt.status, 'success', 'Transaction reverted: ' + label);
      entry.block = receipt.blockNumber.toString();
      entry.gasCost = (receipt.gasUsed * receipt.effectiveGasPrice).toString();
      if (receipt.contractAddress) entry.contract = receipt.contractAddress;
      await save(journalPath, journal);
    }
    console.log(label + ': ' + entry.hash);
    return entry;
  }
  async function deploy(name: string, args: unknown[], label = name) {
    const artifact = JSON.parse(
      await readFile(
        resolve(root, `packages/contracts/out/${name}.sol/${name}.json`),
        'utf8',
      ),
    );
    const entry = await send(
      'deploy ' + label,
      encodeDeployData({
        abi: artifact.abi as Abi,
        bytecode: artifact.bytecode.object as Hex,
        args,
      }),
    );
    assert(entry.contract, 'Missing contract address');
    assert(
      (await client.getCode({ address: entry.contract })) !== undefined,
      'Deployed bytecode missing',
    );
    return entry.contract;
  }
  async function call(
    label: string,
    address: Address,
    contractAbi: Abi,
    functionName: string,
    args: unknown[],
  ) {
    return send(
      label,
      encodeFunctionData({ abi: contractAbi, functionName, args }),
      address,
    );
  }
  const registry = await deploy('CorporateActionRegistry', [
    admin.address,
    finalizer.address,
  ]);
  const adapter = await deploy('XStocksAdapter', []);
  const usd = await deploy('DemoUSD', [admin.address]);
  const market = await deploy('IncomeRightsMarket', [registry, usd]);
  const assets: DeploymentManifest['assets'] = [];
  const evidence = keccak256(
    toHex('YIELDEX SEPOLIA SIMULATION: no real stock backing; ' + sourceCommit),
  );
  for (const preset of DEMO_ASSET_PRESETS) {
    const token = await deploy(
      'DemoShareToken',
      [preset.name, preset.symbol, admin.address],
      preset.symbol,
    );
    await call(
      'register ' + preset.symbol,
      registry,
      abi.CorporateActionRegistry,
      'registerAsset',
      [token, adapter, true, evidence],
    );
    for (const account of [actors.alice!, admin.address])
      await call(
        'mint ' + preset.symbol + ' ' + account,
        token,
        abi.DemoShareToken,
        'mint',
        [account, 1000n * 10n ** 18n],
      );
    assets.push({
      assetId: deriveAssetId(11155111, token),
      token,
      adapter,
      symbol: preset.symbol,
      tokenDecimals: 18,
      isDemo: true,
    });
  }
  for (const [name, account] of Object.entries(actors)) {
    await call('mint DemoUSD ' + name, usd, abi.DemoUSD, 'mint', [
      account,
      1000n * 10n ** 6n,
    ]);
    await send('fund gas ' + name, '0x', account, parseEther('0.003'));
  }
  await call('mint DemoUSD admin', usd, abi.DemoUSD, 'mint', [
    admin.address,
    1000n * 10n ** 6n,
  ]);
  const manifest = validateDeploymentManifest(
    {
      interfaceVersion: '1.0',
      environment: 'SEPOLIA',
      chainId: 11155111,
      market,
      registry,
      paymentToken: {
        address: usd,
        decimals: 6,
        symbol: 'DemoUSD',
        isDemo: true,
      },
      deploymentBlock: journal.entries[0]!.block!,
      sourceCommit,
      assets,
    },
    11155111,
  );
  await save(resolve(dir, 'deployment.json'), manifest);
  await save(resolve(dir, 'deploy-evidence.json'), {
    ...journal,
    entries: journal.entries.map((e) => ({
      label: e.label,
      hash: e.hash,
      value: e.value,
      maxCost: e.maxCost,
      block: e.block,
      contract: e.contract,
      gasCost: e.gasCost,
    })),
  });
  console.log(
    'Sepolia deployment and seed completed. Public manifest: .local/sepolia/deployment.json',
  );
}
void main().catch(() => {
  console.error(
    'Sepolia rollout stopped. Inspect the private journal; do not reset nonce or rerun from a different revision. No secrets logged.',
  );
  process.exitCode = 1;
});
