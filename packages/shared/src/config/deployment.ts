import {
  encodeAbiParameters,
  getAddress,
  isAddress,
  keccak256,
  zeroAddress,
  type Address,
} from 'viem';

export type Environment = 'LOCAL' | 'SEPOLIA' | 'FORK';
export type DeploymentAsset = {
  assetId: string;
  token: string;
  adapter: string;
  symbol: string;
  tokenDecimals: 18;
  isDemo: boolean;
};
export type DeploymentManifest = {
  interfaceVersion: '1.0';
  environment: Environment;
  chainId: number;
  market: string;
  registry: string;
  paymentToken: {
    address: string;
    decimals: 6;
    symbol: 'DemoUSD';
    isDemo: true;
  };
  deploymentBlock: string;
  sourceCommit: string;
  assets: DeploymentAsset[];
  fork?: { sourceChainId: 1; blockNumber: string; blockHash: string };
};
export const DEMO_ASSET_PRESETS = [
  {
    symbol: 'demoSPY',
    name: 'Simulated SPY shares',
    tokenDecimals: 18,
    isDemo: true,
  },
  {
    symbol: 'demoAAPL',
    name: 'Simulated AAPL shares',
    tokenDecimals: 18,
    isDemo: true,
  },
  {
    symbol: 'demoMSFT',
    name: 'Simulated MSFT shares',
    tokenDecimals: 18,
    isDemo: true,
  },
] as const;

export function normalizeAddress(value: string): Address {
  if (
    !isAddress(value, { strict: true }) ||
    value.toLowerCase() === zeroAddress
  )
    throw new Error('Invalid nonzero EVM address');
  // isAddress rejects invalid mixed-case checksum; wire format is lowercase.
  return getAddress(value).toLowerCase() as Address;
}
export function deriveAssetId(chainId: number, token: string): string {
  if (!Number.isSafeInteger(chainId) || chainId <= 0)
    throw new Error('Invalid chain ID');
  return keccak256(
    encodeAbiParameters(
      [{ type: 'uint256' }, { type: 'address' }],
      [BigInt(chainId), normalizeAddress(token)],
    ),
  );
}
function requireCondition(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function validateDeploymentManifest(
  input: DeploymentManifest,
  observedChainId: number,
): DeploymentManifest {
  const m = structuredClone(input);
  requireCondition(
    m.interfaceVersion === '1.0',
    'Unsupported interface version',
  );
  requireCondition(
    ['LOCAL', 'SEPOLIA', 'FORK'].includes(m.environment),
    'Unsupported environment',
  );
  requireCondition(
    m.chainId === observedChainId &&
      m.chainId === (m.environment === 'SEPOLIA' ? 11155111 : 31337),
    'Deployment chain mismatch',
  );
  requireCondition(
    /^[0-9a-f]{40}$/.test(m.sourceCommit),
    'Expected full source commit',
  );
  requireCondition(
    /^(0|[1-9][0-9]*)$/.test(m.deploymentBlock) &&
      BigInt(m.deploymentBlock) <= (1n << 64n) - 1n,
    'Invalid deployment block',
  );
  requireCondition(
    m.environment === 'FORK' ? m.fork !== undefined : m.fork === undefined,
    'Fork provenance mismatch',
  );
  if (m.fork) {
    requireCondition(
      m.fork.sourceChainId === 1 &&
        /^[1-9][0-9]*$/.test(m.fork.blockNumber) &&
        BigInt(m.fork.blockNumber) <= (1n << 64n) - 1n &&
        /^0x[0-9a-f]{64}$/.test(m.fork.blockHash) &&
        BigInt(m.fork.blockHash) !== 0n,
      'Invalid pinned fork provenance',
    );
  }
  m.market = normalizeAddress(m.market);
  m.registry = normalizeAddress(m.registry);
  m.paymentToken.address = normalizeAddress(m.paymentToken.address);
  requireCondition(
    m.paymentToken.decimals === 6 &&
      m.paymentToken.symbol === 'DemoUSD' &&
      m.paymentToken.isDemo === true,
    'Only simulated DemoUSD settlement supported',
  );
  const addresses = new Set([m.market, m.registry, m.paymentToken.address]);
  requireCondition(addresses.size === 3, 'Contract address collision');
  requireCondition(m.assets.length > 0, 'No assets configured');
  const ids = new Set<string>();
  for (const asset of m.assets) {
    asset.token = normalizeAddress(asset.token);
    asset.adapter = normalizeAddress(asset.adapter);
    requireCondition(
      !addresses.has(asset.token),
      'Duplicate/colliding asset token',
    );
    requireCondition(
      asset.adapter !== asset.token && !addresses.has(asset.adapter),
      'Adapter collides with custody/token',
    );
    requireCondition(
      asset.tokenDecimals === 18 && typeof asset.isDemo === 'boolean',
      'Unsupported asset mechanism',
    );
    requireCondition(
      m.environment === 'FORK' || asset.isDemo === true,
      'Live backing forbidden outside isolated fork',
    );
    requireCondition(
      /^[A-Za-z][A-Za-z0-9]{1,31}$/.test(asset.symbol),
      'Invalid symbol',
    );
    requireCondition(
      asset.assetId === deriveAssetId(m.chainId, asset.token) &&
        !ids.has(asset.assetId),
      'Asset identity mismatch',
    );
    addresses.add(asset.token);
    ids.add(asset.assetId);
  }
  requireCondition(
    m.assets.every((a) => !addresses.has(a.adapter)),
    'Adapter collides with another asset',
  );
  return m;
}
