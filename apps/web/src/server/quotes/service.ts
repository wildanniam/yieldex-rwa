import { randomUUID } from 'node:crypto';
import type {
  QuoteRequest,
  QuoteRow,
  QuoteComparison,
  TokenRef,
  FeeItem,
} from '@rwa/shared';
import { validateData } from '@rwa/shared/validation';

const USDC = {
  1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  42161: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
  8453: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
} as const;
const native = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const max = (1n << 256n) - 1n;
export function quoteToken(
  chainId: 1 | 42161 | 8453,
  symbol: 'ETH' | 'USDC',
): TokenRef {
  return {
    chainId,
    kind: symbol === 'ETH' ? 'NATIVE' : 'ERC20',
    address: symbol === 'ETH' ? null : USDC[chainId],
    name: symbol === 'ETH' ? 'Ether' : 'USD Coin',
    symbol,
    decimals: symbol === 'ETH' ? 18 : 6,
    isDemo: false,
  };
}
export function parseAmount(input: string, decimals: number): string {
  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 255 ||
    !/^(0|[1-9]\d*)(\.\d+)?$/.test(input)
  )
    throw new Error('Invalid decimal amount');
  const [whole, fraction = ''] = input.split('.');
  if (fraction.length > decimals) throw new Error('Excess token precision');
  const result =
    BigInt(whole!) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, '0') || '0');
  if (result <= 0n || result > max) throw new Error('Amount outside uint256');
  return result.toString();
}
export function parseQuoteRequest(value: unknown): QuoteRequest {
  const parsed = validateData('quote.QuoteRequest', value);
  if (!parsed.success) throw new Error('Invalid quote request');
  const r = parsed.data;
  if (
    r.sellAssetId === r.buyAssetId ||
    (r.comparisonScope === 'ORIGIN_CHAIN' && r.chainIds[0] !== r.originChainId)
  )
    throw new Error('Invalid quote identity or origin');
  return r;
}
const wireAddress = (token: TokenRef) => token.address ?? native;
const amount = (v: unknown, positive = true): string | null => {
  if (v === null || v === undefined) return null;
  if (
    typeof v !== 'string' ||
    !/^(0|[1-9]\d*)$/.test(v) ||
    v.length > 78 ||
    BigInt(v) > max ||
    (positive && BigInt(v) === 0n)
  )
    throw new Error('Invalid provider amount');
  return v;
};
function object(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v))
    throw new Error('Invalid provider object');
  return v as Record<string, unknown>;
}
function empty(
  r: QuoteRequest,
  chainId: 1 | 42161 | 8453,
  now: number,
  status: QuoteRow['status'],
  reasonCode: string | null,
): QuoteRow {
  return {
    quoteId: randomUUID(),
    mode: r.mode,
    chainId,
    providerId: '0x',
    status,
    sellToken: quoteToken(chainId, r.sellAssetId),
    buyToken: quoteToken(chainId, r.buyAssetId),
    sellAmountAtomic: null,
    buyAmountAtomic: null,
    minBuyAmountAtomic: null,
    maxSellAmountAtomic: null,
    priceImpactBps: null,
    observedAt: now,
    expiresAt: now + 30,
    blockNumber: null,
    fees: {
      items: [],
      bridgeCostIncluded: false,
      approvalCostIncluded: false,
      gasCoverage: 'UNKNOWN',
    },
    sourceNames: [],
    feeCompleteness: 'UNKNOWN',
    rankingBasis: r.mode === 'EXACT_INPUT' ? 'GROSS_OUTPUT' : 'GROSS_INPUT',
    rankingAmountAtomic: null,
    rankingToken: null,
    isHypothetical: r.comparisonScope === 'HYPOTHETICAL_CHAINS',
    reasonCode,
  };
}
export function mapZeroX(
  r: QuoteRequest,
  chainId: 1 | 42161 | 8453,
  raw: unknown,
  now: number,
): QuoteRow {
  const row = empty(r, chainId, now, 'AVAILABLE', null),
    v = object(raw);
  if (v.liquidityAvailable === false)
    return empty(r, chainId, now, 'NO_ROUTE', 'NO_LIQUIDITY');
  if (v.liquidityAvailable !== true)
    throw new Error('Missing liquidity status');
  if (
    typeof v.sellToken !== 'string' ||
    v.sellToken.toLowerCase() !== wireAddress(row.sellToken) ||
    typeof v.buyToken !== 'string' ||
    v.buyToken.toLowerCase() !== wireAddress(row.buyToken)
  )
    throw new Error('Provider token mismatch');
  if (v.chainId !== undefined && v.chainId !== chainId)
    throw new Error('Provider chain mismatch');
  row.sellAmountAtomic = amount(v.sellAmount);
  row.buyAmountAtomic = amount(v.buyAmount);
  if (r.mode === 'EXACT_INPUT') {
    if (
      row.sellAmountAtomic !== r.amountAtomic ||
      !row.buyAmountAtomic ||
      v.maxSellAmount != null
    )
      throw new Error('Invalid exact input');
    row.minBuyAmountAtomic = amount(v.minBuyAmount, false);
    if (
      row.minBuyAmountAtomic !== null &&
      BigInt(row.minBuyAmountAtomic) > BigInt(row.buyAmountAtomic)
    )
      throw new Error('Invalid output bounds');
  } else {
    row.maxSellAmountAtomic = amount(v.maxSellAmount);
    if (
      row.buyAmountAtomic !== r.amountAtomic ||
      (!row.sellAmountAtomic && !row.maxSellAmountAtomic) ||
      v.minBuyAmount != null
    )
      throw new Error('Invalid exact output');
    if (
      row.sellAmountAtomic &&
      row.maxSellAmountAtomic &&
      BigInt(row.maxSellAmountAtomic) < BigInt(row.sellAmountAtomic)
    )
      throw new Error('Invalid input bounds');
  }
  if (v.blockNumber !== undefined && v.blockNumber !== null)
    row.blockNumber = amount(
      typeof v.blockNumber === 'number' && Number.isSafeInteger(v.blockNumber)
        ? String(v.blockNumber)
        : v.blockNumber,
      false,
    );
  const gas = amount(v.gas, false),
    gasPrice = amount(v.gasPrice, false);
  const gasCost =
    gas !== null && gasPrice !== null ? BigInt(gas) * BigInt(gasPrice) : null;
  if (gasCost !== null && gasCost > max) throw new Error('Gas overflow');
  const items: FeeItem[] = [
    {
      kind: 'GAS',
      amountAtomic: gasCost?.toString() ?? null,
      token: quoteToken(chainId, 'ETH'),
      treatment: gasCost !== null ? 'ADDITIONAL' : 'UNKNOWN',
      provenance:
        '0x gas × gasPrice; swap estimate only, L2 data/approval/bridge not verified.',
    },
  ];
  const fees = v.fees == null ? {} : object(v.fees);
  for (const key of ['zeroExFee', 'integratorFee']) {
    const fee = fees[key];
    if (fee == null) continue;
    const f = object(fee),
      n = amount(f.amount, false);
    const t = [row.sellToken, row.buyToken].find(
      (t) =>
        typeof f.token === 'string' && wireAddress(t) === f.token.toLowerCase(),
    );
    if (!t || n === null) throw new Error('Unrecognized fee denomination');
    items.push({
      kind: 'PROVIDER',
      amountAtomic: n,
      token: t,
      treatment: 'EMBEDDED',
      provenance: `0x fees.${key}; included in provider amounts, do not subtract again.`,
    });
  }
  items.push({
    kind: 'DEX',
    amountAtomic: null,
    token: null,
    treatment: 'UNKNOWN',
    provenance:
      'Individual route fees are not separately verified; quoted amounts retained.',
  });
  row.fees = {
    items: items as QuoteRow['fees']['items'],
    gasCoverage: gasCost !== null ? 'SWAP_ONLY' : 'UNKNOWN',
    approvalCostIncluded: false,
    bridgeCostIncluded: false,
  };
  row.feeCompleteness = gasCost !== null ? 'PARTIAL' : 'UNKNOWN';
  if (v.route != null) {
    const route = object(v.route);
    if (route.fills !== undefined) {
      if (!Array.isArray(route.fills) || route.fills.length > 200)
        throw new Error('Invalid route');
      const names = route.fills.map((f) => object(f).source);
      if (
        !names.every(
          (n) => typeof n === 'string' && n.length > 0 && n.length <= 80,
        )
      )
        throw new Error('Invalid venue');
      row.sourceNames = [...new Set(names as string[])].slice(0, 30);
    }
  }
  // Price impact is not inferred from tolerance, chains, or undocumented fields.
  if (!validateData('quote.QuoteRow', row).success)
    throw new Error('Invalid normalized quote');
  return row;
}
export function rankQuotes(
  request: QuoteRequest,
  rows: QuoteRow[],
  now: number,
): QuoteComparison {
  const quotes = structuredClone(rows),
    available = quotes.filter((q) => q.status === 'AVAILABLE');
  const newest = Math.max(...available.map((q) => q.observedAt), 0);
  const basis = request.mode === 'EXACT_INPUT' ? 'GROSS_OUTPUT' : 'GROSS_INPUT';
  for (const q of quotes) {
    q.rankingBasis = basis;
    q.rankingAmountAtomic = null;
    q.rankingToken = null;
    if (
      q.status !== 'AVAILABLE' ||
      now >= q.expiresAt ||
      q.observedAt > now ||
      newest - q.observedAt > 10
    )
      continue;
    q.rankingAmountAtomic =
      request.mode === 'EXACT_INPUT' ? q.buyAmountAtomic : q.sellAmountAtomic;
    if (q.rankingAmountAtomic !== null)
      q.rankingToken =
        request.mode === 'EXACT_INPUT' ? q.buyToken : q.sellToken;
  }
  const ranked = quotes
    .filter((q) => q.rankingAmountAtomic !== null)
    .sort((a, b) => {
      const x = BigInt(a.rankingAmountAtomic!),
        y = BigInt(b.rankingAmountAtomic!);
      return x === y
        ? a.chainId - b.chainId
        : request.mode === 'EXACT_INPUT'
          ? x > y
            ? -1
            : 1
          : x < y
            ? -1
            : 1;
    });
  const rankingStatus =
    available.length === 0
      ? 'NO_AVAILABLE_QUOTES'
      : ranked.length < 2
        ? 'UNRANKED'
        : ranked.length === request.chainIds.length
          ? 'RANKED'
          : 'PARTIAL';
  const disclosures: QuoteComparison['disclosures'] = [
    'Estimasi indikatif saat ini; bukan prediksi atau jaminan eksekusi. Tidak ada eksekusi swap.',
    'Ranking memakai angka provider sebelum biaya tambahan yang belum lengkap. Gas, approval dan bridge bukan biaya nol.',
    'Satu kandidat per chain adalah rute agregator 0x, bukan perbandingan seluruh pool atau exchange.',
    request.comparisonScope === 'HYPOTHETICAL_CHAINS'
      ? 'Diasumsikan aset sudah ada pada setiap chain dan hasil tetap pada chain tersebut; biaya/waktu perpindahan belum dihitung.'
      : 'Hanya chain asal yang dipilih.',
    'Slippage tolerance adalah parameter skenario; aplikasi tidak menjamin batas itu pada layanan eksternal.',
  ];
  if (
    ranked.length >= 2 &&
    ranked[0]!.rankingAmountAtomic === ranked[1]!.rankingAmountAtomic
  )
    disclosures.push(
      'Hasil teratas setara; chain ID dipakai untuk urutan deterministik, bukan preferensi kualitas.',
    );
  const result: QuoteComparison = {
    request,
    quotes: quotes as QuoteComparison['quotes'],
    recommendedQuoteId:
      rankingStatus === 'RANKED' || rankingStatus === 'PARTIAL'
        ? ranked[0]!.quoteId
        : null,
    rankingBasis: basis,
    rankingStatus,
    observedAt: now,
    expiresAt: available.length
      ? Math.min(...available.map((q) => q.expiresAt))
      : now,
    disclosures,
    executionAvailable: false,
  };
  if (!validateData('quote.QuoteComparison', result).success)
    throw new Error('Invalid comparison');
  return result;
}
export class QuoteService {
  private cache = new Map<string, QuoteRow>();
  private pending = new Map<string, Promise<QuoteRow>>();
  private starts: number[] = [];
  constructor(
    private readonly config: {
      apiKey?: string | undefined;
      fetch?: typeof fetch;
      now?: () => number;
      timeoutMs?: number;
    } = {},
  ) {}
  private now() {
    return this.config.now?.() ?? Math.floor(Date.now() / 1000);
  }
  async compare(value: unknown): Promise<QuoteComparison> {
    const request = parseQuoteRequest(value);
    const rows = await Promise.all(
      request.chainIds.map((chain) => this.get(request, chain)),
    );
    return rankQuotes(request, rows, this.now());
  }
  private async get(
    r: QuoteRequest,
    chain: 1 | 42161 | 8453,
  ): Promise<QuoteRow> {
    const key = JSON.stringify([
      chain,
      r.mode,
      r.sellAssetId,
      r.buyAssetId,
      r.amountAtomic,
      r.slippageBps,
      r.comparisonScope,
    ]);
    const cached = this.cache.get(key);
    if (
      cached &&
      this.now() - cached.observedAt < 10 &&
      this.now() < cached.expiresAt
    )
      return structuredClone(cached);
    const existing = this.pending.get(key);
    if (existing) return structuredClone(await existing);
    const promise = this.fetch(r, chain);
    this.pending.set(key, promise);
    try {
      const row = await promise;
      if (row.status === 'AVAILABLE') {
        if (this.cache.size >= 200)
          this.cache.delete(this.cache.keys().next().value!);
        this.cache.set(key, row);
      }
      return structuredClone(row);
    } finally {
      this.pending.delete(key);
    }
  }
  private async fetch(
    r: QuoteRequest,
    chain: 1 | 42161 | 8453,
  ): Promise<QuoteRow> {
    const error = (status: QuoteRow['status'], reason: string) =>
      empty(r, chain, this.now(), status, reason);
    if (!this.config.apiKey)
      return error('PROVIDER_ERROR', 'PROVIDER_NOT_CONFIGURED');
    // Shared process budget: <=3 concurrent calls, <=4 starts/second. No retry loop.
    this.starts = this.starts.filter((t) => t === this.now());
    if (this.pending.size >= 3 || this.starts.length >= 4)
      return error('RATE_LIMITED', 'LOCAL_PROVIDER_BUDGET');
    this.starts.push(this.now());
    const url = new URL('https://api.0x.org/swap/allowance-holder/price');
    const params = {
      chainId: String(chain),
      sellToken: wireAddress(quoteToken(chain, r.sellAssetId)),
      buyToken: wireAddress(quoteToken(chain, r.buyAssetId)),
      slippageBps: String(r.slippageBps),
      [r.mode === 'EXACT_INPUT' ? 'sellAmount' : 'buyAmount']: r.amountAtomic,
    };
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await (this.config.fetch ?? fetch)(url, {
            headers: { '0x-version': 'v2', '0x-api-key': this.config.apiKey! },
            signal: controller.signal,
            redirect: 'error',
          });
          if (response.status === 429)
            return error('RATE_LIMITED', 'PROVIDER_RATE_LIMITED');
          if (!response.ok)
            return error('PROVIDER_ERROR', `PROVIDER_HTTP_${response.status}`);
          if (!response.body)
            return error('INVALID_RESPONSE', 'EMPTY_RESPONSE');
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let size = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > 262144) {
              await reader.cancel();
              return error('INVALID_RESPONSE', 'RESPONSE_TOO_LARGE');
            }
            chunks.push(value);
          }
          let raw: unknown;
          try {
            raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            return mapZeroX(r, chain, raw, this.now());
          } catch {
            return error('INVALID_RESPONSE', 'PROVIDER_SCHEMA_MISMATCH');
          }
        })(),
        new Promise<QuoteRow>((resolve) => {
          timeout = setTimeout(() => {
            controller.abort();
            resolve(error('TIMEOUT', 'UPSTREAM_TIMEOUT'));
          }, this.config.timeoutMs ?? 8000);
        }),
      ]);
    } catch {
      return error(
        controller.signal.aborted ? 'TIMEOUT' : 'PROVIDER_ERROR',
        'UPSTREAM_UNAVAILABLE',
      );
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
