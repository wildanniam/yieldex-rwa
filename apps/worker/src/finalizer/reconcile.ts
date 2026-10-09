import {
  encodeAbiParameters,
  keccak256,
  zeroAddress,
  type Address,
  type Hex,
  type ContractFunctionReturnType,
} from 'viem';
import { implementationAbis as abi } from '@rwa/shared/abi';
import { ChainReader } from '@rwa/shared/chain';
import { RegistryOutbox, type RegistryCommand } from './outbox.js';
type Event = ContractFunctionReturnType<
  typeof abi.CorporateActionRegistry,
  'view',
  'getAssetEvent'
>;
/** Trusted operator attestation, never supplied by a browser/model or inferred from HTTP status.
 * Numeric fields are bigint internally; a reviewed file runner must parse decimal strings exactly.
 */
export type ReviewedReport = {
  assetId: Hex;
  sourceKind: 'SIMULATOR' | 'ISSUER_REVIEW';
  evidenceHash: Hex;
  sourceBlockNumber: bigint;
  sourceBlockHash: Hex;
  sourceBlockTimestamp: bigint;
  reviewedThrough: bigint;
  events: readonly Event[];
};
export type AssetPolicy = {
  assetId: Hex;
  tokenRuntimeCodeHash: Hex;
  implementationAddress: Address | null;
};
const slot =
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as Hex;
const snapshotOutputs = abi.XStocksAdapter.find(
  (x) => x.type === 'function' && x.name === 'readSnapshot',
)!.outputs;
function economic(e: Event) {
  return [
    e.eventId,
    e.sequence,
    e.kind,
    e.effectiveAt,
    e.multiplierBefore,
    e.multiplierAfter,
    e.issuerNonceAfter,
    e.historyIndex,
    e.sourceOccurrenceKey,
  ]
    .map(String)
    .join(':');
}
export class ReviewedReconciler {
  constructor(
    private reader: ChainReader,
    private outbox: RegistryOutbox,
    private policy: AssetPolicy,
  ) {}
  async step(
    report: ReviewedReport,
  ): Promise<'PENDING' | 'COMPLETE' | 'HELD' | 'WAITING_SOURCE'> {
    const m = this.reader.manifest,
      a = m.assets.find((x) => x.assetId === report.assetId);
    if (
      !a ||
      report.assetId !== this.policy.assetId ||
      report.events.length > 1000 ||
      !/^0x[0-9a-f]{64}$/.test(report.evidenceHash) ||
      report.evidenceHash === '0x' + '0'.repeat(64) ||
      report.reviewedThrough > report.sourceBlockTimestamp ||
      !['SIMULATOR', 'ISSUER_REVIEW'].includes(report.sourceKind)
    )
      throw new Error('Invalid reviewed report');
    if (report.sourceKind === 'SIMULATOR' && !a.isDemo)
      throw new Error('Simulator report cannot describe a real asset');
    const finalized = await this.reader.client.getBlock({
        blockTag: 'finalized',
      }),
      source = await this.reader.client.getBlock({
        blockNumber: report.sourceBlockNumber,
      });
    if (
      source.hash !== report.sourceBlockHash ||
      source.timestamp !== report.sourceBlockTimestamp
    )
      throw new Error('REVIEW_SOURCE_CONFLICT');
    if (source.number > finalized.number) return 'WAITING_SOURCE';
    // Check proxy implementation slot as well as runtime hash, at both source and latest.
    for (const blockNumber of [source.number, undefined]) {
      const code = await this.reader.client.getCode({
        address: a.token as Address,
        blockNumber,
      });
      const storage = await this.reader.client.getStorageAt({
        address: a.token as Address,
        slot,
        blockNumber,
      });
      const implementation =
        storage && storage !== '0x'
          ? ('0x' + storage.slice(-40)).toLowerCase()
          : zeroAddress;
      if (
        !code ||
        keccak256(code) !== this.policy.tokenRuntimeCodeHash ||
        implementation !==
          (this.policy.implementationAddress ?? zeroAddress).toLowerCase()
      ) {
        await this.publish('configuration:' + report.evidenceHash, {
          kind: 'QUARANTINE',
          assetId: report.assetId,
          state: 2,
          evidenceHash: report.evidenceHash,
        });
        return 'HELD';
      }
    }
    const pending = await this.outbox.drain(report.assetId);
    if (pending !== 'CONFIRMED') return pending;
    // Pin head/live/ACK history to one observation; concurrent workers must
    // derive the same transition identity, even if another ACK is mined later.
    const stateBlock = await this.reader.client.getBlock();
    const head = await this.reader.client.readContract({
      address: m.registry as Address,
      abi: abi.CorporateActionRegistry,
      functionName: 'getAssetHead',
      args: [report.assetId],
      blockNumber: stateBlock.number,
    });
    const conflict = await this.reader.client.readContract({
      address: m.registry as Address,
      abi: abi.CorporateActionRegistry,
      functionName: 'finalityConflict',
      args: [report.assetId],
    });
    if (conflict) return 'HELD';
    const ordered = [...report.events].sort((x, y) =>
        x.sequence < y.sequence ? -1 : x.sequence > y.sequence ? 1 : 0,
      ),
      seen = new Set<string>();
    for (const event of ordered) {
      if (seen.has(event.eventId) || event.sourceRevision < 1)
        throw new Error('Duplicate/invalid reviewed occurrence');
      seen.add(event.eventId);
      const expected = keccak256(
        encodeAbiParameters(
          [{ type: 'uint256' }, { type: 'address' }, { type: 'bytes32' }],
          [BigInt(m.chainId), a.token as Address, event.sourceOccurrenceKey],
        ),
      );
      if (expected !== event.eventId)
        throw new Error('Invalid occurrence identity');
      if (event.sequence <= head.eventCount) {
        const old = await this.reader.client.readContract({
          address: m.registry as Address,
          abi: abi.CorporateActionRegistry,
          functionName: 'getAssetEvent',
          args: [report.assetId, event.sequence],
        });
        if (economic(old) !== economic(event)) {
          await this.publish('conflict:' + report.evidenceHash, {
            kind: 'CONFLICT',
            assetId: report.assetId,
            evidenceHash: report.evidenceHash,
          });
          return 'HELD';
        }
        continue;
      }
      if (event.effectiveAt <= head.finalizedThrough) {
        await this.publish('late-conflict:' + report.evidenceHash, {
          kind: 'CONFLICT',
          assetId: report.assetId,
          evidenceHash: report.evidenceHash,
        });
        return 'HELD';
      }
      if (
        event.sequence !== head.eventCount + 1n ||
        event.effectiveAt > report.reviewedThrough
      )
        return 'WAITING_SOURCE';
      const valid = await this.reader.client.readContract({
        address: a.adapter as Address,
        abi: abi.XStocksAdapter,
        functionName: 'validateEffectiveEvent',
        args: [a.token as Address, event],
        blockNumber: source.number,
      });
      if (!valid) return 'WAITING_SOURCE';
      return this.publish(
        'event:' + event.eventId + ':' + event.sourceRevision,
        { kind: 'APPEND', assetId: report.assetId, events: [event] },
      );
    }
    const snapshot = await this.reader.client.readContract({
      address: a.adapter as Address,
      abi: abi.XStocksAdapter,
      functionName: 'readSnapshot',
      args: [a.token as Address],
      blockNumber: source.number,
    });
    const effectiveIndex =
      snapshot.historyLength - (snapshot.pendingActivationAt === 0n ? 1n : 2n);
    // Missing classifications cannot be papered over by acknowledging the new multiplier.
    if (
      head.consumedHistoryIndex !== effectiveIndex ||
      head.multiplier !== snapshot.multiplier ||
      head.issuerNonce !== snapshot.issuerNonce
    )
      return 'WAITING_SOURCE';
    const live = await this.reader.client.readContract({
      address: a.adapter as Address,
      abi: abi.XStocksAdapter,
      functionName: 'readSnapshot',
      args: [a.token as Address],
      blockNumber: stateBlock.number,
    });
    const hash = keccak256(encodeAbiParameters(snapshotOutputs, [snapshot]));
    if (keccak256(encodeAbiParameters(snapshotOutputs, [live])) !== hash)
      return 'WAITING_SOURCE';
    if (head.acknowledgedSnapshotHash !== hash) {
      // Snapshot contents can recur (A -> B -> A), as can evidence/source files.
      // The preceding onchain ACK occurrence identifies this visit uniquely.
      // Search backwards in bounded RPC ranges; never fall back on a random key.
      let anchor: Hex = ('0x' + '0'.repeat(64)) as Hex;
      const start = BigInt(m.deploymentBlock);
      for (let to = stateBlock.number; to >= start;) {
        const from = to - start >= 1999n ? to - 1999n : start;
        const logs = await this.reader.client.getContractEvents({
          address: m.registry as Address,
          abi: abi.CorporateActionRegistry,
          eventName: 'AssetSnapshotAcknowledged',
          args: { assetId: report.assetId },
          fromBlock: from,
          toBlock: to,
          strict: true,
        });
        const previous = logs.at(-1);
        if (previous) {
          if (previous.args.snapshotHash !== head.acknowledgedSnapshotHash)
            throw new Error('ACK_HISTORY_CONFLICT');
          anchor = keccak256(
            encodeAbiParameters(
              [{ type: 'bytes32' }, { type: 'bytes32' }, { type: 'uint256' }],
              [
                previous.blockHash,
                previous.transactionHash,
                BigInt(previous.logIndex),
              ],
            ),
          );
          break;
        }
        to = from - 1n;
      }
      const transition = keccak256(
        encodeAbiParameters(
          [{ type: 'bytes32' }, { type: 'bytes32' }],
          [anchor, hash],
        ),
      );
      return this.publish('snapshot-transition:' + transition, {
        kind: 'ACKNOWLEDGE',
        assetId: report.assetId,
        snapshot,
        evidenceHash: report.evidenceHash,
      });
    }
    // Metadata repair can finish under temporary quarantine, but only an admin
    // may resume economic activity. Do not enqueue a coverage job that must revert.
    const assetState = await this.reader.client.readContract({
      address: m.registry as Address,
      abi: abi.CorporateActionRegistry,
      functionName: 'getAsset',
      args: [report.assetId],
    });
    if (assetState.safetyState !== 0) return 'HELD';
    if (report.reviewedThrough > head.finalizedThrough)
      return this.publish(
        'coverage:' + report.reviewedThrough + ':' + report.sourceBlockHash,
        {
          kind: 'COVERAGE',
          assetId: report.assetId,
          coverage: {
            finalizedThrough: report.reviewedThrough,
            sourceBlockTimestamp: report.sourceBlockTimestamp,
            sourceBlockNumber: report.sourceBlockNumber,
            sourceBlockHash: report.sourceBlockHash,
            evidenceHash: report.evidenceHash,
          },
        },
      );
    return 'COMPLETE';
  }
  private async publish(
    key: string,
    command: RegistryCommand,
  ): Promise<'PENDING' | 'HELD'> {
    const job = await this.outbox.enqueue(command.assetId + ':' + key, command),
      status = await this.outbox.run(job);
    return status === 'HELD' ? 'HELD' : 'PENDING';
  }
}
