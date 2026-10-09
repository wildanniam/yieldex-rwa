import { describe, expect, it } from 'vitest';
import {
  deriveAssetId,
  normalizeAddress,
  validateDeploymentManifest,
  type DeploymentManifest,
} from './deployment';
const addr = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
function manifest(): DeploymentManifest {
  return {
    interfaceVersion: '1.0',
    environment: 'SEPOLIA',
    chainId: 11155111,
    market: addr(1),
    registry: addr(2),
    paymentToken: {
      address: addr(3),
      decimals: 6,
      symbol: 'DemoUSD',
      isDemo: true,
    },
    sourceCommit: 'a'.repeat(40),
    deploymentBlock: '10',
    assets: [4, 5, 6].map((n) => ({
      assetId: deriveAssetId(11155111, addr(n)),
      token: addr(n),
      adapter: addr(7),
      symbol: `demoAsset${n}`,
      tokenDecimals: 18,
      isDemo: true,
    })),
  };
}
describe('deployment environment boundary', () => {
  it('accepts distinct demo assets and shared stateless adapter without mutating input', () => {
    const m = manifest();
    expect(validateDeploymentManifest(m, 11155111)).toEqual(m);
    expect(validateDeploymentManifest(m, 11155111)).not.toBe(m);
  });
  it.each([1, 8453, 42161, 31337])(
    'rejects RPC chain %i for Sepolia',
    (chain) =>
      expect(() => validateDeploymentManifest(manifest(), chain)).toThrow(
        'chain',
      ),
  );
  it('binds asset identity to chain, not symbol', () =>
    expect(deriveAssetId(1, addr(4))).not.toBe(
      deriveAssetId(11155111, addr(4)),
    ));
  it.each([addr(0), '0x123', '0x52908400098527886E0F7030069857D2e4169EE7'])(
    'rejects malformed/zero/checksum address %s',
    (input) => expect(() => normalizeAddress(input)).toThrow(),
  );
  it('normalizes valid checksum after validating', () =>
    expect(normalizeAddress('0x52908400098527886E0F7030069857D2E4169EE7')).toBe(
      '0x52908400098527886e0f7030069857d2e4169ee7',
    ));
  it.each([
    'duplicate',
    'identity',
    'live',
    'payment',
    'adapter',
    'block',
    'commit',
    'decimals',
  ])('rejects unsafe %s manifest', (kind) => {
    const m = manifest();
    if (kind === 'duplicate') m.assets[1] = { ...m.assets[0]! };
    if (kind === 'identity') m.assets[0]!.assetId = '0x' + '0'.repeat(64);
    if (kind === 'live') m.assets[0]!.isDemo = false;
    if (kind === 'payment') m.paymentToken.address = m.market;
    if (kind === 'adapter') m.assets[0]!.adapter = m.assets[2]!.token;
    if (kind === 'block') m.deploymentBlock = '-1';
    if (kind === 'commit') m.sourceCommit = 'latest';
    if (kind === 'decimals')
      (m.assets[0] as { tokenDecimals: number }).tokenDecimals = 6;
    expect(() => validateDeploymentManifest(m, 11155111)).toThrow();
  });
  it('requires pinned fork provenance and local chain even for official assets', () => {
    const m = manifest();
    m.environment = 'FORK';
    m.chainId = 31337;
    m.assets = m.assets.map((a) => ({
      ...a,
      isDemo: false,
      assetId: deriveAssetId(31337, a.token),
    }));
    expect(() => validateDeploymentManifest(m, 31337)).toThrow('provenance');
    m.fork = {
      sourceChainId: 1,
      blockNumber: '26145883',
      blockHash: '0x' + 'a'.repeat(64),
    };
    expect(validateDeploymentManifest(m, 31337).environment).toBe('FORK');
    expect(() => validateDeploymentManifest(m, 1)).toThrow();
  });
});
