import type { AssetPolicy, ReviewedReport } from './reconcile.js';
function object(v: unknown, keys: string[]): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v))
    throw Error('Invalid reviewed object');
  const r = v as Record<string, unknown>;
  if (Object.keys(r).length !== keys.length || keys.some((k) => !(k in r)))
    throw Error('Unexpected reviewed fields');
  return r;
}
function hash(v: unknown): `0x${string}` {
  if (typeof v !== 'string' || !/^0x[0-9a-f]{64}$/.test(v) || /^0x0+$/.test(v))
    throw Error('Invalid evidence hash');
  return v as `0x${string}`;
}
function uint(v: unknown): bigint {
  if (
    typeof v !== 'string' ||
    !/^(0|[1-9][0-9]{0,77})$/.test(v) ||
    BigInt(v) >= 2n ** 256n
  )
    throw Error('Reviewed integers must be canonical uint256 strings');
  return BigInt(v);
}
/** Private operator file. Passing validation does not certify issuer completeness. */
export function parseReviewedFile(text: string): {
  policy: AssetPolicy;
  report: ReviewedReport;
} {
  if (Buffer.byteLength(text) > 1024 * 1024)
    throw Error('Reviewed file too large');
  const root = object(JSON.parse(text), ['policy', 'report']),
    p = object(root.policy, [
      'assetId',
      'tokenRuntimeCodeHash',
      'implementationAddress',
    ]),
    r = object(root.report, [
      'assetId',
      'sourceKind',
      'evidenceHash',
      'sourceBlockNumber',
      'sourceBlockHash',
      'sourceBlockTimestamp',
      'reviewedThrough',
      'events',
    ]);
  if (
    p.implementationAddress !== null &&
    (typeof p.implementationAddress !== 'string' ||
      !/^0x[0-9a-f]{40}$/.test(p.implementationAddress))
  )
    throw Error('Invalid implementation address');
  if (
    !['SIMULATOR', 'ISSUER_REVIEW'].includes(r.sourceKind as string) ||
    !Array.isArray(r.events) ||
    r.events.length > 1000
  )
    throw Error('Invalid reviewed source');
  const report: ReviewedReport = {
    assetId: hash(r.assetId),
    sourceKind: r.sourceKind as ReviewedReport['sourceKind'],
    evidenceHash: hash(r.evidenceHash),
    sourceBlockNumber: uint(r.sourceBlockNumber),
    sourceBlockHash: hash(r.sourceBlockHash),
    sourceBlockTimestamp: uint(r.sourceBlockTimestamp),
    reviewedThrough: uint(r.reviewedThrough),
    events: r.events.map((v) => {
      const e = object(v, [
        'eventId',
        'sequence',
        'kind',
        'effectiveAt',
        'multiplierBefore',
        'multiplierAfter',
        'issuerNonceAfter',
        'historyIndex',
        'sourceRevision',
        'sourceOccurrenceKey',
        'evidenceHash',
      ]);
      if (
        ![0, 1, 2, 3].includes(e.kind as number) ||
        !Number.isInteger(e.sourceRevision) ||
        (e.sourceRevision as number) < 1 ||
        (e.sourceRevision as number) > 4294967295
      )
        throw Error('Invalid event enum/revision');
      return {
        eventId: hash(e.eventId),
        sequence: uint(e.sequence),
        kind: e.kind as number,
        effectiveAt: uint(e.effectiveAt),
        multiplierBefore: uint(e.multiplierBefore),
        multiplierAfter: uint(e.multiplierAfter),
        issuerNonceAfter: uint(e.issuerNonceAfter),
        historyIndex: uint(e.historyIndex),
        sourceRevision: e.sourceRevision as number,
        sourceOccurrenceKey: hash(e.sourceOccurrenceKey),
        evidenceHash: hash(e.evidenceHash),
      };
    }),
  };
  const policy: AssetPolicy = {
    assetId: hash(p.assetId),
    tokenRuntimeCodeHash: hash(p.tokenRuntimeCodeHash),
    implementationAddress:
      p.implementationAddress as AssetPolicy['implementationAddress'],
  };
  if (
    policy.assetId !== report.assetId ||
    report.reviewedThrough > report.sourceBlockTimestamp
  )
    throw Error('Reviewed context mismatch');
  return { policy, report };
}
