import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createDatabase } from '../../apps/worker/src/database.js';
import { Web3Sessions } from '../../apps/web/src/server/auth/service.js';
import { History } from '../../apps/web/src/server/history/service.js';
import { HistoryCursor } from '../../apps/web/src/server/history/cursor.js';
import { validateData } from '@rwa/shared/validation';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (url !== 'http://127.0.0.1:54321' || !key)
  throw new Error('Local auth required');
const db = createDatabase(
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  ),
  auth = new Web3Sessions(db, {
    url,
    key,
    origin: 'http://localhost:3000',
    chainId: 31337,
  }),
  history = new History(
    db,
    new HistoryCursor('local-history-test-secret'.repeat(3)),
  );
async function login() {
  const a = privateKeyToAccount(generatePrivateKey()),
    c = await auth.challenge(a.address),
    s = await auth.exchange(
      c.challengeId,
      await a.signMessage({ message: c.message }),
      c.challengeId,
    );
  return auth.verify(s.access_token);
}
try {
  const a = await login(),
    b = await login(),
    key = randomUUID();
  const race = await Promise.all([
    history.create(a, key, { title: 'Personal chat' }),
    history.create(a, key, { title: 'Personal chat' }),
  ]);
  assert.equal(race.filter((x) => x.created).length, 1);
  assert.equal(race[0]!.data.conversationId, race[1]!.data.conversationId);
  const id = race[0]!.data.conversationId;
  await assert.rejects(() => history.create(a, key, { title: 'Other' }), /Key/);
  await assert.rejects(
    () => history.create(a, randomUUID(), { title: 'Bad', userId: b.userId }),
    /Judul/,
  );
  const messageId = randomUUID(),
    messages = await Promise.all([
      history.appendUser(a, id, messageId, 'Buy <script>example</script>'),
      history.appendUser(a, id, messageId, 'Buy <script>example</script>'),
    ]);
  assert.equal(messages[0]!.messageId, messages[1]!.messageId);
  await assert.rejects(
    () => history.appendUser(a, id, messageId, 'different'),
    /Message ID/,
  );
  await assert.rejects(
    () => history.appendUser(b, id, randomUUID(), 'injection'),
    /tidak ditemukan/,
  );
  await history.appendAssistant(a, id, randomUUID(), 'Read-only answer', []);
  await history.appendUser(a, id, randomUUID(), 'Followup');
  const page1 = await history.messages(
    a,
    id,
    new URLSearchParams({ limit: '2' }),
  );
  assert.equal(page1.items.length, 2);
  assert.ok(page1.pagination.hasMore);
  const page2 = await history.messages(
    a,
    id,
    new URLSearchParams({ limit: '2', cursor: page1.pagination.nextCursor! }),
  );
  assert.equal(page2.items.length, 1);
  assert.equal(
    new Set([...page1.items, ...page2.items].map((x) => x.messageId)).size,
    3,
  );
  assert.ok(
    page1.items.every((x) => validateData('api.ChatMessage', x).success),
  );
  await assert.rejects(
    () => history.messages(b, id, new URLSearchParams()),
    /tidak ditemukan/,
  );
  await assert.rejects(
    () =>
      history.messages(
        a,
        id,
        new URLSearchParams({
          limit: '1',
          cursor: page1.pagination.nextCursor!,
        }),
      ),
    /Cursor/,
  );
  await assert.rejects(
    () =>
      history.messages(
        a,
        id,
        new URLSearchParams({
          limit: '2',
          cursor: page1.pagination.nextCursor! + 'x',
        }),
      ),
    /Cursor/,
  );
  for (let i = 0; i < 4; i++)
    await history.create(a, randomUUID(), { title: 'Other ' + i });
  const list1 = await history.list(a, new URLSearchParams({ limit: '3' })),
    list2 = await history.list(
      a,
      new URLSearchParams({ limit: '3', cursor: list1.pagination.nextCursor! }),
    );
  assert.equal(
    new Set([...list1.items, ...list2.items].map((x) => x.conversationId)).size,
    5,
  );
  assert.equal((await history.list(b, new URLSearchParams())).items.length, 0);
  await assert.rejects(() => history.remove(b, id), /tidak ditemukan/);
  await history.remove(a, id);
  await assert.rejects(
    () => history.messages(a, id, new URLSearchParams()),
    /tidak ditemukan/,
  );
  await assert.rejects(
    () => history.create(a, key, { title: 'Personal chat' }),
    /dihapus/,
  );
  const [count] =
    await db`select count(*) as n from public.messages where conversation_id=${id}`;
  assert.equal(Number(count!.n), 0);
  for (const item of (await history.list(a, new URLSearchParams())).items)
    await history.remove(a, item.conversationId);
  console.log(
    'PASS local private history: verified users, concurrent create/message dedupe, mismatched replay denied, owner isolation, stable keyset pages, bound/tampered cursor rejection, cascade deletion and no recreation on old idempotency key. Chatbot runtime not exercised.',
  );
} finally {
  await db.end();
}
