import { describe, it, expect } from 'vitest';
import { parseReviewedFile } from './review-file.js';
const h = '0x' + '1'.repeat(64);
const fixture = () => ({
  policy: { assetId: h, tokenRuntimeCodeHash: h, implementationAddress: null },
  report: {
    assetId: h,
    sourceKind: 'SIMULATOR',
    evidenceHash: h,
    sourceBlockNumber: '9007199254740993',
    sourceBlockHash: h,
    sourceBlockTimestamp: '100',
    reviewedThrough: '99',
    events: [],
  },
});
describe('private reviewed report parser', () => {
  it('keeps integers above JS precision exact', () => {
    expect(
      parseReviewedFile(JSON.stringify(fixture())).report.sourceBlockNumber,
    ).toBe(9007199254740993n);
  });
  it('rejects number coercion, noncanonical integers and uint overflow', () => {
    for (const bad of [123, '01', '-1', '1e10', (2n ** 256n).toString()]) {
      const f = fixture();
      Object.assign(f.report, { sourceBlockNumber: bad });
      expect(() => parseReviewedFile(JSON.stringify(f))).toThrow();
    }
  });
  it('rejects unknown fields and invalid trust context', () => {
    for (const patch of [
      { reviewedThrough: '101' },
      { sourceKind: 'HTTP_200' },
      { assetId: '0x' + '2'.repeat(64) },
      { wallet: '0x123' },
      { evidenceHash: '0x' + '0'.repeat(64) },
    ]) {
      const f = fixture();
      Object.assign(f.report, patch);
      expect(() => parseReviewedFile(JSON.stringify(f))).toThrow();
    }
  });
  it('bounds file and events before processing', () => {
    expect(() => parseReviewedFile(' '.repeat(1024 * 1024 + 1))).toThrow();
    const f = fixture();
    Object.assign(f.report, { events: Array(1001).fill({}) });
    expect(() => parseReviewedFile(JSON.stringify(f))).toThrow();
  });
});

const event = (kind: unknown = 3, sourceRevision: unknown = 1) => ({
  eventId: h,
  sequence: '1',
  kind,
  effectiveAt: '99',
  multiplierBefore: '1000000000000000000',
  multiplierAfter: '1000000000000000000',
  issuerNonceAfter: '1',
  historyIndex: '1',
  sourceRevision,
  sourceOccurrenceKey: h,
  evidenceHash: h,
});
describe('reviewed event ABI classifications', () => {
  it.each([0, 1, 2, 3])('accepts kind %i with exact event integers', (kind) => {
    const f = fixture();
    Object.assign(f.report, { events: [event(kind)] });
    const parsed = parseReviewedFile(JSON.stringify(f)).report.events[0]!;
    expect(parsed.kind).toBe(kind);
    expect(parsed.multiplierAfter).toBe(1000000000000000000n);
    expect(parsed.issuerNonceAfter).toBe(1n);
  });
  it.each([-1, 4, 1.5, '3', null, true])('rejects invalid kind %s', (kind) => {
    const f = fixture();
    Object.assign(f.report, { events: [event(kind)] });
    expect(() => parseReviewedFile(JSON.stringify(f))).toThrow(
      'Invalid event enum/revision',
    );
  });
  it.each([0, -1, 4294967296, 1.5, '1', null])(
    'rejects invalid revision %s',
    (revision) => {
      const f = fixture();
      Object.assign(f.report, { events: [event(3, revision)] });
      expect(() => parseReviewedFile(JSON.stringify(f))).toThrow(
        'Invalid event enum/revision',
      );
    },
  );
});
