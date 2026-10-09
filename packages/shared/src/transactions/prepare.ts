import {
  BaseError,
  ContractFunctionRevertedError,
  RawContractError,
  RpcRequestError,
  ExecutionRevertedError,
  decodeErrorResult,
  encodeFunctionData,
  erc20Abi,
  type Address,
  type Hex,
} from 'viem';
import { implementationAbis as abi } from '../generated/abis';
import { ChainReader } from '../chain/reader';
import { normalizeAddress } from '../config/deployment';
import { validateData } from '../validation';
import type {
  Asset,
  ChainSnapshot,
  PrepareIntentRequest,
  PreparedIntent,
  PreparedStep,
  Position,
  TokenRef,
} from '../generated/types';

export class PreparationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
/** Extract only recognized, bounded contract errors. Never surface RPC URLs/data. */
export function revertCode(error: unknown): string | null {
  if (!(error instanceof BaseError)) return null;
  const revert = error.walk(
    (e) =>
      e instanceof ContractFunctionRevertedError ||
      e instanceof RawContractError,
  );
  if (revert instanceof ContractFunctionRevertedError)
    return revert.data?.errorName ?? 'SIMULATION_REVERTED';
  if (revert instanceof RawContractError) {
    try {
      return decodeErrorResult({
        abi: abi.IncomeRightsMarket,
        data: revert.data as Hex,
      }).errorName;
    } catch {
      return 'SIMULATION_REVERTED';
    }
  }
  const rpc = error.walk((e) => e instanceof RpcRequestError);
  if (
    rpc instanceof RpcRequestError &&
    rpc.code === 3 &&
    typeof rpc.data === 'string' &&
    /^0x[0-9a-fA-F]+$/.test(rpc.data)
  ) {
    try {
      return decodeErrorResult({
        abi: abi.IncomeRightsMarket,
        data: rpc.data as Hex,
      }).errorName;
    } catch {
      return 'SIMULATION_REVERTED';
    }
  }
  if (
    error.walk((e) => e instanceof ExecutionRevertedError) instanceof
    ExecutionRevertedError
  )
    return 'SIMULATION_REVERTED';
  return null;
}
export function boundEntity(
  key: string,
  chainId: number,
  contract: string,
): string {
  const parts = key.split(':');
  if (
    parts.length !== 4 ||
    parts[0] !== 'eip155' ||
    parts[1] !== String(chainId) ||
    normalizeAddress(parts[2]!) !== contract
  )
    throw new PreparationError('UNSUPPORTED_DEPLOYMENT');
  return parts[3]!;
}
async function listingBlock(reader: ChainReader, id: bigint, s: ChainSnapshot) {
  const event = abi.IncomeRightsMarket.find(
    (x) => x.type === 'event' && x.name === 'ListingCreated',
  )!;
  const end = BigInt(s.blockNumber);
  // Bounded requests; no fabricated creation block when public indexing is behind.
  for (
    let from = BigInt(reader.manifest.deploymentBlock);
    from <= end;
    from += 5000n
  ) {
    const to = from + 4999n > end ? end : from + 4999n;
    const logs = await reader.client.getLogs({
      address: reader.manifest.market as Address,
      event,
      args: { listingId: id },
      fromBlock: from,
      toBlock: to,
      strict: true,
    });
    if (logs.length) {
      const log = logs[0]!;
      if (logs.length !== 1 || log.removed)
        throw new PreparationError('CHAIN_CONFLICT');
      const block = await reader.client.getBlock({
        blockNumber: log.blockNumber,
      });
      if (block.hash !== log.blockHash)
        throw new PreparationError('CHAIN_CONFLICT');
      return log.blockNumber;
    }
  }
  throw new PreparationError('LISTING_NOT_FOUND');
}
export async function readListingAt(
  reader: ChainReader,
  id: bigint,
  snapshot: ChainSnapshot,
) {
  return reader.listing(id, await listingBlock(reader, id, snapshot), snapshot);
}

/** Browser-safe canonical builder. IDs supplied by caller; no wallet writes, DB or signing key.
 * All chain reads and eth_call use one pinned latest block. A successful simulation is not a receipt.
 */
