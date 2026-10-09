import { describe, it, expect, vi } from 'vitest';
import { classification, parseIssuerNode, pollIssuer } from './issuer.js';
const node = {
  eventId: 'public-fixture-1',
  version: 2,
  xstockSymbol: 'SPYx',
  caType: 'CashDividend',
  effectiveTimeUtc: '2026-06-18T04:00:00.000Z',
  multiplierOld: '1.003909240011759',
  multiplierNew: '1.005714560286254',
  status: 'Initial',
};
const response = (nodes: unknown[], extra: Record<string, unknown> = {}) =>
  Response.json({
    page: {
      currentPage: 1,
      pageSize: 100,
      totalPages: 1,
      totalNodes: nodes.length,
      hasNextPage: false,
      ...extra,
    },
    nodes,
  });
describe('issuer observation boundary', () => {
  it('preserves exact decimals and labels evidence without financial finality', async () => {
    const fetcher = vi.fn(async () => response([node]));
    const [x] = await pollIssuer('SPYx', fetcher);
    expect(x!.node.multiplierOld).toBe(node.multiplierOld);
    expect(x!.payloadHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(x!.sourceUrl).toMatch(/^https:\/\/api.xstocks.fi\/api\/v2\/public/);
    expect(classification(x!.node)).toBe('DIVIDEND');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('holds cancelled, unknown and non-increasing dividend classifications', () => {
    expect(classification({ ...node, status: 'Cancelled' })).toBe('HELD');
    expect(classification({ ...node, caType: 'UnknownSplit' })).toBe('HELD');
    expect(classification({ ...node, multiplierNew: '1' })).toBe('HELD');
  });
  it('rejects number coercion, excessive precision, overflow and foreign symbol', () => {
    for (const bad of [
      { ...node, multiplierOld: 1.2 },
      { ...node, multiplierOld: '1.1234567890123456789' },
      { ...node, multiplierOld: '1e18' },
      { ...node, multiplierOld: '9'.repeat(90) },
      { ...node, xstockSymbol: 'AAPLx' },
      { ...node, version: 0 },
    ])
      expect(() => parseIssuerNode(bad, 'SPYx')).toThrow();
  });
  it('detects incomplete, duplicated and changing pagination', async () => {
    await expect(
      pollIssuer('SPYx', async () => response([node], { totalNodes: 3 })),
    ).rejects.toThrow('INCOMPLETE');
    const duplicate = vi
      .fn()
      .mockResolvedValueOnce(
        response([node], { totalNodes: 2, totalPages: 2, hasNextPage: true }),
      )
      .mockResolvedValueOnce(
        response([node], { currentPage: 2, totalNodes: 2, totalPages: 2 }),
      );
    await expect(pollIssuer('SPYx', duplicate)).rejects.toThrow('DUPLICATE');
    const changed = vi
      .fn()
      .mockResolvedValueOnce(
        response([node], { totalNodes: 2, totalPages: 2, hasNextPage: true }),
      )
      .mockResolvedValueOnce(
        response([{ ...node, eventId: 'two' }], {
          currentPage: 2,
          totalNodes: 3,
          totalPages: 2,
        }),
      );
    await expect(pollIssuer('SPYx', changed)).rejects.toThrow(
      'SNAPSHOT_CHANGED',
    );
  });
  it('bounds pages/body and fails closed on unavailable provider', async () => {
    await expect(
      pollIssuer('SPYx', async () => new Response('no', { status: 503 })),
    ).rejects.toThrow('UNAVAILABLE');
    await expect(
      pollIssuer('SPYx', async () => response([], { totalPages: 11 })),
    ).rejects.toThrow('PAGINATION');
    await expect(
      pollIssuer('SPYx', async () => new Response('x'.repeat(1048577))),
    ).rejects.toThrow('BODY_LIMIT');
  });
});
