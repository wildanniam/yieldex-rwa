import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { QuoteService } from '../apps/web/src/server/quotes/service.js';
import type { QuoteRequest } from '@rwa/shared';
const service = new QuoteService({ apiKey: process.env.ZEROX_API_KEY });
if (!process.env.ZEROX_API_KEY)
  throw new Error('BLOCKED: ZEROX_API_KEY missing');
const results = [];
for (const mode of ['EXACT_INPUT', 'EXACT_OUTPUT'] as const)
  for (const sellAssetId of ['ETH', 'USDC'] as const) {
    const buyAssetId = sellAssetId === 'ETH' ? 'USDC' : 'ETH';
    const denomination = mode === 'EXACT_INPUT' ? sellAssetId : buyAssetId;
    const request: QuoteRequest = {
      requestId: randomUUID(),
      mode,
      sellAssetId,
      buyAssetId,
      amountAtomic: denomination === 'ETH' ? '100000000000000000' : '100000000',
      originChainId: 1,
      chainIds: [1, 42161, 8453],
      comparisonScope: 'HYPOTHETICAL_CHAINS',
      slippageBps: 50,
    };
    const result = await service.compare(request);
    results.push(result);
    console.log(
      mode,
      sellAssetId + '->' + buyAssetId,
      result.quotes
        .map(
          (q) =>
            `${q.chainId}:${q.status}${q.reasonCode ? ':' + q.reasonCode : ''}`,
        )
        .join(' '),
    );
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
await mkdir('.local', { recursive: true });
await writeFile(
  '.local/quote-smoke.json',
  JSON.stringify(
    {
      source: 'LIVE_READ_ONLY_0x_v2',
      results,
      limits:
        'A bounded smoke does not establish sustained quote-only plan entitlement. No swap execution was attempted.',
    },
    null,
    2,
  ) + '\n',
  { mode: 0o600 },
);
if (results.some((r) => r.quotes.some((q) => q.status !== 'AVAILABLE')))
  process.exitCode = 1;
