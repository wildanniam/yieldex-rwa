import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import {
  ContractFunctionZeroDataError,
  HttpRequestError,
  encodeAbiParameters,
  keccak256,
  type PublicClient,
  type Hex,
} from 'viem';
import { ChainReader } from './reader';
import { deriveAssetId, type DeploymentManifest } from '../config/deployment';
import { implementationAbis as abi } from '../generated/abis';
import type { Asset } from '../generated/types';
import { prepareTransaction } from '../transactions/prepare';
const fixture: Asset = JSON.parse(
  readFileSync(
    new URL('../../../../examples/asset.valid.json', import.meta.url),
    'utf8',
  ),
);
const snap = {
  multiplier: 10n ** 18n,
  issuerNonce: 0n,
  pendingMultiplier: 0n,
  pendingIssuerNonce: 0n,
  pendingActivationAt: 0n,
  historyLength: 1n,
  latestHistoryEntryHash: ('0x' + '11'.repeat(32)) as Hex,
  feePerPeriod: 0n,
  periodLength: 86400n,
  tokenRuntimeCodeHash: ('0x' + '22'.repeat(32)) as Hex,
} as const;
function setup(fault: unknown = null, brokenRegistry = false) {
  const id = deriveAssetId(fixture.token.chainId, fixture.token.address!);
  const manifest: DeploymentManifest = {
    interfaceVersion: '1.0',
    environment: 'SEPOLIA',
    chainId: 11155111,
    market: '0x' + '33'.repeat(20),
    registry: fixture.registryAddress,
    paymentToken: {
      address: '0x' + '44'.repeat(20),
      symbol: 'DemoUSD',
      decimals: 6,
      isDemo: true,
    },
    deploymentBlock: '1',
    sourceCommit: '1'.repeat(40),
    assets: [
      {
        assetId: id,
        token: fixture.token.address!,
        adapter: fixture.adapterAddress,
        symbol: fixture.token.symbol,
        tokenDecimals: 18,
        isDemo: true,
      },
    ],
  };
  const readContract = vi.fn(async (p: { functionName: string }) => {
    if (p.functionName === 'getAsset') {
      if (brokenRegistry) throw fault;
      return {
        assetId: id,
        token: fixture.token.address,
        adapter: fixture.adapterAddress,
        tokenDecimals: 18,
        newPositionsEnabled: true,
        safetyState: 0,
      };
    }
    if (p.functionName === 'getAssetHead')
      return {
        eventCount: 0n,
        finalizedThrough: 0n,
        assetHeadHash: '0x' + '11'.repeat(32),
        acknowledgedSnapshotHash: keccak256(
          encodeAbiParameters(
            abi.XStocksAdapter.find(
              (x) => x.type === 'function' && x.name === 'readSnapshot',
            )!.outputs,
            [snap],
          ),
        ),
      };
    if (p.functionName === 'finalityConflict') return false;
    if (p.functionName === 'readSnapshot') {
      if (fault) throw fault;
      return snap;
    }
    if (p.functionName === 'getPosition')
      return {
        assetId: id,
        principalOwner: '0x' + '55'.repeat(20),
        rightsOwner: '0x' + '00'.repeat(20),
        principalShares: 100n,
        incomeBps: 5000,
        durationSeconds: 2592000n,
        createdAt: 1791417000n,
        cancelledAt: 0n,
        currentListingId: 1n,
        startAt: 0n,
        endAt: 0n,
        activationEventCursor: 0n,
        eventCursor: 0n,
        state: 0,
      };
    if (p.functionName === 'getListing')
      return {
        positionId: 1n,
        kind: 0,
        state: 0,
        seller: '0x' + '55'.repeat(20),
        paymentToken: manifest.paymentToken.address,
        priceAtomic: 1000000n,
        createdAt: 1791417000n,
        expiresAt: 1792022400n,
        termsHash: '0x' + '88'.repeat(32),
      };
    if (p.functionName === 'claimShares') return 7n;
    throw Error('Unexpected read');
  });
  const client = {
    readContract,
    getBlock: vi.fn(async () => ({
      hash: fixture.snapshot.blockHash,
      number: BigInt(fixture.snapshot.blockNumber),
      timestamp: BigInt(fixture.snapshot.blockTimestamp),
    })),
    call: vi.fn(),
  } as unknown as PublicClient;
  return { reader: new ChainReader(client, manifest), id, client };
}
describe('asset-local adapter failure boundary', () => {
  it('preserves registry facts and claim shares without fabricating conversions, then recovers', async () => {
    const { reader, id } = setup(
      new ContractFunctionZeroDataError({ functionName: 'readSnapshot' }),
    );
    const a = await reader.asset(id, fixture.snapshot);
    expect(a.syncStatus).toBe('ADAPTER_UNAVAILABLE');
    expect(a.safetyState).toBe('NORMAL');
    expect(a.currentMultiplier).toBeNull();
    expect(a.currentNonce).toBeNull();
    const claim = await reader.claim(
      id,
      '0x' + '55'.repeat(20),
      fixture.snapshot,
    );
    expect(claim.claimShares).toBe('7');
    expect(claim.claimTokenAmountAtomic).toBeNull();
    const healthy = setup();
    expect(
      (await healthy.reader.asset(healthy.id, fixture.snapshot)).syncStatus,
    ).toBe('SYNCED');
  });
  it('does not swallow RPC transport failures', async () => {
    const error = new HttpRequestError({
      url: 'http://127.0.0.1',
      details: 'controlled timeout',
    });
    const { reader, id } = setup(error);
    await expect(reader.asset(id, fixture.snapshot)).rejects.toBe(error);
  });
  it('does not turn registry errors into unavailable adapter values', async () => {
    const error = new ContractFunctionZeroDataError({
      functionName: 'getAsset',
    });
    const { reader, id } = setup(error, true);
    await expect(reader.asset(id, fixture.snapshot)).rejects.toBe(error);
  });
  it('blocks an unavailable-asset claim before wallet simulation', async () => {
    const { reader, id, client } = setup(
      new ContractFunctionZeroDataError({ functionName: 'readSnapshot' }),
    );
    const intent = await prepareTransaction(
      reader,
      {
        action: 'CLAIM_INCOME',
        assetKey: `eip155:11155111:${reader.manifest.registry}:${id}`,
        shares: '1',
      },
      '0x' + '55'.repeat(20),
      {
        intentId: '11111111-1111-4111-8111-111111111111',
        stepId: '22222222-2222-4222-8222-222222222222',
      },
    );
    expect(intent.state).toBe('BLOCKED');
    expect(intent.blockers).toEqual(['ADAPTER_UNAVAILABLE']);
    expect(client.call).not.toHaveBeenCalled();
  });
});

describe('listing snapshot reuse', () => {
  it('returns identical values with eight fewer RPC reads per listing', async () => {
    const { reader, id, client } = setup();
    const a = await reader.asset(id, fixture.snapshot);
    const rpc = vi.mocked(client.readContract);
    rpc.mockClear();
    const baseline = await reader.listing(1n, 1n, fixture.snapshot);
    expect(rpc).toHaveBeenCalledTimes(11);
    rpc.mockClear();
    const reused = await reader.listing(
      1n,
      1n,
      fixture.snapshot,
      new Map([[id, a]]),
    );
    expect(reused).toEqual(baseline);
    expect(rpc).toHaveBeenCalledTimes(3);
  });
  it('rejects assets from another block instead of mixing snapshots', async () => {
    const { reader, id } = setup();
    const a = await reader.asset(id, fixture.snapshot);
    a.snapshot = { ...a.snapshot, blockHash: '0x' + '99'.repeat(32) };
    await expect(
      reader.listing(1n, 1n, fixture.snapshot, new Map([[id, a]])),
    ).rejects.toThrow('Mixed asset snapshot');
  });
});
