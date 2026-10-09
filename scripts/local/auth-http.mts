import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { validateData } from '@rwa/shared/validation';
const base = 'http://localhost:3000',
  account = privateKeyToAccount(generatePrivateKey()),
  jar = new Map<string, string>();
async function call(
  path: string,
  method = 'GET',
  body?: unknown,
  origin = base,
  key?: string,
) {
  const r = await fetch(base + path, {
    method,
    headers: {
      Origin: origin,
      ...(key ? { 'idempotency-key': key } : {}),
      'content-type': 'application/json',
      Cookie: [...jar].map(([k, v]) => k + '=' + v).join('; '),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  for (const raw of r.headers.getSetCookie()) {
    const pair = raw.split(';')[0]!,
      at = pair.indexOf('=');
    jar.set(pair.slice(0, at), pair.slice(at + 1));
  }
  return r;
}
assert.equal((await call('/api/v1/session')).status, 401);
const challengeResponse = await call('/api/v1/auth/challenge', 'POST', {
  walletAddress: account.address.toLowerCase(),
});
assert.equal(challengeResponse.status, 200);
const validatedChallenge = validateData(
  'api.AuthChallengeResponse',
  await challengeResponse.json(),
);
assert.ok(validatedChallenge.success);
const challenge = validatedChallenge.data;
const signature = await account.signMessage({
  message: challenge.data.message,
});
assert.equal(
  (
    await call(
      '/api/v1/auth/session',
      'POST',
      { challengeId: challenge.data.challengeId, signature },
      'https://attacker.invalid',
    )
  ).status,
  403,
);
const signed = await call('/api/v1/auth/session', 'POST', {
  challengeId: challenge.data.challengeId,
  signature,
});
assert.equal(signed.status, 200);
const validatedSession = validateData(
  'api.SessionResponse',
  await signed.json(),
);
assert.ok(validatedSession.success);
const data = validatedSession.data;
assert.equal(data.data.walletAddress, account.address.toLowerCase());
assert.equal(signed.headers.get('cache-control'), 'no-store');
assert.ok(!JSON.stringify(data).includes('access_token'));
assert.equal((await call('/api/v1/session')).status, 200);
assert.equal(
  (
    await call('/api/v1/auth/session', 'POST', {
      challengeId: challenge.data.challengeId,
      signature,
    })
  ).status,
  400,
);
const manifest = JSON.parse(await readFile('.local/deployment.json', 'utf8'));
const createKey = randomUUID();
const created = await call(
  '/api/v1/conversations',
  'POST',
  { title: 'HTTP isolated history' },
  base,
  createKey,
);
assert.equal(created.status, 201);
const cv = validateData('api.ConversationResponse', await created.json());
assert.ok(cv.success);
const conversation = cv.data.data;
assert.equal(
  (
    await call(
      '/api/v1/conversations',
      'POST',
      { title: 'HTTP isolated history' },
      base,
      createKey,
    )
  ).status,
  200,
);
assert.equal((await call('/api/v1/conversations', 'GET')).status, 200);
assert.equal(
  (await call(`/api/v1/conversations/${conversation.conversationId}/messages`))
    .status,
  200,
);
const intentKey = randomUUID(),
  input = {
    action: 'CLAIM_INCOME',
    assetKey: `eip155:31337:${manifest.registry}:${manifest.assets[0].assetId}`,
    shares: '1',
  };
const prepared = await call(
  '/api/v1/transaction-intents',
  'POST',
  input,
  base,
  intentKey,
);
assert.equal(prepared.status, 201);
const pv = validateData('api.PreparedIntentResponse', await prepared.json());
assert.ok(pv.success);
const intent = pv.data.data;
assert.equal(intent.state, 'BLOCKED');
assert.equal(intent.steps.length, 0);
assert.equal(
  (await call('/api/v1/transaction-intents', 'POST', input, base, intentKey))
    .status,
  200,
);
assert.equal(
  (await call(`/api/v1/transaction-intents/${intent.intentId}`)).status,
  200,
);
assert.equal(
  (await call(`/api/v1/conversations/${conversation.conversationId}`, 'DELETE'))
    .status,
  204,
);
assert.equal(
  (await call(`/api/v1/conversations/${conversation.conversationId}/messages`))
    .status,
  404,
);
assert.equal(
  (
    await call(
      '/api/v1/conversations',
      'POST',
      { title: 'HTTP isolated history' },
      base,
      createKey,
    )
  ).status,
  410,
);
assert.equal((await call('/api/v1/session', 'DELETE')).status, 204);
assert.equal((await call('/api/v1/session')).status, 401);
console.log(
  'PASS actual HTTP SSR cookies: guest denial, bound challenge, origin rejection, login/private session, replay denial, private conversation create/retry/read/delete/tombstone, intent simulation/idempotency/read, logout/revocation and no token in JSON response.',
);
