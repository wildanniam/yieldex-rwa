import { createHash, randomUUID } from 'node:crypto';
import type postgres from 'postgres';
import { TransactionNotFoundError, type Hex } from 'viem';
import type { PreparedIntent, Session, SubmissionRequest } from '@rwa/shared';
import { validateData } from '@rwa/shared/validation';
import { ChainReader } from '@rwa/shared/chain';
import { prepareTransaction, PreparationError } from '@rwa/shared/transactions';
import { ApiFailure } from '../http';
import { transactionStatus } from './status';
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
const digest = (value: unknown) =>
  '0x' + createHash('sha256').update(canonical(value)).digest('hex');
export function idempotencyKey(key: string | null) {
  if (!key || !validateData('common.Uuid', key).success)
    throw new ApiFailure(
      400,
      'VALIDATION_ERROR',
      'Idempotency-Key UUID diperlukan.',
    );
  return key;
}
export class TransactionIntents {
  constructor(
    private db: ReturnType<typeof postgres>,
    readonly reader: ChainReader,
  ) {}
  private context(s: Session) {
    if (s.authChainId !== this.reader.manifest.chainId)
      throw new ApiFailure(
        403,
        'WALLET_MISMATCH',
        'Chain session tidak sesuai deployment.',
      );
  }
  async prepare(session: Session, key: string, input: unknown) {
    this.context(session);
    idempotencyKey(key);
    if (!validateData('api.PrepareIntentRequest', input).success)
      throw new ApiFailure(
        400,
        'VALIDATION_ERROR',
        'Request transaksi tidak valid.',
      );
    const requestHash = digest({
      input,
      wallet: session.walletAddress,
      deployment: this.reader.manifest,
    });
    return await this.db.begin(async (sql) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${session.userId + ':' + key},0))`;
      const [old] =
        await sql`select * from public.transaction_intents where user_id=${session.userId} and idempotency_key=${key}`;
      if (old) {
        if (
          old.request_hash !== requestHash ||
          old.wallet !== session.walletAddress
        )
          throw new ApiFailure(
            409,
            'IDEMPOTENCY_CONFLICT',
            'Key sudah digunakan untuk request lain.',
          );
        return {
          created: false,
          intent: await this.expiry(old.preview as PreparedIntent),
        };
      }
      const m = this.reader.manifest;
      const held =
        await sql`select 1 from public.chain_cursors where chain_id=${m.chainId} and contract_address=${m.market} and state='REBUILDING'`;
      if (held.length)
        throw new ApiFailure(
          503,
          'INDEXER_REBUILDING',
          'Verifikasi ulang riwayat chain sedang berlangsung.',
        );
      let intent: PreparedIntent;
      try {
        intent = await prepareTransaction(
          this.reader,
          input,
          session.walletAddress,
          { intentId: randomUUID(), stepId: randomUUID() },
        );
      } catch (e) {
        if (e instanceof PreparationError)
          throw new ApiFailure(
            e.code === 'CHAIN_CONFLICT' ? 503 : 400,
            e.code,
            'Persiapan transaksi ditolak.',
          );
        throw e;
      }
      await sql`insert into public.transaction_intents(id,user_id,idempotency_key,wallet,action,request_hash,preview,expires_at) values(${intent.intentId},${session.userId},${key},${session.walletAddress},${intent.request.action},${requestHash},${sql.json(JSON.parse(JSON.stringify(intent)))},to_timestamp(${intent.expiresAt}))`;
      return { created: true, intent };
    });
  }
  private async expiry(p: PreparedIntent): Promise<PreparedIntent> {
    const now = (await this.reader.snapshot('latest')).blockTimestamp;
    return p.state !== 'SUBMITTED' && now >= p.expiresAt
      ? { ...p, state: 'EXPIRED' as const, steps: [] }
      : p;
  }
  async get(session: Session, id: string) {
    this.context(session);
    if (!validateData('common.Uuid', id).success)
      throw new ApiFailure(404, 'NOT_FOUND', 'Intent tidak ditemukan.');
    const [row] = await this
      .db`select preview,wallet from public.transaction_intents where id=${id} and user_id=${session.userId}`;
    if (!row || row.wallet !== session.walletAddress)
      throw new ApiFailure(404, 'NOT_FOUND', 'Intent tidak ditemukan.');
    return await this.expiry(row.preview as PreparedIntent);
  }
  async submit(session: Session, id: string, key: string, input: unknown) {
    this.context(session);
    idempotencyKey(key);
    if (!validateData('api.SubmissionRequest', input).success)
      throw new ApiFailure(400, 'VALIDATION_ERROR', 'Submission tidak valid.');
    const req = input as SubmissionRequest;
    if (req.chainId !== this.reader.manifest.chainId)
      throw new ApiFailure(
        400,
        'UNSUPPORTED_DEPLOYMENT',
        'Chain transaksi tidak sesuai.',
      );
    if (!validateData('common.Uuid', id).success)
      throw new ApiFailure(404, 'NOT_FOUND', 'Intent tidak ditemukan.');
    return await this.db.begin(async (sql) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${session.userId + ':submission:' + key},0))`;
      const [row] =
        await sql`select * from public.transaction_intents where id=${id} and user_id=${session.userId} for update`;
      if (!row || row.wallet !== session.walletAddress)
        throw new ApiFailure(404, 'NOT_FOUND', 'Intent tidak ditemukan.');
      const preview = row.preview as PreparedIntent,
        step = preview.steps.find((s) => s.stepId === req.stepId);
      if (!step || preview.chainId !== req.chainId)
        throw new ApiFailure(
          400,
          'TRANSACTION_MISMATCH',
          'Step tidak sesuai intent.',
        );
      const requestHash = digest({ id, ...req }),
        [replay] =
          await sql`select request_hash from app_private.intent_submissions where user_id=${session.userId} and idempotency_key=${key}`;
      if (replay && replay.request_hash !== requestHash)
        throw new ApiFailure(
          409,
          'IDEMPOTENCY_CONFLICT',
          'Key submission sudah digunakan.',
        );
      await sql`insert into app_private.intent_submissions(user_id,idempotency_key,intent_id,request_hash,transaction_hash) values(${session.userId},${key},${id},${requestHash},${req.transactionHash}) on conflict(user_id,idempotency_key) do nothing`;
      let tx;
      try {
        tx = await this.reader.client.getTransaction({
          hash: req.transactionHash as Hex,
        });
      } catch (e) {
        if (e instanceof TransactionNotFoundError)
          return {
            verified: false,
            status: await transactionStatus(this.reader, req.transactionHash),
          };
        throw e;
      }
      if (
        tx.from.toLowerCase() !== step.from ||
        tx.to?.toLowerCase() !== step.to ||
        tx.value !== 0n ||
        tx.input.toLowerCase() !== step.data.toLowerCase() ||
        tx.chainId !== req.chainId
      )
        throw new ApiFailure(
          400,
          'TRANSACTION_MISMATCH',
          'Transaksi wallet tidak cocok dengan preview.',
        );
      if (!Number.isSafeInteger(tx.nonce) || tx.nonce < 0)
        throw new ApiFailure(
          503,
          'INVALID_RPC_TRANSACTION',
          'Nonce transaksi tidak valid.',
        );
      // Persist RPC-verified identity before the old hash can leave the mempool.
      // Preview already binds from/to/data/value/chain; only nonce was missing.
      if (
        row.transaction_hash &&
        row.transaction_hash !== req.transactionHash
      ) {
        let originalNonce = row.transaction_nonce;
        if (originalNonce === null || originalNonce === undefined) {
          let previous;
          try {
            previous = await this.reader.client.getTransaction({
              hash: row.transaction_hash as Hex,
            });
          } catch (e) {
            if (e instanceof TransactionNotFoundError)
              throw new ApiFailure(
                409,
                'ORIGINAL_TRANSACTION_UNAVAILABLE',
                'Nonce transaksi awal belum terverifikasi; hash lama tidak tersedia.',
              );
            throw e;
          }
          if (
            previous.from.toLowerCase() !== step.from ||
            previous.to?.toLowerCase() !== step.to ||
            previous.input.toLowerCase() !== step.data.toLowerCase() ||
            previous.value !== 0n ||
            previous.chainId !== req.chainId ||
            !Number.isSafeInteger(previous.nonce) ||
            previous.nonce < 0
          )
            throw new ApiFailure(
              409,
              'TRANSACTION_MISMATCH',
              'Transaksi awal tidak cocok dengan preview.',
            );
          originalNonce = previous.nonce;
        }
        if (BigInt(originalNonce) !== BigInt(tx.nonce))
          throw new ApiFailure(
            409,
            'TRANSACTION_MISMATCH',
            'Nonce bukan replacement transaksi sebelumnya.',
          );
      }
      preview.state = 'SUBMITTED';
      await sql`update public.transaction_intents set transaction_hash=${req.transactionHash},transaction_nonce=${String(tx.nonce)},preview=${sql.json(JSON.parse(JSON.stringify(preview)))} where id=${id}`;
      const status = await transactionStatus(this.reader, req.transactionHash);
      status.intentId = id;
      return { verified: true, status };
    });
  }
}
