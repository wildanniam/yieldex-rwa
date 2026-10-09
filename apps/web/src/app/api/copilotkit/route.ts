import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const serviceAdapter = new OpenAIAdapter({ openai, model: 'gpt-4o-mini' });

const runtime = new CopilotRuntime({
  actions: [
    {
      name: 'searchListings',
      description: 'Mencari daftar token hak pendapatan/dividen perusahaan nyata (RWA) yang dijual pengguna di Yieldex.',
      parameters: [
        { name: 'query', type: 'string', description: 'Filter pencarian opsional', required: false }
      ],
      handler: async () => {
        return {
          kind: 'LISTING_COMPARISON',
          listings: [
            { key: 'LIST-001', asset: 'MSFTx (Microsoft)', type: 'PRIMARY', price: '420.50 USDC', incomeBps: '750', duration: '90 days', company: 'Microsoft Corporation', dividend: 'Dibayar bulanan dalam USDC', freshness: 'Sangat Diminati' },
            { key: 'LIST-002', asset: 'AAPLx (Apple)', type: 'SECONDARY', price: '175.50 USDC', incomeBps: '520', duration: '30 days remaining', company: 'Apple Inc.', dividend: 'Dibayar akhir bulan dalam USDC', freshness: 'Stabil' },
            { key: 'LIST-003', asset: 'NVDAx (Nvidia)', type: 'PRIMARY', price: '890.00 USDC', incomeBps: '1200', duration: '120 days', company: 'Nvidia Corp.', dividend: 'Dividen premium berbasis performa saham', freshness: 'Sedang Hype' }
          ]
        };
      }
    },
    {
      name: 'getAssetContext',
      description: 'Menjelaskan konteks aset, terms, risiko, dan underlying token dari sebuah koin.',
      parameters: [
        { name: 'assetId', type: 'string', description: 'Simbol aset, misal SPYx atau AAPLx', required: true }
      ],
      handler: async ({ assetId }: any) => {
        return {
          kind: 'ASSET_CONTEXT',
          assetId,
          issuer: assetId === 'SPYx' ? 'S&P 500 ETF Trust' : 'Apple Inc. Dividend',
          payout: 'USDC pada akhir periode',
          risk: 'Pasar saham bergantung pada sentimen makro.',
          demoFlag: true
        };
      }
    },
    {
      name: 'getPaymentQuotes',
      description: 'Membandingkan estimasi harga swap token (misal ETH ke USDC) melintasi beberapa chain.',
      parameters: [
        { name: 'sellAsset', type: 'string', description: 'Aset yang dijual (contoh: ETH)' },
        { name: 'buyAsset', type: 'string', description: 'Aset yang dibeli (contoh: USDC)' },
        { name: 'amount', type: 'number', description: 'Jumlah yang ditukar' }
      ],
      handler: async ({ sellAsset, buyAsset, amount }: any) => {
        return {
          kind: 'QUOTE_COMPARISON',
          routes: [
            { chain: 'Ethereum', expectedOut: amount * 2500 + ' USDC', fee: '5 USDC', status: 'AVAILABLE' },
            { chain: 'Arbitrum', expectedOut: amount * 2500 + ' USDC', fee: '0.1 USDC', status: 'AVAILABLE' }
          ],
          rankingStatus: 'RANKED',
          recommendedChain: 'Arbitrum'
        };
      }
    },
    {
      name: 'preparePurchase',
      description: 'Menyiapkan draf pembelian / checkout untuk pengguna.',
      parameters: [
        { name: 'listingKey', type: 'string', description: 'ID Listing yang ingin dibeli', required: true }
      ],
      handler: async ({ listingKey }: any) => {
        return {
          kind: 'PURCHASE_PREVIEW',
          listingKey,
          action: 'BUY_LISTING',
          paymentToken: 'USDC',
          status: 'READY_TO_SIGN',
          message: 'Silakan lanjutkan di wallet Anda.'
        };
      }
    },
    {
      name: 'getListing',
      description: 'Mengambil detail satu listing.',
      parameters: [{ name: 'listingKey', type: 'string' }],
      handler: async ({ listingKey }: any) => {
        return { key: listingKey, status: 'OPEN' };
      }
    },
    {
      name: 'getPosition',
      description: 'Mengambil posisi owner saat ini.',
      parameters: [{ name: 'positionKey', type: 'string' }],
      handler: async ({ positionKey }: any) => {
        return { positionKey, currentOwner: '0x123...' };
      }
    }
  ]
});

export const POST = async (req: NextRequest) => {
  console.log('--- NEW REQUEST TO /api/copilotkit ---');
  try {
    const clonedReq = req.clone();
    const body = await clonedReq.json();
    console.log('Incoming body:', JSON.stringify(body, null, 2).substring(0, 500) + '...');
  } catch (e) {
    console.error('Error logging request body:', e);
  }

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });
  
  const res = await handleRequest(req);
  console.log('Response status:', res.status);
  return res;
};