export async function prepareTransaction(
  reader: ChainReader,
  input: unknown,
  wallet: string,
  ids: { intentId: string; stepId: string },
): Promise<PreparedIntent> {
  if (!validateData('api.PrepareIntentRequest', input).success)
    throw new PreparationError('VALIDATION_ERROR');
  const request = input as PrepareIntentRequest,
    m = reader.manifest,
    from = normalizeAddress(wallet),
    s = await reader.snapshot('latest'),
    blockNumber = BigInt(s.blockNumber),
    now = s.blockTimestamp;
  if (m.chainId !== 31337 && m.chainId !== 11155111)
    throw new PreparationError('UNSUPPORTED_DEPLOYMENT');
  const market = m.market as Address;
  const intent: PreparedIntent = {
    intentId: ids.intentId,
    request,
    walletAddress: from,
    chainId: m.chainId,
    marketAddress: market,
    createdAt: now,
    expiresAt: now + 120,
    state: 'BLOCKED',
    blockers: [],
    preparedAtSnapshot: s,
    expectedTermsHash: null,
    expectedAssetHeadHash: null,
    maxPriceAtomic: null,
    deadline: now + 120,
    maxEvents: 'maxEvents' in request ? request.maxEvents : 32,
    steps: [],
    purchaseSummary: null,
    pendingEventCount: '0',
    simulation: 'FAILED',
    disclosures: [
      'Simulasi pada satu blok; kondisi bisa berubah sebelum transaksi masuk.',
      'Token demo tidak mewakili saham nyata. Approval bukan pembelian; lakukan preview baru sesudah approval.',
    ],
  };
  let data: Hex = '0x',
    functionName: PreparedStep['functionName'] = 'approve',
    approval: { token: TokenRef; amount: bigint } | undefined;
  try {
    let asset: Asset | undefined, position: Position | undefined;
    if ('assetKey' in request) {
      const id = boundEntity(request.assetKey, m.chainId, m.registry);
      if (!m.assets.some((a) => a.assetId === id))
        throw new PreparationError('UNSUPPORTED_ASSET');
      asset = await reader.asset(id, s);
    }
    if ('positionKey' in request) {
      const id = boundEntity(request.positionKey, m.chainId, m.market);
      position = await reader.position(BigInt(id), s);
      asset = await reader.asset(position.assetKey.split(':').at(-1)!, s);
      if (
        request.action === 'SETTLE_POSITION' ||
        request.action === 'RELEASE_PRINCIPAL'
      ) {
        const boundary =
          position.storedState === 'CANCELLED'
            ? position.cancelledAt
            : position.endAt;
        if (boundary !== null && asset.finalizedThrough < boundary)
          throw new PreparationError('FinalityCoverageRequired');
      }
    }
    if (
      request.action === 'BUY_LISTING' ||
      request.action === 'CANCEL_LISTING'
    ) {
      const id = BigInt(boundEntity(request.listingKey, m.chainId, m.market));
      // Resolve existence first so absent IDs fail without scanning the deployment log range.
      await reader.client.readContract({
        address: market,
        abi: abi.IncomeRightsMarket,
        functionName: 'getListing',
        args: [id],
        blockNumber,
      });
      const detail = await reader.listing(
        id,
        await listingBlock(reader, id, s),
        s,
      );
      position = detail.position;
      asset = detail.asset;
      if (request.action === 'BUY_LISTING') {
        intent.purchaseSummary = detail;
        intent.expectedTermsHash = detail.listing.termsHash;
        intent.expectedAssetHeadHash = asset.assetHeadHash;
        intent.maxPriceAtomic = detail.listing.priceAtomic;
        intent.deadline = Math.min(
          now + 120,
          detail.listing.expiresAt - 1,
          ...(detail.listing.kind === 'SECONDARY' ? [position.endAt! - 1] : []),
        );
        intent.expiresAt = intent.deadline;
        if (detail.listing.displayStatus !== 'OPEN')
          throw new PreparationError('LISTING_UNAVAILABLE');
        if (detail.listing.seller === from)
          throw new PreparationError('SelfPurchase');
        if (intent.deadline <= now)
          throw new PreparationError('INTENT_EXPIRED');
        functionName = 'buyListing';
        data = encodeFunctionData({
          abi: abi.IncomeRightsMarket,
          functionName,
          args: [
            {
              listingId: id,
              expectedTermsHash: detail.listing.termsHash as Hex,
              expectedAssetHeadHash: asset.assetHeadHash as Hex,
              maxPriceAtomic: BigInt(detail.listing.priceAtomic),
              deadline: BigInt(intent.deadline),
              maxEvents: 32,
            },
          ],
        });
        approval = {
          token: reader.paymentToken(),
          amount: BigInt(detail.listing.priceAtomic),
        };
      } else {
        functionName = 'cancelListing';
        data = encodeFunctionData({
          abi: abi.IncomeRightsMarket,
          functionName,
          args: [id],
        });
      }
    } else if (request.action === 'CREATE_PRIMARY_LISTING') {
      if (!asset!.newPositionsEnabled)
        throw new PreparationError('AssetIntakeDisabled');
      if (
        request.listingExpiresAt < now + 60 ||
        request.listingExpiresAt > now + 2592000
      )
        throw new PreparationError('InvalidDeadline');
      functionName = 'createPrimaryListing';
      data = encodeFunctionData({
        abi: abi.IncomeRightsMarket,
        functionName,
        args: [
          {
            assetId: asset!.assetId as Hex,
            depositTokenAmountAtomic: BigInt(request.depositTokenAmountAtomic),
            minReceivedShares: BigInt(request.minReceivedShares),
            incomeBps: request.incomeBps,
            durationSeconds: BigInt(request.durationSeconds),
            priceAtomic: BigInt(request.priceAtomic),
            listingExpiresAt: BigInt(request.listingExpiresAt),
          },
        ],
      });
      approval = {
        token: asset!.token,
        amount: BigInt(request.depositTokenAmountAtomic),
      };
    } else if (request.action === 'CLAIM_INCOME') {
      functionName = 'claimIncome';
      data = encodeFunctionData({
        abi: abi.IncomeRightsMarket,
        functionName,
        args: [asset!.assetId as Hex, BigInt(request.shares)],
      });
    } else if (
      request.action === 'CREATE_SECONDARY_LISTING' ||
      request.action === 'RELIST_PRIMARY_POSITION'
    ) {
      functionName =
        request.action === 'CREATE_SECONDARY_LISTING'
          ? 'createSecondaryListing'
          : 'relistPrimaryPosition';
      data = encodeFunctionData({
        abi: abi.IncomeRightsMarket,
        functionName,
        args: [
          BigInt(position!.positionId),
          BigInt(request.priceAtomic),
          BigInt(request.listingExpiresAt),
        ],
      });
    } else {
      functionName =
        request.action === 'CHECKPOINT_POSITION'
          ? 'checkpointPosition'
          : request.action === 'SETTLE_POSITION'
            ? 'settlePosition'
            : 'releasePrincipal';
      data = encodeFunctionData({
        abi: abi.IncomeRightsMarket,
        functionName,
        args: [BigInt(position!.positionId), intent.maxEvents],
      });
    }
    if (
      asset?.syncStatus === 'ADAPTER_UNAVAILABLE' &&
      request.action !== 'CANCEL_LISTING'
    )
      throw new PreparationError('ADAPTER_UNAVAILABLE');
    if (position && asset)
      intent.pendingEventCount = (
        BigInt(asset.eventCount) - BigInt(position.eventCursor)
      ).toString();
    const base: PreparedStep = {
      stepId: ids.stepId,
      kind: 'ACTION',
      chainId: m.chainId,
      from,
      to: market,
      valueAtomic: '0',
      data,
      functionName,
      allowanceToken: null,
      allowanceSpender: null,
      allowanceAmountAtomic: null,
    };
    if (approval) {
      if (asset!.safetyState !== 'NORMAL')
        throw new PreparationError('AssetQuarantined');
      if (asset!.syncStatus !== 'SYNCED')
        throw new PreparationError('AssetNotSynchronized');
      if (
        request.action === 'BUY_LISTING' &&
        BigInt(intent.pendingEventCount) > 32n
      )
        throw new PreparationError('CheckpointRequired');
      const token = approval.token.address as Address;
      const [balance, allowance] = await Promise.all([
        reader.client.readContract({
          address: token,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [from],
          blockNumber,
        }),
        reader.client.readContract({
          address: token,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [from, market],
          blockNumber,
        }),
      ]);
      if (balance < approval.amount)
        throw new PreparationError('INSUFFICIENT_BALANCE');
      if (allowance < approval.amount) {
        base.kind = 'APPROVAL';
        base.to = token;
        base.functionName = 'approve';
        base.data = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [market, approval.amount],
        });
        base.allowanceToken = approval.token;
        base.allowanceSpender = market;
        base.allowanceAmountAtomic = approval.amount.toString();
        await reader.client.call({
          account: from,
          to: token,
          data: base.data as Hex,
          value: 0n,
          blockNumber,
        });
        intent.state = 'NEEDS_APPROVAL';
        intent.simulation = 'APPROVAL_REQUIRED';
        intent.steps = [base];
      }
    }
    if (intent.state !== 'NEEDS_APPROVAL') {
      await reader.client.call({
        account: from,
        to: market,
        data,
        value: 0n,
        blockNumber,
      });
      intent.state = 'READY';
      intent.simulation = 'PASSED';
      intent.steps = [base];
    }
  } catch (error) {
    const code =
      error instanceof PreparationError ? error.code : revertCode(error);
    if (!code) throw error;
    intent.state = 'BLOCKED';
    intent.blockers = [code];
    intent.steps = [];
    intent.simulation = 'FAILED';
    // An expired listing can predate this request; keep timestamps valid without making it executable.
    intent.deadline = Math.max(now, intent.deadline);
    intent.expiresAt = intent.deadline;
  }
  const canonical = await reader.client.getBlock({ blockNumber });
  if (canonical.hash !== s.blockHash)
    throw new PreparationError('CHAIN_CONFLICT');
  if (!validateData('api.PreparedIntent', intent).success)
    throw new Error('Prepared intent violated canonical schema');
  return intent;
}
