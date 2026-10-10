import { randomUUID } from 'node:crypto';
import { defineTool } from '@copilotkit/runtime/v2';
import type { Session } from '@rwa/shared';
import { validateData, type SchemaName } from '@rwa/shared/validation';
import {
  assetInput,
  listingInput,
  positionInput,
  quoteInput,
  searchInput,
} from '../../features/assistant/inputs';
import { ApiFailure, apiError } from '../http';
import { marketContext } from '../market/context';
import { QuoteService } from '../quotes/service';
import { TransactionIntents } from '../transactions/service';

export const contextSource =
  'https://github.com/wildanniam/yieldex-rwa/blob/main/docs/spec/ai-and-quotes.md';
const quotes = new QuoteService({ apiKey: process.env.ZEROX_API_KEY });
export type AssistantServices = {
  market: typeof marketContext;
  compare: QuoteService['compare'];
  prepare: (
    session: Session,
    key: string,
    listingKey: string,
  ) => Promise<unknown>;
};
const services: AssistantServices = {
  market: marketContext,
  compare: (request) => quotes.compare(request),
  prepare: async (session, key, listingKey) => {
    const { db, reader } = await marketContext();
    const { intent } = await new TransactionIntents(db, reader).prepare(
      session,
      key,
      { action: 'BUY_LISTING', listingKey },
    );
    return { meta: meta(), data: intent };
  },
};
const meta = () => ({
  schemaVersion: '1.0' as const,
  requestId: randomUUID(),
  observedAt: Math.floor(Date.now() / 1000),
});
export function checked(name: SchemaName, value: unknown) {
  const result = validateData(name, value);
  if (!result.success)
    throw new ApiFailure(
      502,
      'INVALID_TOOL_RESULT',
      'Data layanan belum dapat diverifikasi.',
    );
  return result.data;
}
function entityPath(
  key: string,
  kind: 'listings' | 'positions',
  chainId: number,
  market: string,
) {
  const [namespace, chain, address, id] = key.split(':');
  if (namespace !== 'eip155' || chain !== String(chainId) || address !== market)
    throw new ApiFailure(
      400,
      'UNSUPPORTED_DEPLOYMENT',
      'Listing/posisi bukan dari marketplace ini.',
    );
  return ['chains', chain, 'markets', market, kind, id!];
}
// Abort prevents any later tool from starting; non-abortable DB/RPC reads may finish in the background.
export async function boundedTool(
  work: () => Promise<unknown>,
  signal: AbortSignal,
  timeoutMs = 12000,
) {
  if (signal.aborted)
    return apiError(
      new ApiFailure(408, 'RUN_CANCELLED', 'Permintaan dihentikan.'),
    ).json();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: () => void = () => {};
  try {
    return await Promise.race([
      work(),
      new Promise<never>((_, reject) => {
        const fail = () =>
          reject(
            new ApiFailure(
              504,
              'TOOL_TIMEOUT',
              'Data belum tersedia dalam batas waktu.',
            ),
          );
        timer = setTimeout(fail, timeoutMs);
        abort = fail;
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) fail();
      }),
    ]);
  } catch (error) {
    return apiError(error).json();
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
export function assistantTools(
  session: Session | null,
  signal: AbortSignal,
  deps = services,
) {
  const safe = (work: () => Promise<unknown>) => boundedTool(work, signal);
  const tools = [
    defineTool({
      name: 'searchListings',
      description:
        'Read open income-right listings. Default: ANY market, NEWEST, limit 20, assetIds [], other filters null. Price is DemoUSD payment for rights, incomeBps is share of income, never APY.',
      parameters: searchInput,
      execute: (args) =>
        safe(async () => {
          const input = searchInput.parse(args);
          const { reads, reader } = await deps.market();
          const q = new URLSearchParams();
          for (const [key, value] of Object.entries(input)) {
            if (key === 'assetIds')
              input.assetIds.forEach((id) => q.append('assetId', id));
            else if (value !== null) q.set(key, String(value));
          }
          const m = reader.manifest;
          const payload = checked(
            'api.ListingsPage',
            await reads.read(
              ['chains', String(m.chainId), 'markets', m.market, 'listings'],
              q,
              randomUUID(),
            ),
          );
          return { kind: 'LISTING_COMPARISON', payload };
        }),
    }),
    defineTool({
      name: 'getListing',
      description:
        'Read one listing using the full listingKey returned by searchListings. Never invent a key.',
      parameters: listingInput,
      execute: (args) =>
        safe(async () => {
          const { listingKey } = listingInput.parse(args);
          const { reads, reader } = await deps.market();
          return checked(
            'api.ListingResponse',
            await reads.read(
              entityPath(
                listingKey,
                'listings',
                reader.manifest.chainId,
                reader.manifest.market,
              ),
              new URLSearchParams(),
              randomUUID(),
            ),
          );
        }),
    }),
    defineTool({
      name: 'getPosition',
      description:
        'Read a public onchain position by positionKey returned by a listing. Not private chat history.',
      parameters: positionInput,
      execute: (args) =>
        safe(async () => {
          const { positionKey } = positionInput.parse(args);
          const { reads, reader } = await deps.market();
          return checked(
            'api.PositionResponse',
            await reads.read(
              entityPath(
                positionKey,
                'positions',
                reader.manifest.chainId,
                reader.manifest.market,
              ),
              new URLSearchParams(),
              randomUUID(),
            ),
          );
        }),
    }),
    defineTool({
      name: 'getAssetContext',
      description:
        'Read curated payout model and risks for an allowlisted assetId (bytes32 from search). No fabricated price, return, trends or company dividend schedule.',
      parameters: assetInput,
      execute: (args) =>
        safe(async () => {
          const { assetId } = assetInput.parse(args);
          const { reads, reader } = await deps.market();
          const m = reader.manifest;
          if (!m.assets.some((a) => a.assetId === assetId))
            throw new ApiFailure(
              400,
              'UNSUPPORTED_ASSET',
              'Aset tidak terdaftar.',
            );
          const response = await reads.read(
            [
              'chains',
              String(m.chainId),
              'registries',
              m.registry,
              'assets',
              assetId,
            ],
            new URLSearchParams(),
            randomUUID(),
          );
          const parsed = validateData('api.AssetResponse', response);
          if (!parsed.success)
            throw new ApiFailure(
              502,
              'INVALID_TOOL_RESULT',
              'Data aset tidak valid.',
            );
          const payload = checked('api.AssetContextResponse', {
            meta: parsed.data.meta,
            data: {
              asset: parsed.data.data,
              payoutModel: 'IN_KIND_REBASING_SHARES',
              isDemo: parsed.data.data.token.isDemo,
              summary:
                'Token ini adalah aset backing yang dikunci oleh penjual. Posisi marketplace merupakan hak terpisah atas bagian pendapatan untuk durasi tertentu, bukan token backing itu sendiri. Demo memakai token simulasi, bukan bukti kepemilikan saham nyata. Income dialokasikan sebagai shares token backing, bukan dividen USDC bulanan.',
              risks: [
                'Pendapatan tidak dijamin; incomeBps adalah proporsi pendapatan, bukan APY.',
                'Harga aset dapat berubah. Stock split bukan pendapatan.',
                'Klaim bergantung pada klasifikasi metadata dan finalisasi. Status yang belum jelas dapat menunda transaksi.',
                'DemoUSD Sepolia tidak sama dengan USDC mainnet.',
              ],
              sources: [
                {
                  title: 'Kontrak produk dan batas demo Yieldex',
                  url: contextSource,
                  observedAt: parsed.data.meta.observedAt,
                },
              ],
            },
          });
          return { kind: 'ASSET_CONTEXT', payload };
        }),
    }),
    defineTool({
      name: 'getPaymentQuotes',
      description:
        'Read-only live ETH/USDC mainnet price comparison. Call ONCE with ALL requested chainIds. Example hypothetical Ethereum + Arbitrum + Base: chainIds=[1,42161,8453], originChainId=null, comparisonScope=HYPOTHETICAL_CHAINS. Unknown origin is allowed for hypothetical comparisons. Never split them into one call per chain. Use integer strings (ETH 18 decimals, USDC 6), never floating point. Ask ambiguous amounts/direction/origin; unknown origin remains null for hypothetical chains. Default slippage 50 bps if user does not specify. No swap/bridge/signature.',
      parameters: quoteInput,
      execute: (args) =>
        safe(async () => {
          const data = await deps.compare(quoteInput.parse(args));
          return {
            kind: 'QUOTE_COMPARISON',
            payload: checked('api.QuoteComparisonResponse', {
              meta: meta(),
              data,
            }),
          };
        }),
    }),
  ];
  if (session) {
    // One idempotency key per listing in a run. Repeated model calls cannot create duplicate intents.
    const keys = new Map<string, string>();
    tools.push(
      defineTool({
        name: 'preparePurchase',
        description:
          'Prepare BUY_LISTING preview only after user requests a specific income-right listing. Server supplies authenticated buyer. Never signs, approves, sends payment or executes swap.',
        parameters: listingInput,
        execute: (args) =>
          safe(async () => {
            const { listingKey } = listingInput.parse(args);
            if (session.expiresAt <= Math.floor(Date.now() / 1000))
              throw new ApiFailure(
                401,
                'AUTH_REQUIRED',
                'Login wallet kembali untuk preview.',
              );
            const key = keys.get(listingKey) ?? randomUUID();
            keys.set(listingKey, key);
            const payload = checked(
              'api.PreparedIntentResponse',
              await deps.prepare(session, key, listingKey),
            );
            if (
              !validateData('api.AssistantCard', {
                cardId: 'validation',
                toolCallId: 'validation',
                kind: 'PURCHASE_PREVIEW',
                payload,
              }).success
            )
              throw new ApiFailure(
                502,
                'INVALID_TOOL_RESULT',
                'Preview bukan pembelian yang valid.',
              );
            return { kind: 'PURCHASE_PREVIEW', payload };
          }),
      }),
    );
  }
  return tools;
}
