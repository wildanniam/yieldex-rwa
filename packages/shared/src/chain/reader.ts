import {
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  AbiDecodingDataSizeInvalidError,
  AbiDecodingDataSizeTooSmallError,
  AbiDecodingZeroDataError,
  encodeAbiParameters,
  keccak256,
  zeroAddress,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import { implementationAbis as abi } from '../generated/abis';
import {
  normalizeAddress,
  validateDeploymentManifest,
  type DeploymentManifest,
} from '../config/deployment';
import type {
  Asset,
  Position,
  Listing,
  ClaimBalance,
  ChainSnapshot,
  ListingDetail,
  TokenRef,
} from '../generated/types';
import { validateData, type SchemaName } from '../validation';

const scale = 10n ** 18n;
const positionStates = [
  'OFFERED',
  'ACTIVE',
  'SETTLED',
  'CANCELLED',
  'RELEASED',
] as const;
const listingStates = ['OPEN', 'FILLED', 'CANCELLED'] as const;
const safetyStates = [
  'NORMAL',
  'ACCOUNTING_QUARANTINED',
  'TRANSFER_QUARANTINED',
] as const;
const snapshotComponents = abi.XStocksAdapter.find(
  (x) => x.type === 'function' && x.name === 'readSnapshot',
)!.outputs;
export const entityKey = (chain: number, contract: string, id: string) =>
  `eip155:${chain}:${contract}:${id}`;
export function safeTimestamp(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('Unsafe timestamp');
  return Number(value);
}
function checked<T>(schema: SchemaName, value: T): T {
  if (!validateData(schema, value).success)
    throw new Error(`Invalid chain DTO: ${schema}`);
  return value;
}
/** Pinned-block reader shared by indexer, action preview and receipt overlays.
 * No database fallback, wallet, signing key or latest fallback exists here.
 */
export class ChainReader {
  constructor(
    readonly client: PublicClient,
    readonly manifest: DeploymentManifest,
  ) {}
  async verify() {
    validateDeploymentManifest(this.manifest, await this.client.getChainId());
    const m = this.manifest;
    for (const address of new Set([
      m.market,
      m.registry,
      m.paymentToken.address,
    ])) {
      const code = await this.client.getCode({ address: address as Address });
      if (!code || code === '0x')
        throw new Error('Deployment has missing code');
    }
    const registry = await this.client.readContract({
      address: m.market as Address,
      abi: abi.IncomeRightsMarket,
      functionName: 'registry',
    });
    const payment = await this.client.readContract({
      address: m.market as Address,
      abi: abi.IncomeRightsMarket,
      functionName: 'paymentToken',
    });
    if (
      registry.toLowerCase() !== m.registry ||
      payment.toLowerCase() !== m.paymentToken.address
    )
      throw new Error('Deployment configuration mismatch');
  }
  async snapshot(
    tag: 'finalized' | 'latest' | bigint,
    now = Math.floor(Date.now() / 1000),
  ): Promise<ChainSnapshot> {
    const b = await this.client.getBlock(
      typeof tag === 'bigint' ? { blockNumber: tag } : { blockTag: tag },
    );
    if (!b.hash || b.number === null)
      throw new Error('Missing canonical block');
    return checked('domain.ChainSnapshot', {
      chainId: this.manifest.chainId,
      blockNumber: b.number.toString(),
      blockHash: b.hash.toLowerCase(),
      blockTimestamp: safeTimestamp(b.timestamp),
      observedAt: now,
      finality:
        tag === 'finalized'
          ? 'FINALIZED'
          : typeof tag === 'bigint'
            ? 'CONFIRMED'
            : 'LATEST',
      indexerStatus:
        now - safeTimestamp(b.timestamp) > 1800 ? 'LAGGING' : 'HEALTHY',
    });
  }
  paymentToken(): TokenRef {
    const p = this.manifest.paymentToken;
    return {
      chainId: this.manifest.chainId,
      kind: 'ERC20',
      address: p.address,
      name: 'Simulated USD',
      symbol: p.symbol,
      decimals: p.decimals,
      isDemo: true,
    };
  }
  async asset(id: string, snapshot: ChainSnapshot): Promise<Asset> {
    this.assertSnapshot(snapshot);
    const m = this.manifest,
      entry = m.assets.find((a) => a.assetId === id);
    if (!entry) throw new Error('Unsupported asset');
    const blockNumber = BigInt(snapshot.blockNumber);
    const [a, h, conflict] = await Promise.all([
      this.client.readContract({
        address: m.registry as Address,
        abi: abi.CorporateActionRegistry,
        functionName: 'getAsset',
        args: [id as Hex],
        blockNumber,
      }),
      this.client.readContract({
        address: m.registry as Address,
        abi: abi.CorporateActionRegistry,
        functionName: 'getAssetHead',
        args: [id as Hex],
        blockNumber,
      }),
      this.client.readContract({
        address: m.registry as Address,
        abi: abi.CorporateActionRegistry,
        functionName: 'finalityConflict',
        args: [id as Hex],
        blockNumber,
      }),
    ]);
    if (
      a.assetId !== id ||
      a.token.toLowerCase() !== entry.token ||
      a.adapter.toLowerCase() !== entry.adapter ||
      a.tokenDecimals !== entry.tokenDecimals
    )
      throw new Error('Asset manifest mismatch');
    // Only deterministic contract/ABI failures are local to this asset. A network,
    // registry or canonical-block failure must still abort the complete read.
    const s = await this.client
      .readContract({
        address: entry.adapter as Address,
        abi: abi.XStocksAdapter,
        functionName: 'readSnapshot',
        args: [entry.token as Address],
        blockNumber,
      })
      .catch((error: unknown) => {
        if (error instanceof BaseError) {
          const cause = error.walk(
            (e) =>
              e instanceof ContractFunctionRevertedError ||
              e instanceof ContractFunctionZeroDataError ||
              e instanceof AbiDecodingZeroDataError ||
              e instanceof AbiDecodingDataSizeTooSmallError ||
              e instanceof AbiDecodingDataSizeInvalidError,
          );
          if (
            cause instanceof ContractFunctionRevertedError ||
            cause instanceof ContractFunctionZeroDataError ||
            cause instanceof AbiDecodingZeroDataError ||
            cause instanceof AbiDecodingDataSizeTooSmallError ||
            cause instanceof AbiDecodingDataSizeInvalidError
          )
            return null;
        }
        throw error;
      });
    const synchronized =
      s !== null &&
      keccak256(encodeAbiParameters(snapshotComponents, [s])) ===
        h.acknowledgedSnapshotHash;
    const safetyState = safetyStates[a.safetyState];
    if (!safetyState) throw new Error('Unknown safety state');
    return checked('domain.Asset', {
      assetKey: entityKey(m.chainId, m.registry, id),
      assetId: id,
      registryAddress: m.registry,
      token: {
        chainId: m.chainId,
        kind: 'ERC20',
        address: entry.token,
        name: entry.symbol,
        symbol: entry.symbol,
        decimals: entry.tokenDecimals,
        isDemo: entry.isDemo,
      },
      adapterAddress: entry.adapter,
      newPositionsEnabled: a.newPositionsEnabled,
      safetyState,
      syncStatus:
        s === null
          ? 'ADAPTER_UNAVAILABLE'
          : safetyState === 'NORMAL'
            ? synchronized
              ? 'SYNCED'
              : 'DATA_STALE'
            : safetyState,
      assetHeadHash: h.assetHeadHash,
      currentMultiplier: s?.multiplier.toString() ?? null,
      multiplierScale: scale.toString(),
      currentNonce: s?.issuerNonce.toString() ?? null,
      eventCount: h.eventCount.toString(),
      finalizedThrough: safeTimestamp(h.finalizedThrough),
      metadataStatus: conflict
        ? 'CONFLICT'
        : s === null
          ? 'SOURCE_UNAVAILABLE'
          : synchronized
            ? 'SYNCED'
            : 'AWAITING_CLASSIFICATION',
      snapshot,
    });
  }
  async position(
    id: bigint,
    snapshot: ChainSnapshot,
    asset?: Asset,
  ): Promise<Position> {
    this.assertSnapshot(snapshot);
    const m = this.manifest,
      blockNumber = BigInt(snapshot.blockNumber);
    const p = await this.client.readContract({
      address: m.market as Address,
      abi: abi.IncomeRightsMarket,
      functionName: 'getPosition',
      args: [id],
      blockNumber,
    });
    const a = asset ?? (await this.asset(p.assetId, snapshot));
    if (a.assetId !== p.assetId || a.snapshot.blockHash !== snapshot.blockHash)
      throw new Error('Mixed asset snapshot');
    if (
      p.eventCursor < p.activationEventCursor ||
      p.eventCursor > BigInt(a.eventCount)
    )
      throw new Error('Invalid event cursor');
    const storedState = positionStates[p.state];
    if (!storedState) throw new Error('Unknown position state');
    const active = p.rightsOwner !== zeroAddress;
    if (
      active
        ? p.endAt !== p.startAt + p.durationSeconds || p.startAt === 0n
        : p.startAt !== 0n || p.endAt !== 0n
    )
      throw new Error('Invalid lifecycle');
    const l = await this.client.readContract({
      address: m.market as Address,
      abi: abi.IncomeRightsMarket,
      functionName: 'getListing',
      args: [p.currentListingId],
      blockNumber,
    });
    const live =
      l.state === 0 &&
      l.expiresAt > BigInt(snapshot.blockTimestamp) &&
      (l.kind === 0
        ? p.state === 0 && l.seller === p.principalOwner
        : p.state === 1 &&
          l.seller === p.rightsOwner &&
          p.endAt > BigInt(snapshot.blockTimestamp));
    return checked('domain.Position', {
      positionKey: entityKey(m.chainId, m.market, id.toString()),
      positionId: id.toString(),
      marketAddress: m.market,
      assetKey: a.assetKey,
      principalOwner: p.principalOwner.toLowerCase(),
      rightsOwner: active ? p.rightsOwner.toLowerCase() : null,
      principalShares: p.principalShares.toString(),
      principalTokenAmountAtomic:
        a.currentMultiplier === null
          ? null
          : (
              (p.principalShares * BigInt(a.currentMultiplier)) /
              scale
            ).toString(),
      incomeBps: p.incomeBps,
      durationSeconds: safeTimestamp(p.durationSeconds),
      createdAt: safeTimestamp(p.createdAt),
      cancelledAt: p.cancelledAt === 0n ? null : safeTimestamp(p.cancelledAt),
      currentListingId: p.currentListingId.toString(),
      startAt: active ? safeTimestamp(p.startAt) : null,
      endAt: active ? safeTimestamp(p.endAt) : null,
      activationEventCursor: p.activationEventCursor.toString(),
      eventCursor: p.eventCursor.toString(),
      storedState,
      displayState:
        storedState === 'ACTIVE' && p.endAt <= BigInt(snapshot.blockTimestamp)
          ? 'SETTLING'
          : storedState,
      activeListingKey: live
        ? entityKey(m.chainId, m.market, p.currentListingId.toString())
        : null,
      snapshot,
    });
  }
  async listing(
    id: bigint,
    createdBlockNumber: bigint,
    snapshot: ChainSnapshot,
  ): Promise<ListingDetail> {
    this.assertSnapshot(snapshot);
    const m = this.manifest;
    const l = await this.client.readContract({
      address: m.market as Address,
      abi: abi.IncomeRightsMarket,
      functionName: 'getListing',
      args: [id],
      blockNumber: BigInt(snapshot.blockNumber),
    });
    const p = await this.position(l.positionId, snapshot);
    const a = await this.asset(p.assetKey.split(':').at(-1)!, snapshot);
    const storedStatus = listingStates[l.state];
    if (
      !storedStatus ||
      l.paymentToken.toLowerCase() !== m.paymentToken.address ||
      createdBlockNumber > BigInt(snapshot.blockNumber)
    )
      throw new Error('Invalid listing identity');
    const listingKey = entityKey(m.chainId, m.market, id.toString());
    const listing: Listing = checked('domain.Listing', {
      listingKey,
      listingId: id.toString(),
      positionKey: p.positionKey,
      kind: l.kind === 0 ? 'PRIMARY' : 'SECONDARY',
      seller: l.seller.toLowerCase(),
      paymentToken: this.paymentToken(),
      priceAtomic: l.priceAtomic.toString(),
      createdAt: safeTimestamp(l.createdAt),
      expiresAt: safeTimestamp(l.expiresAt),
      storedStatus,
      displayStatus:
        storedStatus !== 'OPEN'
          ? storedStatus
          : l.expiresAt <= BigInt(snapshot.blockTimestamp)
            ? 'EXPIRED'
            : p.activeListingKey !== listingKey
              ? 'INVALID'
              : 'OPEN',
      termsHash: l.termsHash,
      createdBlockNumber: createdBlockNumber.toString(),
      snapshot,
    });
    return checked('domain.ListingDetail', { listing, position: p, asset: a });
  }
  async claim(
    id: string,
    account: string,
    snapshot: ChainSnapshot,
  ): Promise<ClaimBalance> {
    const a = await this.asset(id, snapshot),
      who = normalizeAddress(account),
      m = this.manifest;
    const shares = await this.client.readContract({
      address: m.market as Address,
      abi: abi.IncomeRightsMarket,
      functionName: 'claimShares',
      args: [id as Hex, who],
      blockNumber: BigInt(snapshot.blockNumber),
    });
    return checked('domain.ClaimBalance', {
      assetKey: a.assetKey,
      marketAddress: m.market,
      account: who,
      claimShares: shares.toString(),
      claimTokenAmountAtomic:
        a.currentMultiplier === null
          ? null
          : ((shares * BigInt(a.currentMultiplier)) / scale).toString(),
      snapshot,
    });
  }
  private assertSnapshot(s: ChainSnapshot) {
    if (
      s.chainId !== this.manifest.chainId ||
      !validateData('domain.ChainSnapshot', s).success
    )
      throw new Error('Invalid snapshot context');
  }
}
