import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { describe, it, expect, vi } from 'vitest';
import type { Session, QuoteComparison } from '@rwa/shared';
import { validateData } from '@rwa/shared/validation';
import {
  searchInput,
  quoteInput,
  defaultSearch,
  listingInput,
} from '../../features/assistant/inputs';
import { assistantTools, boundedTool, type AssistantServices } from './tools';
const fixture = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(`../../../../../examples/${name}`, import.meta.url),
      'utf8',
    ),
  );
const listing = fixture('listing-primary.valid.json');
const meta = {
  schemaVersion: '1.0',
  requestId: randomUUID(),
  observedAt: 1791417605,
};
const page = {
  meta,
  items: [listing],
  pagination: { nextCursor: null, hasMore: false },
  snapshot: listing.listing.snapshot,
};
const session: Session = {
  userId: randomUUID(),
  walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  authChainId: 11155111,
  expiresAt: Math.floor(Date.now() / 1000) + 1000,
};
function setup() {
  const read = vi.fn(async () => page);
  const prepare = vi.fn(async () => ({
    meta,
    data: fixture('prepared-purchase.valid.json'),
  }));
  const market = vi.fn(async () => ({
    reads: { read },
    reader: {
      manifest: {
        chainId: 11155111,
        market: listing.listing.seller.replaceAll('a', '1'),
        registry: listing.asset.registryAddress,
        assets: [{ assetId: listing.asset.assetId }],
      },
    },
  }));
  // Deliberately synthetic service seams. Real provider proof is separate.
  const deps = {
    market,
    prepare,
    compare: vi.fn(
      async () => fixture('quote-comparison.valid.json') as QuoteComparison,
    ),
  } as unknown as AssistantServices;
  return { deps, read, prepare };
}
const call = (
  tools: ReturnType<typeof assistantTools>,
  name: string,
  input: unknown,
) =>
  (
    tools.find((t) => t.name === name)!.execute as (
      input: unknown,
    ) => Promise<unknown>
  )(input);
describe('assistant canonical tools (synthetic services)', () => {
  it('keeps Zod and shared input validation in conformance for boundaries and unknown fields', () => {
    for (const value of [
      defaultSearch,
      { ...defaultSearch, limit: 21 },
      {
        ...defaultSearch,
        limit: 1,
        maxPriceAtomic: ((1n << 256n) - 1n).toString(),
      },
      { ...defaultSearch, maxPriceAtomic: (1n << 256n).toString() },
      { ...defaultSearch, maxPriceAtomic: 123 },
      { ...defaultSearch, incomeBpsMin: 0 },
      { ...defaultSearch, wallet: 'spoof' },
      { ...defaultSearch, cursor: '' },
    ])
      expect(searchInput.safeParse(value).success).toBe(
        validateData('api.SearchListingsQuery', value).success,
      );
    const q = fixture('quote-comparison.valid.json').request;
    for (const value of [
      q,
      { ...q, amountAtomic: '1e18' },
      { ...q, amountAtomic: '01' },
      { ...q, amountAtomic: (1n << 256n).toString() },
      { ...q, chainIds: [1, 1] },
      { ...q, recipient: session.walletAddress },
      { ...q, mode: 'EXACT_OUTPUT' },
    ])
      expect(quoteInput.safeParse(value).success).toBe(
        validateData('quote.QuoteRequest', value).success,
      );
    expect(
      listingInput.safeParse({
        listingKey: listing.listing.listingKey,
        calldata: '0x',
      }).success,
    ).toBe(false);
  });
  it('registers only five read tools for guests and preserves the exact canonical page', async () => {
    const { deps, read } = setup();
    const tools = assistantTools(null, new AbortController().signal, deps);
    expect(tools.map((t) => t.name)).toEqual([
      'searchListings',
      'getListing',
      'getPosition',
      'getAssetContext',
      'getPaymentQuotes',
    ]);
    const result = await call(tools, 'searchListings', defaultSearch);
    expect(result).toEqual({ kind: 'LISTING_COMPARISON', payload: page });
    expect(read.mock.calls.length).toBe(1);
    const failed = await call(tools, 'searchListings', {
      ...defaultSearch,
      receiver: session.walletAddress,
    });
    expect(failed).toHaveProperty('error');
    expect(read.mock.calls.length).toBe(1);
  });
  it('rejects malformed upstream financial data and foreign deployment before read', async () => {
    const { deps, read } = setup();
    read.mockResolvedValueOnce({
      ...page,
      items: [{ ...listing, listing: { ...listing.listing, priceAtomic: 90 } }],
    });
    const tools = assistantTools(null, new AbortController().signal, deps);
    expect(await call(tools, 'searchListings', defaultSearch)).toHaveProperty(
      'error.code',
      'INVALID_TOOL_RESULT',
    );
    read.mockClear();
    expect(
      await call(tools, 'getListing', {
        listingKey: listing.listing.listingKey.replace('11155111', '1'),
      }),
    ).toHaveProperty('error.code', 'UNSUPPORTED_DEPLOYMENT');
    expect(read).not.toHaveBeenCalled();
  });
  it('uses verified buyer and idempotency for repeat purchase previews, never executes payment', async () => {
    const { deps, prepare } = setup();
    const tools = assistantTools(session, new AbortController().signal, deps);
    const input = { listingKey: listing.listing.listingKey };
    await call(tools, 'preparePurchase', input);
    await call(tools, 'preparePurchase', input);
    expect(prepare.mock.calls).toHaveLength(2);
    const calls = vi.mocked(deps.prepare).mock.calls;
    expect(calls[0]![0]).toEqual(session);
    expect(calls[0]![1]).toEqual(calls[1]![1]);
    expect(tools.some((t) => /swap|send|sign|approve/i.test(t.name))).toBe(
      false,
    );
    const expired = assistantTools(
      { ...session, expiresAt: 0 },
      new AbortController().signal,
      deps,
    );
    expect(await call(expired, 'preparePurchase', input)).toHaveProperty(
      'error.code',
      'AUTH_REQUIRED',
    );
  });
  it('isolates tool failures and honors timeout/stop without leaking exception details', async () => {
    const signal = new AbortController();
    expect(
      await boundedTool(async () => {
        throw new Error('postgres://secret');
      }, signal.signal),
    ).toHaveProperty('error.code', 'SERVICE_UNAVAILABLE');
    const pending = () => new Promise<never>(() => {});
    expect(await boundedTool(pending, signal.signal, 5)).toHaveProperty(
      'error.code',
      'TOOL_TIMEOUT',
    );
    signal.abort();
    const work = vi.fn(pending);
    expect(await boundedTool(work, signal.signal)).toHaveProperty(
      'error.code',
      'RUN_CANCELLED',
    );
    expect(work).not.toHaveBeenCalled();
  });
});
