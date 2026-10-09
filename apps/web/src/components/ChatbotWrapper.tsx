/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-empty */
'use client';

import type { ReactNode } from 'react';
import { CopilotKit, useCopilotReadable } from '@copilotkit/react-core';
import { useRenderTool } from '@copilotkit/react-core/v2';
import { CopilotPopup } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { z } from 'zod';

// ---------------- PLATFORM RULES ----------------
function PlatformRules() {
  useCopilotReadable({
    description: 'ATURAN UTAMA CHATBOT YIELDEX (SANGAT PENTING)',
    value: `1. JANGAN PERNAH menyebut Bitcoin (BTC), Ethereum (ETH), Solana, Cardano, Binance, dll.
2. Jika ditanya 'koin apa yang hype/dijual/bagus', ANDA WAJIB memanggil fungsi 'searchListings' lalu menceritakan secara detail tentang MSFTx (Microsoft), AAPLx (Apple), dan NVDAx (Nvidia) dari hasil tersebut.
3. Jawaban harus sangat panjang, antusias, dan bergaya marketing.
4. DI SETIAP JAWABAN TENTANG KOIN/ASET, ANDA WAJIB MENYEBUTKAN HARGANYA DALAM DOLAR (USDC) sesuai dengan data yang Anda terima dari tool! Jangan sampai terlewat.
5. JIKA pengguna bertanya tentang entitas di luar platform ini (seperti presiden atau koin kripto publik), TOLAK DENGAN PERSIS kalimat: 'Maaf, saya hanya fokus membahas koin Yieldex.'`,
  });
  return null;
}

