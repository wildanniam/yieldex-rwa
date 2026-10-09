import { isDeepStrictEqual } from 'node:util';
import { randomUUID, createHash } from 'node:crypto';
import type postgres from 'postgres';
import type {
  Session,
  Conversation,
  ChatMessage,
  AssistantCard,
} from '@rwa/shared';
import { validateData } from '@rwa/shared/validation';
import { ApiFailure } from '../http';
import { idempotencyKey } from '../transactions/service';
import { HistoryCursor } from './cursor';
type Db = ReturnType<typeof postgres>;
const missing = () =>
  new ApiFailure(404, 'NOT_FOUND', 'Percakapan tidak ditemukan.');
const time = (s: unknown) => Math.floor(new Date(String(s)).getTime() / 1000);
function conversation(r: Record<string, unknown>): Conversation {
  return {
    conversationId: String(r.id),
    title: String(r.title),
    createdAt: time(r.created_at),
    updatedAt: time(r.updated_at),
  };
}
export class History {
  constructor(
    private db: Db,
    private cursors: HistoryCursor,
  ) {}
  async create(s: Session, key: string, input: unknown) {
    idempotencyKey(key);
    const v = validateData('api.CreateConversationRequest', input);
    if (!v.success)
      throw new ApiFailure(400, 'VALIDATION_ERROR', 'Judul tidak valid.');
    const hash = createHash('sha256')
      .update(JSON.stringify(v.data))
      .digest('hex');
    return this.db.begin(async (sql) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${s.userId + ':history:' + key},0))`;
      const [old] =
        await sql`select * from app_private.conversation_requests where user_id=${s.userId} and idempotency_key=${key}`;
      if (old) {
        if (old.request_hash !== hash)
          throw new ApiFailure(
            409,
            'IDEMPOTENCY_CONFLICT',
            'Key sudah digunakan.',
          );
        if (!old.conversation_id)
          throw new ApiFailure(
            410,
            'CONVERSATION_DELETED',
            'Percakapan telah dihapus.',
          );
        const [r] =
          await sql`select * from public.conversations where id=${old.conversation_id} and user_id=${s.userId}`;
        if (!r) throw missing();
        return { created: false, data: conversation(r) };
      }
      const [r] =
        await sql`insert into public.conversations(user_id,title) values(${s.userId},${v.data.title}) returning *`;
      await sql`insert into app_private.conversation_requests(user_id,idempotency_key,conversation_id,request_hash) values(${s.userId},${key},${r!.id},${hash})`;
      return { created: true, data: conversation(r!) };
    });
  }
  async list(s: Session, query: URLSearchParams) {
    const { limit, cursor } = this.query(query, 20, 20),
      scope = s.userId + ':conversations:' + limit,
      c = cursor ? this.cursors.decode(cursor, scope) : null;
    const rows = await this
      .db`select *,updated_at::text as cursor_time from public.conversations where user_id=${s.userId} ${c ? this.db`and (updated_at,id)<(${c.at}::text::timestamptz,${c.id}::uuid)` : this.db``} order by updated_at desc,id desc limit ${limit + 1}`;
    return this.page(rows, limit, scope, conversation);
  }
  // Bind timestamp cursors as text first: PostgreSQL has microseconds, JS Date only milliseconds.
  async messages(s: Session, id: string, query: URLSearchParams) {
    await this.owner(s, id);
    const { limit, cursor } = this.query(query, 100, 50),
      scope = s.userId + ':messages:' + id + ':' + limit,
      c = cursor ? this.cursors.decode(cursor, scope) : null;
    const rows = await this
      .db`select *,created_at::text as cursor_time from public.messages where conversation_id=${id} and user_id=${s.userId} and role in('user','assistant') ${c ? this.db`and (created_at,id)>(${c.at}::text::timestamptz,${c.id}::uuid)` : this.db``} order by created_at,id limit ${limit + 1}`;
    return this.page(rows, limit, scope, (r) => this.message(r));
  }
  async remove(s: Session, id: string) {
    await this.owner(s, id);
    await this
      .db`delete from public.conversations where id=${id} and user_id=${s.userId}`;
  }
  /** Only trusted chatbot runtime calls appendAssistant; no public message POST exists. */
  async appendUser(
    s: Session,
    id: string,
    clientMessageId: string,
    text: string,
  ) {
    return this.append(s, id, clientMessageId, 'user', text, []);
  }
  async appendAssistant(
    s: Session,
    id: string,
    serverMessageKey: string,
    text: string,
    cards: AssistantCard[],
  ) {
    return this.append(s, id, serverMessageKey, 'assistant', text, cards);
  }
  private async append(
    s: Session,
    id: string,
    key: string,
    role: 'user' | 'assistant',
    text: string,
    cards: AssistantCard[],
  ) {
    await this.owner(s, id);
    const value = {
      messageId: randomUUID(),
      conversationId: id,
      clientMessageId: key,
      role,
      text,
      cards,
      createdAt: Math.floor(Date.now() / 1000),
    };
    if (!validateData('api.ChatMessage', value).success)
      throw new ApiFailure(400, 'VALIDATION_ERROR', 'Pesan tidak valid.');
    return this.db.begin(async (sql) => {
      const parent =
        await sql`select id from public.conversations where id=${id} and user_id=${s.userId} for update`;
      if (!parent.length) throw missing();
      const [old] =
        await sql`select * from public.messages where conversation_id=${id} and user_id=${s.userId} and client_message_id=${key}`;
      if (old) {
        if (
          old.role !== role ||
          !isDeepStrictEqual(old.content, { text, cards })
        )
          throw new ApiFailure(
            409,
            'IDEMPOTENCY_CONFLICT',
            'Message ID sudah digunakan untuk konten lain.',
          );
        return this.message(old);
      }
      const [r] =
        await sql`insert into public.messages(id,conversation_id,user_id,client_message_id,role,content) values(${value.messageId},${id},${s.userId},${key},${role},${sql.json({ text, cards: JSON.parse(JSON.stringify(cards)) })}) returning *`;
      await sql`update public.conversations set updated_at=now() where id=${id} and user_id=${s.userId}`;
      return this.message(r!);
    });
  }
  private async owner(s: Session, id: string) {
    if (!validateData('common.Uuid', id).success) throw missing();
    const [r] = await this
      .db`select id from public.conversations where id=${id} and user_id=${s.userId}`;
    if (!r) throw missing();
  }
  private message(r: Record<string, unknown>): ChatMessage {
    const content = r.content as { text: string; cards: AssistantCard[] };
    const v = {
      messageId: String(r.id),
      conversationId: String(r.conversation_id),
      clientMessageId: String(r.client_message_id),
      role: r.role,
      text: content.text,
      cards: content.cards,
      createdAt: time(r.created_at),
    };
    const checked = validateData('api.ChatMessage', v);
    if (!checked.success) throw new Error('Stored message violates schema');
    return checked.data;
  }
  private query(q: URLSearchParams, max: number, fallback: number) {
    for (const k of q.keys())
      if (!['limit', 'cursor'].includes(k) || q.getAll(k).length !== 1)
        throw new ApiFailure(400, 'VALIDATION_ERROR', 'Query tidak valid.');
    const l = q.get('limit'),
      limit = l && /^[1-9][0-9]*$/.test(l) ? Number(l) : l ? NaN : fallback;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > max)
      throw new ApiFailure(400, 'VALIDATION_ERROR', 'Limit tidak valid.');
    return { limit, cursor: q.get('cursor') };
  }
  private page<T>(
    rows: Record<string, unknown>[],
    limit: number,
    scope: string,
    map: (r: Record<string, unknown>) => T,
  ) {
    const hasMore = rows.length > limit,
      kept = rows.slice(0, limit),
      last = kept.at(-1);
    return {
      items: kept.map(map),
      pagination: {
        hasMore,
        nextCursor: hasMore
          ? this.cursors.encode(
              scope,
              String(last!.cursor_time),
              String(last!.id),
            )
          : null,
      },
    };
  }
}
