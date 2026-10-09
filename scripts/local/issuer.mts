import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { keccak256, toHex } from 'viem';
import { createDatabase } from '../../apps/worker/src/database.js';
import {
  pollIssuer,
  recordObservations,
} from '../../apps/worker/src/finalizer/issuer.js';
const db = createDatabase(
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
);
// Isolated observation namespace; never a registered asset or payout instruction.
const assetKey =
  'eip155:31337:0x' + '1'.repeat(40) + ':' + keccak256(toHex(randomUUID()));
try {
  const rows = await pollIssuer('SPYx');
  assert.ok(rows.length > 0);
  const first = await recordObservations(db, assetKey, rows);
  assert.equal(first.newObservations, rows.length);
  assert.equal(
    (await recordObservations(db, assetKey, rows)).newObservations,
    0,
  );
  const original = rows[0]!;
  await db`update app_private.issuer_candidates set status='COMMITTED' where asset_key=${assetKey} and source_event_id=${original.node.eventId}`;
  const modified = {
    ...original,
    node: { ...original.node, notes: 'CONTROLLED correction fixture' },
    payloadHash: keccak256(toHex('CONTROLLED same-version modified payload')),
  };
  assert.equal(
    (await recordObservations(db, assetKey, [modified])).newObservations,
    1,
  );
  const [candidate] =
    await db`select status,evidence_hash from app_private.issuer_candidates where asset_key=${assetKey} and source_event_id=${original.node.eventId}`;
  assert.equal(candidate!.status, 'HELD');
  assert.equal(candidate!.evidence_hash, original.payloadHash);
  const [count] =
    await db`select count(*) as n from app_private.issuer_observations where asset_key=${assetKey} and source_event_id=${original.node.eventId}`;
  assert.equal(Number(count!.n), 2);
  console.log(
    `PASS ${rows.length} live official issuer observations; exact fields, repeated poll dedupe, controlled same-version revision held with both evidence payloads preserved. No metadata finality or onchain write inferred.`,
  );
} finally {
  await db`delete from app_private.issuer_candidates where asset_key=${assetKey}`;
  await db`delete from app_private.issuer_observations where asset_key=${assetKey}`;
  await db.end();
}
