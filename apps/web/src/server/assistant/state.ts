import { createHash, randomUUID } from 'node:crypto';
import type postgres from 'postgres';
import type { AgentRunnerRunRequest } from '@copilotkit/runtime/v2';
import { ApiFailure } from '../http';
import { createDatabase } from '../database';
export type AssistantMessage =
  AgentRunnerRunRequest['input']['messages'][number];
export type ThreadState = {
  id: string;
  principal: string;
  conversationId: string | null;
  messages: AssistantMessage[];
  running: boolean;
};
const unavailable = () =>
  new ApiFailure(
    503,
    'AI_STATE_UNAVAILABLE',
    'Penyimpanan chat belum tersedia. Coba lagi.',
  );
const denied = () =>
  new ApiFailure(
    403,
    'CHAT_SESSION_REQUIRED',
    'Buka ulang chat untuk memulai sesi yang valid.',
  );
const running = () =>
  new ApiFailure(
    409,
    'RUN_ACTIVE',
    'Jawaban masih diproses. Tunggu atau hentikan dahulu.',
  );
// All callers hold the parent thread row lock, so the bound is race-safe.
async function requireRunSlot(sql: postgres.TransactionSql, threadId: string) {
  const [row] =
    await sql`select count(*)::int as total from app_private.assistant_run_controls where thread_id=${threadId}`;
  if (Number(row?.total) >= 128)
    throw new ApiFailure(
      409,
      'CHAT_LIMIT',
      'Percakapan penuh. Mulai chat baru.',
    );
}
const map = (r: Record<string, unknown>): ThreadState => ({
  id: String(r.id),
  principal: String(r.principal),
  conversationId: r.conversation_id ? String(r.conversation_id) : null,
  messages: r.messages as AssistantMessage[],
  running: Boolean(r.running),
});
/** DB state is authoritative. A runId/version fence prevents an expired worker from committing. */
export class AssistantState {
  constructor(readonly db: ReturnType<typeof postgres>) {}
  async create(
    principal: string,
    conversationId: string | null = null,
    initial: AssistantMessage[] = [],
  ) {
    await this.cleanup();
    const id = randomUUID();
    if (conversationId) {
      const [row] = await this
        .db`insert into app_private.assistant_threads(id,principal,conversation_id,messages,expires_at)
        values(${id},${principal},${conversationId},${this.db.json(JSON.parse(JSON.stringify(initial)))},now()+interval '30 minutes')
        on conflict(conversation_id) do update set expires_at=now()+interval '30 minutes'
        where assistant_threads.principal=excluded.principal
        returning *,run_id is not null and lease_until>now() as running`;
      if (!row) throw denied();
      return map(row);
    }
    const [row] = await this
      .db`insert into app_private.assistant_threads(id,principal,messages,expires_at)
      values(${id},${principal},${this.db.json(JSON.parse(JSON.stringify(initial)))},now()+interval '30 minutes') returning *,false as running`;
    return map(row!);
  }
  async get(id: string, principal: string) {
    const [row] = await this
      .db`select *,run_id is not null and lease_until>now() as running from app_private.assistant_threads
      where id=${id} and principal=${principal} and expires_at>now()`;
    if (!row) throw denied();
    return map(row);
  }
  async acquire(
    id: string,
    principal: string,
    runId: string,
    message: AssistantMessage,
    beforeAccept?: (sql: postgres.TransactionSql) => Promise<void>,
  ) {
    return this.db.begin(async (sql) => {
      const [row] =
        await sql`select *,run_id is not null and lease_until>now() as running from app_private.assistant_threads
        where id=${id} and principal=${principal} and expires_at>now() for update`;
      if (!row) throw denied();
      if (row.running) throw running();
      const [control] =
        await sql`select * from app_private.assistant_run_controls where thread_id=${id} and run_id=${runId}`;
      if (control?.accepted)
        throw new ApiFailure(
          409,
          'RUN_REPLAY',
          'Permintaan sudah diterima. Pulihkan percakapan sebelum mencoba lagi.',
        );
      if (!control) await requireRunSlot(sql, id);
      const cancelled = Boolean(control?.stop_requested);
      const messages = row.messages as AssistantMessage[];
      const duplicate = messages.find((m) => m.id === message.id);
      if (duplicate)
        throw new ApiFailure(
          409,
          'MESSAGE_REPLAY',
          'Pesan sudah diterima. Pulihkan percakapan sebelum mencoba lagi.',
        );
      if (JSON.stringify(messages).length > 196608)
        throw new ApiFailure(
          409,
          'CHAT_LIMIT',
          'Percakapan penuh. Mulai chat baru.',
        );
      if (beforeAccept) await beforeAccept(sql);
      const next = [...messages, message];
      await sql`insert into app_private.assistant_run_controls(thread_id,run_id,accepted,stop_requested)
        values(${id},${runId},true,${cancelled}) on conflict(thread_id,run_id) do update set accepted=true`;
      const [changed] =
        await sql`update app_private.assistant_threads set messages=${sql.json(JSON.parse(JSON.stringify(next)))},
        run_id=${runId},lease_until=now()+interval '15 seconds',stop_requested=${cancelled},version=version+1,expires_at=now()+interval '30 minutes'
        where id=${id} returning version`;
      return {
        messages: next,
        version: String(changed!.version),
        cancelled,
        conversationId: row.conversation_id
          ? String(row.conversation_id)
          : null,
      };
    });
  }
  async heartbeat(id: string, runId: string, version: string) {
    const [row] = await this
      .db`update app_private.assistant_threads set lease_until=now()+interval '15 seconds'
      where id=${id} and run_id=${runId} and version=${version} and lease_until>now() returning stop_requested`;
    return !row || Boolean(row.stop_requested);
  }
  async stop(id: string, principal: string, runId?: string) {
    return this.db.begin(async (sql) => {
      const [thread] =
        await sql`select run_id,lease_until>now() as active from app_private.assistant_threads
        where id=${id} and principal=${principal} and expires_at>now() for update`;
      if (!thread) return false;
      const target =
        runId ?? (thread.active ? (thread.run_id as string) : undefined);
      if (!target) return false;
      const [control] =
        await sql`select finished from app_private.assistant_run_controls where thread_id=${id} and run_id=${target}`;
      if (control?.finished) return false;
      if (!control) await requireRunSlot(sql, id);
      await sql`insert into app_private.assistant_run_controls(thread_id,run_id,accepted,stop_requested)
        values(${id},${target},${thread.run_id === target},true)
        on conflict(thread_id,run_id) do update set stop_requested=true`;
      await sql`update app_private.assistant_threads set stop_requested=true
        where id=${id} and run_id=${target} and lease_until>now()`;
      return true;
    });
  }
  async finish(
    id: string,
    runId: string,
    version: string,
    messages: AssistantMessage[],
    beforeRelease?: (sql: postgres.TransactionSql) => Promise<void>,
  ) {
    return this.db.begin(async (sql) => {
      const [row] =
        await sql`select id from app_private.assistant_threads where id=${id} and run_id=${runId}
        and version=${version} for update`;
      if (!row) return false;
      if (JSON.stringify(messages).length > 1048576)
        throw new ApiFailure(
          409,
          'CHAT_LIMIT',
          'Percakapan melewati batas penyimpanan.',
        );
      if (beforeRelease) await beforeRelease(sql);
      await sql`insert into app_private.assistant_run_controls(thread_id,run_id,accepted,finished)
        values(${id},${runId},true,true)
        on conflict(thread_id,run_id) do update set finished=true`;
      await sql`update app_private.assistant_threads set messages=${sql.json(JSON.parse(JSON.stringify(messages)))},run_id=null,lease_until=null,stop_requested=false where id=${id}`;
      return true;
    });
  }
  async budget(bucket: string, limit: number) {
    const digest = createHash('sha256').update(bucket).digest('hex');
    const [row] = await this
      .db`insert into app_private.assistant_budgets(bucket,window_start,requests) values(${digest},now(),1)
      on conflict(bucket) do update set requests=case when assistant_budgets.window_start<now()-interval '1 minute' then 1 else assistant_budgets.requests+1 end,
      window_start=case when assistant_budgets.window_start<now()-interval '1 minute' then now() else assistant_budgets.window_start end returning requests`;
    if (Number(row!.requests) > limit)
      throw new ApiFailure(
        429,
        'RATE_LIMITED',
        'Terlalu banyak permintaan.',
        60,
      );
  }
  async cleanup() {
    await this
      .db`delete from app_private.assistant_threads where expires_at<now() and (lease_until is null or lease_until<now())`;
    await this
      .db`delete from app_private.assistant_budgets where window_start<now()-interval '2 minutes'`;
  }
}
let state: AssistantState | undefined;
export function assistantState() {
  const url = process.env.AI_STATE_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw unavailable();
  state ??= new AssistantState(createDatabase(url));
  return state;
}
/** Normalize database/config errors at the boundary, without credential logging. */
export function stateError(error: unknown) {
  return error instanceof ApiFailure ? error : unavailable();
}

export function assertSavedStore() {
  if (
    process.env.AI_STATE_DATABASE_URL &&
    process.env.AI_STATE_DATABASE_URL !== process.env.DATABASE_URL
  )
    throw new ApiFailure(
      503,
      'SAVED_HISTORY_UNAVAILABLE',
      'Riwayat tersimpan belum tersedia pada lingkungan ini.',
    );
}