// ---------------- UI CARDS ----------------
function ListingComparisonCard({ data }: { data: any }) {
  if (!data?.listings) return null;
  return (
    <div
      style={{
        background: '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        margin: '12px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h4
        style={{
          margin: '0 0 12px 0',
          fontSize: '15px',
          fontWeight: 600,
          color: '#0f172a',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '8px',
        }}
      >
        Market Listings
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.listings.map((l: any, i: number) => (
          <div
            key={i}
            style={{
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <strong
                style={{ color: '#0369a1', fontSize: '14px', fontWeight: 600 }}
              >
                {l.asset}
              </strong>
              <span
                style={{
                  background: '#e0f2fe',
                  color: '#0284c7',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                {l.type}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                color: '#334155',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Company
                </span>
                <span style={{ fontWeight: 500 }}>{l.company}</span>
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Price
                </span>
                <span style={{ fontWeight: 600, color: '#15803d' }}>
                  {l.price}
                </span>
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Income
                </span>
                <span style={{ fontWeight: 500 }}>
                  {Number(l.incomeBps) / 100}%
                </span>
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Duration
                </span>
                <span style={{ fontWeight: 500 }}>{l.duration}</span>
              </div>
            </div>
            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px dashed #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {l.dividend}
              </span>
              <span
                style={{
                  background: '#f1f5f9',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#475569',
                  fontWeight: 500,
                }}
              >
                Status: {l.freshness}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetContextCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div
      style={{
        background: '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        margin: '12px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h4
        style={{
          margin: '0 0 12px 0',
          fontSize: '15px',
          fontWeight: 600,
          color: '#0f172a',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '8px',
        }}
      >
        Asset Context: {data.assetId}
      </h4>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '13px',
          color: '#334155',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Issuer</span>
          <span style={{ fontWeight: 500 }}>{data.issuer}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Payout</span>
          <span style={{ fontWeight: 500 }}>{data.payout}</span>
        </div>
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            background: '#fef2f2',
            borderLeft: '3px solid #ef4444',
            borderRadius: '4px',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              color: '#b91c1c',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '2px',
            }}
          >
            Risk Profile
          </span>
          <span style={{ color: '#991b1b' }}>{data.risk}</span>
        </div>
      </div>
    </div>
  );
}

function QuoteComparisonCard({ data }: { data: any }) {
  if (!data?.routes) return null;
  return (
    <div
      style={{
        background: '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        margin: '12px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '8px',
          marginBottom: '12px',
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 600,
            color: '#0f172a',
          }}
        >
          Swap Estimates
        </h4>
        <span
          style={{
            background: '#f1f5f9',
            color: '#475569',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 500,
          }}
        >
          {data.rankingStatus}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.routes.map((r: any, i: number) => {
          const isBest = r.chain === data.recommendedChain;
          return (
            <div
              key={i}
              style={{
                padding: '10px',
                background: isBest ? '#f0fdf4' : '#f8fafc',
                borderRadius: '6px',
                border: isBest ? '1px solid #86efac' : '1px solid #cbd5e1',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <strong style={{ color: isBest ? '#166534' : '#334155' }}>
                  {r.chain}
                </strong>
                {isBest && (
                  <span
                    style={{
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    Best Route
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#475569',
                }}
              >
                <span>
                  Output:{' '}
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {r.expectedOut}
                  </span>
                </span>
                <span>Fee: {r.fee}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PurchasePreviewCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div
      style={{
        background: '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        margin: '12px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h4
        style={{
          margin: '0 0 12px 0',
          fontSize: '15px',
          fontWeight: 600,
          color: '#0f172a',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '8px',
        }}
      >
        Purchase Preview
      </h4>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '13px',
          color: '#334155',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Listing ID</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            {data.listingKey}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Payment Token</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            {data.paymentToken}
          </span>
        </div>
      </div>
      <button
        disabled
        style={{
          width: '100%',
          background: '#f1f5f9',
          color: '#94a3b8',
          border: '1px solid #cbd5e1',
          padding: '10px 16px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'not-allowed',
          textAlign: 'center',
        }}
      >
        Proceed to Wallet (Demo)
      </button>
    </div>
  );
}

// ---------------- RENDERERS ----------------
function ToolRenderers() {
  useRenderTool({
    name: 'searchListings',
    render: ({ status, args, result }) => {
      if (status !== 'complete') {
        return (
          <div
            style={{
              fontSize: 13,
              color: '#475569',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Analyzing market data...
          </div>
        );
      }
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch (e) {}
      }
      if (!parsedResult || !parsedResult.listings) {
        return (
          <div
            style={{
              fontSize: 13,
              color: '#b91c1c',
              padding: '16px',
              background: '#fef2f2',
              borderRadius: '12px',
              border: '1px solid #fca5a5',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Failed to load server data.
          </div>
        );
      }
      return <ListingComparisonCard data={parsedResult} />;
    },
  });

  useRenderTool({
    name: 'getAssetContext',
    render: ({ status, args, result }) => {
      if (status !== 'complete')
        return (
          <div
            style={{
              fontSize: 13,
              color: '#475569',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Loading asset profile...
          </div>
        );
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch (e) {}
      }
      return <AssetContextCard data={parsedResult} />;
    },
  });

  useRenderTool({
    name: 'getPaymentQuotes',
    render: ({ status, args, result }) => {
      if (status !== 'complete')
        return (
          <div
            style={{
              fontSize: 13,
              color: '#475569',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Calculating cross-chain estimates...
          </div>
        );
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch (e) {}
      }
      return <QuoteComparisonCard data={parsedResult} />;
    },
  });

  useRenderTool({
    name: 'preparePurchase',
    render: ({ status, args, result }) => {
      if (status !== 'complete')
        return (
          <div
            style={{
              fontSize: 13,
              color: '#475569',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Preparing transaction draft...
          </div>
        );
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch (e) {}
      }
      return <PurchasePreviewCard data={parsedResult} />;
    },
  });

  return null;
}
// ---------------- MAIN WRAPPER ----------------
export function ChatbotWrapper({ children }: { children: ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="default">
      <PlatformRules />
      <ToolRenderers />
      {children}
      <CopilotPopup
        defaultOpen={true}
        instructions="CRITICAL SYSTEM PROMPT: Anda adalah asisten virtual RWA Income Rights. TUGAS ANDA:
1. Panggil 'searchListings' jika ditanya koin apa yang hype/tersedia/dijual. SETELAH memanggilnya, Anda WAJIB menjabarkan masing-masing koin dalam bentuk teks yang panjang, lengkap, dengan gaya bahasa marketing yang antusias. Sebutkan nama perusahaan aslinya (seperti Microsoft, Apple, Nvidia), betapa menariknya dividen mereka, dan WAJIB SEBUTKAN HARGANYA DALAM DOLAR (USDC) di dalam paragraf tersebut.
2. Panggil 'getAssetContext' jika ditanya penjelasan rinci, risiko, atau underlying asset koin tertentu.
3. Panggil 'getPaymentQuotes' jika user ingin swap/menukar token (misal ETH ke USDC).
4. Panggil 'preparePurchase' jika user bilang ingin beli koin.
5. JIKA pengguna bertanya hal di luar RWA, investasi, kripto, atau platform ini (misal presiden, negara), TOLAK DENGAN PERSIS kalimat: 'Maaf, saya hanya fokus membahas koin Yieldex.'"
        labels={{
          title: 'Yieldex Assistant',
          initial:
            'Halo! Ingin mencari koin hype hari ini, melihat profil aset, atau simulasi beli menggunakan USDC?',
        }}
      />
    </CopilotKit>
  );
}
