import { randomUUID } from 'node:crypto';
import type postgres from 'postgres';
import {
  decodeFunctionData,
  encodeFunctionData,
  keccak256,
  toHex,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  type Address,
  type Hex,
  type WalletClient,
  type Account,
  type Chain,
  type Transport,
  type ContractFunctionReturnType,
} from 'viem';
import { implementationAbis as abi } from '@rwa/shared/abi';
import { ChainReader } from '@rwa/shared/chain';

type Event = ContractFunctionReturnType<
  typeof abi.CorporateActionRegistry,
  'view',
  'getAssetEvent'
>;
type Snapshot = ContractFunctionReturnType<
  typeof abi.XStocksAdapter,
  'view',
  'readSnapshot'
>;
type Coverage = {
  finalizedThrough: bigint;
  sourceBlockTimestamp: bigint;
  sourceBlockNumber: bigint;
  sourceBlockHash: Hex;
  evidenceHash: Hex;
};
export type RegistryCommand =
  | { kind: 'APPEND'; assetId: Hex; events: readonly Event[] }
  | { kind: 'ACKNOWLEDGE'; assetId: Hex; snapshot: Snapshot; evidenceHash: Hex }
  | { kind: 'COVERAGE'; assetId: Hex; coverage: Coverage }
  | { kind: 'CONFLICT'; assetId: Hex; evidenceHash: Hex }
  | { kind: 'QUARANTINE'; assetId: Hex; state: 1 | 2; evidenceHash: Hex };
const allowed = [
  'appendFinalizedEvents',
  'acknowledgeAssetSnapshot',
  'advanceFinalityCoverage',
  'reportFinalityConflict',
  'setAssetSafetyState',
];
function encode(c: RegistryCommand): Hex {
  switch (c.kind) {
    case 'APPEND':
      if (!c.events.length || c.events.length > 32)
        throw new Error('Invalid batch');
      return encodeFunctionData({
        abi: abi.CorporateActionRegistry,
        functionName: 'appendFinalizedEvents',
        args: [c.assetId, c.events],
      });
    case 'ACKNOWLEDGE':
      return encodeFunctionData({
        abi: abi.CorporateActionRegistry,
        functionName: 'acknowledgeAssetSnapshot',
        args: [c.assetId, c.snapshot, c.evidenceHash],
      });
    case 'COVERAGE':
      return encodeFunctionData({
        abi: abi.CorporateActionRegistry,
        functionName: 'advanceFinalityCoverage',
        args: [c.assetId, c.coverage],
      });
    case 'CONFLICT':
      return encodeFunctionData({
        abi: abi.CorporateActionRegistry,
        functionName: 'reportFinalityConflict',
        args: [c.assetId, c.evidenceHash],
      });
    case 'QUARANTINE':
      return encodeFunctionData({
        abi: abi.CorporateActionRegistry,
        functionName: 'setAssetSafetyState',
        args: [c.assetId, c.state, c.evidenceHash],
      });
  }
}
/** Durable signed-byte outbox. Sign/record commit precedes broadcast; retries only send identical bytes.
 * No user payouts, approvals, mint or arbitrary target can be encoded here.
 */
