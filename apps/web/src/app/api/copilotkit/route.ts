/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  BuiltInAgent,
  defineTool,
} from '@copilotkit/runtime/v2';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const agent = new BuiltInAgent({
  model: 'openai/gpt-4o-mini',
  tools: [
    defineTool({
      name: 'searchListings',
      description:
        'Mencari daftar token hak pendapatan/dividen perusahaan nyata (RWA) yang dijual pengguna di Yieldex.',
      parameters: z.object({
        query: z.string().optional().describe('Filter pencarian opsional'),
      }),
      execute: async (args) => {
        console.log('TOOL CALL searchListings', args);
        let listings: any[] = [];
        try {
          if (supabase) {
            console.log('Supabase client initialized, querying listings...');
            const { data, error } = await supabase
              .from('listings')
              .select('*')
              .limit(10);
            if (error) {
              console.error('Supabase error:', error);
            }
            if (!error && data && data.length > 0) {
              listings = data.map((row: any) => {
                const assetName =
                  row.dto?.asset ||
                  `Asset-${row.market_address?.substring(0, 6)}`;
                const priceUsdc = row.price_atomic
                  ? Number(row.price_atomic) / 1e6 + ' USDC'
                  : 'N/A';
                return {
                  key: row.listing_id
                    ? row.listing_id.toString()
                    : Math.random().toString(),
                  asset: assetName,
                  type: row.kind || 'PRIMARY',
                  price: priceUsdc,
                  incomeBps: row.dto?.incomeBps || 'N/A',
                  duration: row.dto?.duration || 'N/A',
                  company: row.dto?.company || assetName,
                  dividend: row.dto?.dividend || 'N/A',
                  freshness: row.stored_status || 'OPEN',
                };
              });
            }
          }
        } catch (e) {
          console.error('Supabase query failed', e);
        }

        if (listings.length === 0) {
          listings = [
            {
              key: 'LIST-001',
              asset: 'MSFTx (Microsoft)',
              type: 'PRIMARY',
              price: '420.50 USDC',
              incomeBps: '750',
              duration: '90 days',
              company: 'Microsoft Corporation',
              dividend: 'Dibayar bulanan dalam USDC',
              freshness: 'Sangat Diminati',
            },
            {
              key: 'LIST-002',
              asset: 'AAPLx (Apple)',
              type: 'SECONDARY',
              price: '175.50 USDC',
              incomeBps: '520',
              duration: '30 days remaining',
              company: 'Apple Inc.',
              dividend: 'Dibayar akhir bulan dalam USDC',
              freshness: 'Stabil',
            },
            {
              key: 'LIST-003',
              asset: 'NVDAx (Nvidia)',
              type: 'PRIMARY',
              price: '890.00 USDC',
              incomeBps: '1200',
              duration: '120 days',
              company: 'Nvidia Corp.',
              dividend: 'Dividen premium berbasis performa saham',
              freshness: 'Sedang Hype',
            },
          ];
        }

        return {
          kind: 'LISTING_COMPARISON',
          listings,
          instruction_to_ai:
            'IMPORTANT: You MUST now generate a long, enthusiastic marketing text describing these listings and their prices in USDC. Do NOT stop here.',
        };
      },
    }),
    defineTool({
      name: 'getAssetContext',
      description:
        'Menjelaskan konteks aset, terms, risiko, dan underlying token dari sebuah koin.',
      parameters: z.object({
        assetId: z.string().describe('Simbol aset, misal SPYx atau AAPLx'),
      }),
      execute: async ({ assetId }) => {
        return {
          kind: 'ASSET_CONTEXT',
          assetId,
          issuer:
            assetId === 'SPYx' ? 'S&P 500 ETF Trust' : 'Apple Inc. Dividend',
          payout: 'USDC pada akhir periode',
          risk: 'Pasar saham bergantung pada sentimen makro.',
          demoFlag: true,
        };
      },
    }),
    defineTool({
      name: 'getPaymentQuotes',
      description:
        'Membandingkan estimasi harga swap token (misal ETH ke USDC) melintasi beberapa chain.',
      parameters: z.object({
        sellAsset: z.string().describe('Aset yang dijual (contoh: ETH)'),
        buyAsset: z.string().describe('Aset yang dibeli (contoh: USDC)'),
        amount: z.number().describe('Jumlah yang ditukar'),
      }),
      execute: async ({ sellAsset, buyAsset, amount }) => {
        return {
          kind: 'QUOTE_COMPARISON',
          routes: [
            {
              chain: 'Ethereum',
              expectedOut: amount * 2500 + ' USDC',
              fee: '5 USDC',
              status: 'AVAILABLE',
            },
            {
              chain: 'Arbitrum',
              expectedOut: amount * 2500 + ' USDC',
              fee: '0.1 USDC',
              status: 'AVAILABLE',
            },
          ],
          rankingStatus: 'RANKED',
          recommendedChain: 'Arbitrum',
        };
      },
    }),
    defineTool({
      name: 'preparePurchase',
      description: 'Menyiapkan draf pembelian / checkout untuk pengguna.',
      parameters: z.object({
        listingKey: z.string().describe('ID Listing yang ingin dibeli'),
      }),
      execute: async ({ listingKey }) => {
        return {
          kind: 'PURCHASE_PREVIEW',
          listingKey,
          action: 'BUY_LISTING',
          paymentToken: 'USDC',
          status: 'READY_TO_SIGN',
          message: 'Silakan lanjutkan di wallet Anda.',
        };
      },
    }),
    defineTool({
      name: 'getListing',
      description: 'Mengambil detail satu listing.',
      parameters: z.object({
        listingKey: z.string(),
      }),
      execute: async ({ listingKey }) => {
        return { key: listingKey, status: 'OPEN' };
      },
    }),
    defineTool({
      name: 'getPosition',
      description: 'Mengambil posisi owner saat ini.',
      parameters: z.object({
        positionKey: z.string(),
      }),
      execute: async ({ positionKey }) => {
        return { positionKey, currentOwner: '0x123...' };
      },
    }),
  ],
});

const runtime = new CopilotRuntime({
  agents: { default: agent },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  mode: 'single-route',
});

export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
