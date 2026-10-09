import assert from 'node:assert/strict';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createSiweMessage } from 'viem/siwe';
import { randomBytes, randomUUID } from 'node:crypto';
import { authProvider } from '../../apps/web/src/server/auth/provider.js';
import { Web3Sessions } from '../../apps/web/src/server/auth/service.js';
import { createDatabase } from '../../apps/worker/src/database.js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (url !== 'http://127.0.0.1:54321' || !key)
  throw new Error('Isolated local Supabase required');
const db = createDatabase(
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  ),
  service = new Web3Sessions(db, {
    url,
    key,
    origin: 'http://localhost:3000',
    chainId: 31337,
  });
const alice = privateKeyToAccount(generatePrivateKey()),
  bob = privateKeyToAccount(generatePrivateKey());
const ids: string[] = [];
async function login(account: typeof alice) {
  const c = await service.challenge(account.address),
    signature = await account.signMessage({ message: c.message });
  const session = await service.exchange(
    c.challengeId,
    signature,
    c.challengeId,
  );
  ids.push(session.user.id);
  return { c, signature, session };
}
try {
  const a = await login(alice),
    b = await login(bob);
  const av = await service.verify(a.session.access_token);
  assert.equal(av.walletAddress, alice.address.toLowerCase());
  assert.equal(av.authChainId, 31337);
  await assert.rejects(
    () => service.exchange(a.c.challengeId, a.signature, a.c.challengeId),
    /digunakan/,
  );
  const c = await service.challenge(alice.address),
    sig = await alice.signMessage({ message: c.message });
  const race = await Promise.allSettled([
    service.exchange(c.challengeId, sig, c.challengeId),
    service.exchange(c.challengeId, sig, c.challengeId),
  ]);
  assert.equal(race.filter((r) => r.status === 'fulfilled').length, 1);
  const wrong = await service.challenge(alice.address);
  const wrongSig = await bob.signMessage({ message: wrong.message });
  await assert.rejects(
    () => service.exchange(wrong.challengeId, wrongSig, wrong.challengeId),
    /signature/,
  );
  await assert.rejects(
    () => service.exchange(wrong.challengeId, wrongSig, undefined),
    /Challenge/,
  );
  await db`update app_private.auth_challenges set expires_at=now()-interval '1 second' where id=${wrong.challengeId}`;
  await assert.rejects(
    () => service.exchange(wrong.challengeId, wrongSig, wrong.challengeId),
    /kedaluwarsa/,
  );
  assert.throws(() => service.assertOrigin('https://attacker.invalid'));
  const conversationA = randomUUID(),
    conversationB = randomUUID();
  await db`insert into public.conversations(id,user_id,title) values(${conversationA},${a.session.user.id},'Alice only'),(${conversationB},${b.session.user.id},'Bob only')`;
  async function query(token: string) {
    const r = await fetch(url + '/rest/v1/conversations?select=id,title', {
      headers: { apikey: key!, Authorization: 'Bearer ' + token },
    });
    assert.equal(r.status, 200);
    return (await r.json()) as { id: string; title: string }[];
  }
  assert.deepEqual(
    (await query(a.session.access_token)).map((x) => x.id),
    [conversationA],
  );
  assert.deepEqual(
    (await query(b.session.access_token)).map((x) => x.id),
    [conversationB],
  );
  // Bypass attempt goes directly to native provider, which accepts the replay.
  const direct = await authProvider(url, key).auth.signInWithWeb3({
    chain: 'ethereum',
    message: a.c.message,
    signature: a.signature,
  });
  assert.equal(direct.error, null);
  await assert.rejects(
    () => service.verify(direct.data.session!.access_token),
    /challenge aplikasi/,
  );
  assert.deepEqual(
    await query(direct.data.session!.access_token),
    [],
    'Direct provider replay must not bypass RLS',
  );
  const badChainMessage = createSiweMessage({
    domain: 'localhost:3000',
    address: alice.address,
    uri: 'http://localhost:3000/',
    statement: 'Isolated test',
    version: '1',
    chainId: 1,
    nonce: randomBytes(16).toString('hex'),
    issuedAt: new Date(),
  });
  const foreign = await authProvider(url, key).auth.signInWithWeb3({
    chain: 'ethereum',
    message: badChainMessage,
    signature: await alice.signMessage({ message: badChainMessage }),
  });
  assert.equal(foreign.error, null);
  await assert.rejects(() =>
    service.verify(foreign.data.session!.access_token),
  );
  assert.deepEqual(await query(foreign.data.session!.access_token), []);
  await service.revoke(a.session.access_token);
  await assert.rejects(() => service.verify(a.session.access_token));
  assert.deepEqual(await query(a.session.access_token), []);
  console.log(
    'PASS native Supabase + app session admission: two real signatures/users, one-use/racing challenge, bad signature/browser/origin/expiry, correct wallet/chain, direct provider replay denied by API AND RLS, foreign-chain token denied, revocation.',
  );
} finally {
  // Only conversations created by this isolated test are removed; no unrelated account data.
  for (const id of ids)
    await db`delete from public.conversations where user_id=${id}`;
  await db.end();
}
