import { describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { QuoteRequest } from '@rwa/shared';
import {
  mapZeroX,
  parseAmount,
  parseQuoteRequest,
  quoteToken,
  QuoteService,
  rankQuotes,
} from './service';
const request = (patch: Partial<QuoteRequest> = {}): QuoteRequest => ({
  requestId: randomUUID(),
  mode: 'EXACT_INPUT',
  sellAssetId: 'ETH',
  buyAssetId: 'USDC',
  amountAtomic: '1000000000000000000000',
  originChainId: 1,
  chainIds: [1, 42161, 8453],
  comparisonScope: 'HYPOTHETICAL_CHAINS',
  slippageBps: 50,
  ...patch,
});
const provider = (
  r: QuoteRequest,
  chain: 1 | 42161 | 8453,
  patch: Record<string, unknown> = {},
) => ({
  liquidityAvailable: true,
  sellToken:
    quoteToken(chain, r.sellAssetId).address ??
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  buyToken:
    quoteToken(chain, r.buyAssetId).address ??
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  sellAmount: r.mode === 'EXACT_INPUT' ? r.amountAtomic : '6000000000',
  buyAmount: r.mode === 'EXACT_INPUT' ? '2940000000000' : r.amountAtomic,
  ...(r.mode === 'EXACT_INPUT'
    ? { minBuyAmount: '2925300000000' }
    : { maxSellAmount: '6060000000' }),
  ...patch,
});
describe('deterministic indicative quote service (synthetic provider fixtures)', () => {
  it('validates precision, uint256 bounds, identity, unknown fields and origin before requests', async () => {
    expect(parseAmount('1000', 18)).toBe('1000000000000000000000');
    expect(parseAmount('1.25', 6)).toBe('1250000');
    for (const s of ['1.0000001', '1e6', '-1', '01', '0'])
      expect(() => parseAmount(s, 6)).toThrow();
    expect(() => parseAmount((1n << 256n).toString(), 0)).toThrow();
    for (const r of [
      request({ buyAssetId: 'ETH' }),
      { ...request(), recipient: 'injection' },
      request({
        comparisonScope: 'ORIGIN_CHAIN',
        chainIds: [8453],
        originChainId: 1,
      }),
      request({ chainIds: [1, 1] }),
    ])
      expect(() => parseQuoteRequest(r)).toThrow();
  });
  it('requests full 1000 ETH, fixed URL, no taker/signing fields and strips execution payload', async () => {
    const r = request({ comparisonScope: 'ORIGIN_CHAIN', chainIds: [1] });
    const f = vi.fn<typeof fetch>(async (input, init) => {
      const u = new URL(String(input));
      expect(u.origin + u.pathname).toBe(
        'https://api.0x.org/swap/allowance-holder/price',
      );
      expect(u.searchParams.get('sellAmount')).toBe('1000000000000000000000');
      expect(u.searchParams.has('buyAmount')).toBe(false);
      expect(u.searchParams.has('taker')).toBe(false);
      expect(init?.redirect).toBe('error');
      return Response.json(
        provider(r, 1, {
          transaction: { data: '0xsecret' },
          allowanceTarget: 'secret',
          issues: { allowance: { spender: 'secret' } },
        }),
      );
    });
    const result = await new QuoteService({
      apiKey: 'test-only',
      fetch: f,
      now: () => 1000,
    }).compare(r);
    expect(result.executionAvailable).toBe(false);
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(result.rankingStatus).toBe('UNRANKED');
    expect(result.recommendedQuoteId).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('ranks full-size outputs as bigint with unknown gas, without inventing net costs', () => {
    const r = request();
    const rows = [
      mapZeroX(r, 1, provider(r, 1), 1000),
      mapZeroX(
        r,
        8453,
        provider(r, 8453, { buyAmount: '2980000000000' }),
        1001,
      ),
      mapZeroX(
        r,
        42161,
        provider(r, 42161, { liquidityAvailable: false }),
        1001,
      ),
    ];
    const result = rankQuotes(r, rows, 1002);
    expect(result.rankingStatus).toBe('PARTIAL');
    expect(result.recommendedQuoteId).toBe(rows[1]!.quoteId);
    expect(result.rankingBasis).toBe('GROSS_OUTPUT');
    expect(rows[0]!.fees.items[0]!.amountAtomic).toBeNull();
  });
  it('separates exact-output expected vs maximum and excludes ceiling-only ranking', () => {
    const r = request({
      mode: 'EXACT_OUTPUT',
      sellAssetId: 'USDC',
      buyAssetId: 'ETH',
      amountAtomic: '2000000000000000000',
    });
    const rows = [
      mapZeroX(r, 1, provider(r, 1), 1000),
      mapZeroX(
        r,
        42161,
        provider(r, 42161, {
          sellAmount: '6010000000',
          maxSellAmount: '6040000000',
        }),
        1000,
      ),
      mapZeroX(
        r,
        8453,
        provider(r, 8453, { sellAmount: null, maxSellAmount: '6020000000' }),
        1000,
      ),
    ];
    const result = rankQuotes(r, rows, 1000);
    expect(result.recommendedQuoteId).toBe(rows[0]!.quoteId);
    expect(result.quotes[2]!.rankingAmountAtomic).toBeNull();
    expect(result.quotes[2]!.maxSellAmountAtomic).toBe('6020000000');
    expect(result.rankingStatus).toBe('PARTIAL');
  });
  it('does not subtract embedded fees twice and does not guess impact from tolerance', () => {
    const r = request();
    const row = mapZeroX(
      r,
      1,
      provider(r, 1, {
        buyAmount: '990000000',
        minBuyAmount: '980000000',
        fees: {
          zeroExFee: {
            amount: '10000000',
            token: quoteToken(1, 'USDC').address,
          },
        },
        gas: '100000',
        gasPrice: '2000000000',
        estimatedPriceImpact: '0.05',
      }),
      1000,
    );
    expect(row.buyAmountAtomic).toBe('990000000');
    expect(row.fees.items[1]!.treatment).toBe('EMBEDDED');
    expect(row.fees.items[0]!.amountAtomic).toBe('200000000000000');
    expect(row.priceImpactBps).toBeNull();
    expect(row.fees.gasCoverage).toBe('SWAP_ONLY');
  });
  it('rejects mismatched identities/amounts, contradictory bounds, malformed and overflow', () => {
    const r = request();
    for (const patch of [
      { sellToken: '0xwrong' },
      { sellAmount: '1' },
      { buyAmount: '0' },
      { buyAmount: (1n << 256n).toString() },
      { minBuyAmount: '999999999999999' },
      { liquidityAvailable: null },
      { chainId: 8453 },
      { gas: '1.2' },
    ])
      expect(() => mapZeroX(r, 1, provider(r, 1, patch), 1000)).toThrow();
    const out = request({ mode: 'EXACT_OUTPUT' });
    expect(() =>
      mapZeroX(out, 1, provider(out, 1, { maxSellAmount: '1' }), 1000),
    ).toThrow();
  });
  it('expires exactly at deadline and excludes timestamp skew without a false winner', () => {
    const r = request();
    const a = mapZeroX(r, 1, provider(r, 1), 1000),
      b = mapZeroX(r, 8453, provider(r, 8453), 1011);
    const skew = rankQuotes(r, [a, b], 1011);
    expect(skew.quotes[0]!.rankingAmountAtomic).toBeNull();
    expect(skew.recommendedQuoteId).toBeNull();
    expect(
      rankQuotes(r, [a, b], 1030).quotes[0]!.rankingAmountAtomic,
    ).toBeNull();
  });
  it('preserves observation time across 10-second cache and deduplicates in-flight', async () => {
    let now = 1000;
    const r = request({ comparisonScope: 'ORIGIN_CHAIN', chainIds: [1] });
    const f = vi.fn<typeof fetch>(async () => Response.json(provider(r, 1)));
    const service = new QuoteService({
      apiKey: 'test',
      fetch: f,
      now: () => now,
    });
    const [a, b] = await Promise.all([
      service.compare(r),
      service.compare({ ...r, requestId: randomUUID() }),
    ]);
    expect(f).toHaveBeenCalledTimes(1);
    expect(a.quotes[0]!.quoteId).toBe(b.quotes[0]!.quoteId);
    now = 1009;
    expect((await service.compare(r)).quotes[0]!.observedAt).toBe(1000);
    expect(f).toHaveBeenCalledTimes(1);
    now = 1010;
    expect((await service.compare(r)).quotes[0]!.observedAt).toBe(1010);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('keeps partial failures and safe error reasons, never raw upstream secrets', async () => {
    const r = request();
    const f = vi.fn<typeof fetch>(async (input) => {
      const chain = Number(new URL(String(input)).searchParams.get('chainId'));
      return chain === 1
        ? Response.json(provider(r, 1))
        : chain === 42161
          ? new Response('private upstream detail', { status: 429 })
          : new Response('key=test', { status: 500 });
    });
    const result = await new QuoteService({
      apiKey: 'secret-key',
      fetch: f,
      now: () => 1000,
    }).compare(r);
    expect(result.quotes.map((q) => q.status)).toEqual([
      'AVAILABLE',
      'RATE_LIMITED',
      'PROVIDER_ERROR',
    ]);
    expect(result.recommendedQuoteId).toBeNull();
    expect(JSON.stringify(result)).not.toMatch(
      /secret-key|private upstream|key=test/,
    );
    expect(f).toHaveBeenCalledTimes(3);
  });
  it('times out without retry, reports missing credentials and rejects oversized response', async () => {
    const r = request({ comparisonScope: 'ORIGIN_CHAIN', chainIds: [1] });
    const f = vi.fn<typeof fetch>(() => new Promise(() => {}));
    const timed = await new QuoteService({
      apiKey: 'test',
      fetch: f,
      timeoutMs: 5,
    }).compare(r);
    expect(timed.quotes[0]!.status).toBe('TIMEOUT');
    expect(f).toHaveBeenCalledTimes(1);
    expect((await new QuoteService().compare(r)).quotes[0]!.reasonCode).toBe(
      'PROVIDER_NOT_CONFIGURED',
    );
    expect(
      (
        await new QuoteService({
          apiKey: 'test',
          fetch: async () => new Response('x'.repeat(262145)),
        }).compare(r)
      ).quotes[0]!.status,
    ).toBe('INVALID_RESPONSE');
  });
  it('sends only buyAmount for exact output and never creates a swap action', async () => {
    const r = request({
      comparisonScope: 'ORIGIN_CHAIN',
      chainIds: [1],
      mode: 'EXACT_OUTPUT',
      sellAssetId: 'USDC',
      buyAssetId: 'ETH',
      amountAtomic: '2000000000000000000',
    });
    const f = vi.fn<typeof fetch>(async (input) => {
      const u = new URL(String(input));
      expect(u.searchParams.get('buyAmount')).toBe(r.amountAtomic);
      expect(u.searchParams.has('sellAmount')).toBe(false);
      return Response.json(provider(r, 1, { sellAmount: null }));
    });
    const result = await new QuoteService({ apiKey: 'test', fetch: f }).compare(
      r,
    );
    expect(result.quotes[0]!.sellAmountAtomic).toBeNull();
    expect(result.recommendedQuoteId).toBeNull();
    expect(result.executionAvailable).toBe(false);
  });
});