export class RegistryOutbox {
  constructor(
    private db: ReturnType<typeof postgres>,
    private reader: ChainReader,
    private wallet: WalletClient<Transport, Chain, Account>,
  ) {}
  async verify() {
    await this.reader.verify();
    const account = this.wallet.account,
      m = this.reader.manifest;
    if (
      account.type !== 'local' ||
      this.wallet.chain.id !== m.chainId ||
      ![31337, 11155111].includes(m.chainId)
    )
      throw new Error('Isolated local signer and demo chain required');
    const ok = await this.reader.client.readContract({
      address: m.registry as Address,
      abi: abi.CorporateActionRegistry,
      functionName: 'hasRole',
      args: [keccak256(toHex('EVENT_FINALIZER_ROLE')), account.address],
    });
    if (!ok) throw new Error('Signer lacks finalizer role');
  }
  async enqueue(key: string, c: RegistryCommand) {
    const m = this.reader.manifest,
      asset = m.assets.find((a) => a.assetId === c.assetId);
    if (!asset || key.length < 1 || key.length > 300)
      throw new Error('Unsupported command asset/key');
    const data = encode(c),
      commandHash = keccak256(
        toHex(
          JSON.stringify({
            chainId: m.chainId,
            registry: m.registry,
            token: asset.token,
            data,
          }),
        ),
      ),
      scopedKey = m.chainId + ':' + m.registry + ':' + key;
    return this.db.begin(async (sql) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${scopedKey},0))`;
      const [old] =
        await sql`select job_id,command_hash from app_private.worker_outbox where idempotency_key=${scopedKey} and status<>'SUPERSEDED'`;
      if (old) {
        if (old.command_hash !== commandHash)
          throw new Error('OUTBOX_IDEMPOTENCY_CONFLICT');
        return String(old.job_id);
      }
      const id = randomUUID();
      await sql`insert into app_private.worker_outbox(job_id,idempotency_key,command_hash,chain_id,token,status,payload) values(${id},${scopedKey},${commandHash},${m.chainId},${asset.token},'READY',${sql.json({ registry: m.registry, assetId: c.assetId, data })})`;
      return id;
    });
  }
  async run(
    jobId: string,
  ): Promise<'PENDING' | 'CONFIRMED' | 'HELD' | 'SUPERSEDED'> {
    await this.verify();
    const m = this.reader.manifest,
      signer = this.wallet.account.address.toLowerCase();
    // One signer nonce allocation across processes and assets; signing alone has no chain side effect.
    const row = await this.db.begin(async (sql) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${m.chainId + ':' + signer + ':nonce'},0))`;
      const [r] =
        await sql`select * from app_private.worker_outbox where job_id=${jobId} for update`;
      if (
        !r ||
        Number(r.chain_id) !== m.chainId ||
        r.payload.registry !== m.registry
      )
        throw new Error('Unknown deployment job');
      const asset = m.assets.find(
        (a) => a.assetId === r.payload.assetId && a.token === r.token,
      );
      if (!asset) throw new Error('Unknown job asset');
      const data = r.payload.data as Hex,
        expected = keccak256(
          toHex(
            JSON.stringify({
              chainId: m.chainId,
              registry: m.registry,
              token: r.token,
              data,
            }),
          ),
        );
      if (expected !== r.command_hash)
        throw new Error('CORRUPT_OUTBOX_COMMAND');
      const decoded = decodeFunctionData({
        abi: abi.CorporateActionRegistry,
        data,
      });
      if (
        !allowed.includes(decoded.functionName) ||
        decoded.args[0] !== asset.assetId
      )
        throw new Error('Unsupported registry command');
      if (
        decoded.functionName === 'setAssetSafetyState' &&
        decoded.args[1] === 0
      )
        throw new Error('Finalizer cannot clear quarantine');
      if (['CONFIRMED', 'HELD', 'SUPERSEDED'].includes(r.status)) return r;
      if (r.signed_transaction) {
        if (
          r.signer !== signer ||
          keccak256(r.signed_transaction as Hex) !== r.transaction_hash
        )
          throw new Error('CORRUPT_SIGNED_TRANSACTION');
        return r;
      }
      if (decoded.functionName === 'appendFinalizedEvents') {
        const finalized = await this.finalizedAssetBlock(asset);
        for (const event of decoded.args[1]) {
          const valid = await this.reader.client.readContract({
            address: asset.adapter as Address,
            abi: abi.XStocksAdapter,
            functionName: 'validateEffectiveEvent',
            args: [asset.token as Address, event],
            blockNumber: finalized.number,
          });
          if (!valid) throw new Error('EVENT_NOT_CHAIN_FINALIZED');
        }
      }
      if (decoded.functionName === 'acknowledgeAssetSnapshot') {
        const finalized = await this.finalizedAssetBlock(asset),
          snapshot = await this.reader.client.readContract({
            address: asset.adapter as Address,
            abi: abi.XStocksAdapter,
            functionName: 'readSnapshot',
            args: [asset.token as Address],
            blockNumber: finalized.number,
          });
        const expected = encode({
          kind: 'ACKNOWLEDGE',
          assetId: asset.assetId as Hex,
          snapshot,
          evidenceHash: decoded.args[2],
        });
        if (expected !== data) {
          // Finality lag alone is not obsolescence. Retire only an unsigned ACK
          // whose replacement is visible in both finalized and current state.
          const live = await this.reader.client.readContract({
            address: asset.adapter as Address,
            abi: abi.XStocksAdapter,
            functionName: 'readSnapshot',
            args: [asset.token as Address],
          });
          if (
            r.status === 'READY' &&
            r.signer === null &&
            r.nonce === null &&
            r.transaction_hash === null &&
            r.signed_transaction === null &&
            encode({
              kind: 'ACKNOWLEDGE',
              assetId: asset.assetId as Hex,
              snapshot: live,
              evidenceHash: decoded.args[2],
            }) === expected
          ) {
            const [retired] =
              await sql`update app_private.worker_outbox set status='SUPERSEDED',reason_code='ACK_SNAPSHOT_SUPERSEDED' where job_id=${jobId} returning *`;
            return retired!;
          }
          throw new Error('SNAPSHOT_NOT_CHAIN_FINALIZED');
        }
      }
      // Verify source coverage really is no newer than a canonical finalized block.
      if (decoded.functionName === 'advanceFinalityCoverage') {
        const c = decoded.args[1],
          finalized = await this.reader.client.getBlock({
            blockTag: 'finalized',
          }),
          source = await this.reader.client.getBlock({
            blockNumber: c.sourceBlockNumber,
          });
        if (
          c.sourceBlockNumber > finalized.number ||
          source.hash !== c.sourceBlockHash ||
          source.timestamp !== c.sourceBlockTimestamp ||
          c.finalizedThrough > source.timestamp
        )
          throw new Error('UNFINALIZED_COVERAGE_SOURCE');
      }
      await this.reader.client.call({
        account: this.wallet.account.address,
        to: m.registry as Address,
        data,
        value: 0n,
      });
      const chainNonce = await this.reader.client.getTransactionCount({
          address: this.wallet.account.address,
          blockTag: 'pending',
        }),
        [last] =
          await sql`select max(nonce)::text as nonce from app_private.worker_outbox where chain_id=${m.chainId} and signer=${signer}`;
      const next =
        last?.nonce === null || last?.nonce === undefined
          ? BigInt(chainNonce)
          : BigInt(last.nonce) + 1n > BigInt(chainNonce)
            ? BigInt(last.nonce) + 1n
            : BigInt(chainNonce);
      if (next > BigInt(Number.MAX_SAFE_INTEGER))
        throw new Error('Nonce overflow');
      const prepared = await this.wallet.prepareTransactionRequest({
        account: this.wallet.account,
        chain: this.wallet.chain,
        to: m.registry as Address,
        data,
        value: 0n,
        nonce: Number(next),
      });
      const raw = await this.wallet.signTransaction(prepared),
        hash = keccak256(raw);
      const [saved] =
        await sql`update app_private.worker_outbox set status='PENDING',signer=${signer},nonce=${next.toString()},transaction_hash=${hash},signed_transaction=${raw} where job_id=${jobId} returning *`;
      return saved!;
    });
    if (['CONFIRMED', 'HELD', 'SUPERSEDED'].includes(row.status))
      return row.status;
    const hash = row.transaction_hash as Hex;
    try {
      const receipt = await this.reader.client.getTransactionReceipt({ hash }),
        block = await this.reader.client.getBlock({
          blockNumber: receipt.blockNumber,
        });
      if (block.hash !== receipt.blockHash)
        return this.hold(jobId, 'RECEIPT_REORG');
      if (receipt.status === 'reverted')
        return this.hold(jobId, 'TRANSACTION_REVERTED');
      const finalized = await this.reader.client.getBlock({
        blockTag: 'finalized',
      });
      if (finalized.number < receipt.blockNumber) return 'PENDING';
      await this
        .db`update app_private.worker_outbox set status='CONFIRMED',receipt_block=${receipt.blockNumber.toString()},receipt_hash=${receipt.blockHash},reason_code=null where job_id=${jobId} and status<>'HELD'`;
      return 'CONFIRMED';
    } catch (e) {
      if (!(e instanceof TransactionReceiptNotFoundError)) throw e;
    }
    try {
      await this.reader.client.getTransaction({ hash });
      return 'PENDING';
    } catch (e) {
      if (!(e instanceof TransactionNotFoundError)) throw e;
    }
    const nonce = await this.reader.client.getTransactionCount({
      address: this.wallet.account.address,
      blockTag: 'latest',
    });
    if (BigInt(nonce) > BigInt(row.nonce)) {
      // Another worker may have broadcast these same durable bytes between our
      // not-found reads and the nonce read. Recheck the exact hash before holding
      // the job; a consumed nonce alone does not prove an unknown replacement.
      try {
        await this.reader.client.getTransactionReceipt({ hash });
        return 'PENDING'; // Normal receipt/finality validation on the next poll.
      } catch (e) {
        if (!(e instanceof TransactionReceiptNotFoundError)) throw e;
      }
      try {
        await this.reader.client.getTransaction({ hash });
        return 'PENDING';
      } catch (e) {
        if (!(e instanceof TransactionNotFoundError)) throw e;
      }
      return this.hold(jobId, 'NONCE_UNRESOLVED');
    }
    // The raw bytes/hash are already durable. A timeout here can safely be reconciled on restart.
    try {
      const sent = await this.reader.client.sendRawTransaction({
        serializedTransaction: row.signed_transaction as Hex,
      });
      if (sent !== hash) return this.hold(jobId, 'BROADCAST_HASH_MISMATCH');
    } catch {
      await this
        .db`update app_private.worker_outbox set retry_count=retry_count+1,reason_code='BROADCAST_UNCERTAIN' where job_id=${jobId}`;
      return 'PENDING';
    }
    return 'PENDING';
  }
  async drain(assetId: Hex): Promise<'PENDING' | 'CONFIRMED' | 'HELD'> {
    const m = this.reader.manifest;
    const rows = await this
      .db`select job_id,status from app_private.worker_outbox where chain_id=${m.chainId} and payload->>'registry'=${m.registry} and payload->>'assetId'=${assetId} and status not in('CONFIRMED','SUPERSEDED') order by nonce nulls last,job_id limit 32`;
    if (rows.some((r) => r.status === 'HELD')) return 'HELD';
    let pending = false;
    for (const row of rows) {
      const status = await this.run(row.job_id);
      if (status === 'HELD') return 'HELD';
      if (status === 'PENDING') pending = true;
    }
    return pending ? 'PENDING' : 'CONFIRMED';
  }
  private async hold(id: string, reason: string) {
    await this
      .db`update app_private.worker_outbox set status='HELD',reason_code=${reason} where job_id=${id}`;
    return 'HELD' as const;
  }
  private async finalizedAssetBlock(asset: { token: string; adapter: string }) {
    const finalized = await this.reader.client.getBlock({
      blockTag: 'finalized',
    });
    const code = await Promise.all(
      [asset.token, asset.adapter].map((address) =>
        this.reader.client.getCode({
          address: address as Address,
          blockNumber: finalized.number,
        }),
      ),
    );
    if (code.some((value) => !value || value === '0x'))
      throw new Error('SOURCE_NOT_CHAIN_FINALIZED');
    return finalized;
  }
}
