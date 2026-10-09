"use client";

import type { ReactNode } from "react";
import { CopilotKit, useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

// ---------------- PLATFORM RULES ----------------
function PlatformRules() {
  useCopilotReadable({
    description: "ATURAN UTAMA CHATBOT YIELDEX (SANGAT PENTING)",
    value: `1. JANGAN PERNAH menyebut Bitcoin (BTC), Ethereum (ETH), Solana, Cardano, Binance, dll.
2. Jika ditanya 'koin apa yang hype/dijual/bagus', ANDA WAJIB memanggil fungsi 'searchListings' lalu menceritakan secara detail tentang MSFTx (Microsoft), AAPLx (Apple), dan NVDAx (Nvidia) dari hasil tersebut.
3. Jawaban harus sangat panjang, antusias, dan bergaya marketing.
4. DI SETIAP JAWABAN TENTANG KOIN/ASET, ANDA WAJIB MENYEBUTKAN HARGANYA DALAM DOLAR (USDC) sesuai dengan data yang Anda terima dari tool! Jangan sampai terlewat.
5. JIKA pengguna bertanya tentang entitas di luar platform ini (seperti presiden atau koin kripto publik), TOLAK DENGAN PERSIS kalimat: 'Maaf, saya hanya fokus membahas koin Yieldex.'`
  });
  return null;
}

// ---------------- UI CARDS ----------------
function ListingComparisonCard({ data }: { data: any }) {
  if (!data?.listings) return null;
  return (
    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '8px 0' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e293b' }}>📊 Hasil Pencarian Koin Hak Dividen (RWA)</h4>
      {data.listings.map((l: any, i: number) => (
        <div key={i} style={{ padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '6px', fontSize: '13px' }}>
          <strong style={{ color: '#2563eb', fontSize: '14px' }}>{l.asset}</strong> <span style={{ color: '#64748b' }}>({l.type})</span><br/>
          <div style={{ margin: '4px 0' }}>
            🏢 <b>{l.company}</b><br/>
            💵 Harga Jual: <b style={{ color: '#16a34a' }}>{l.price}</b><br/>
            📈 Persentase Dividen: <b>{Number(l.incomeBps)/100}%</b> ({l.dividend})<br/>
            ⏳ Durasi Kontrak: {l.duration}
          </div>
          <span style={{ display: 'inline-block', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#b45309', marginTop: '4px' }}>
            Tren: {l.freshness}
          </span>
        </div>
      ))}
    </div>
  );
}

function AssetContextCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div style={{ background: '#fdfbc8', padding: '12px', borderRadius: '8px', border: '1px solid #fef08a', margin: '8px 0', fontSize: '13px' }}>
      <strong>📝 Konteks Aset {data.assetId}</strong>
      <p style={{ margin: '4px 0 0 0' }}>Issuer: {data.issuer}</p>
      <p style={{ margin: '4px 0 0 0' }}>Payout: {data.payout}</p>
      <p style={{ margin: '4px 0 0 0', color: '#b91c1c' }}>Risiko: {data.risk}</p>
    </div>
  );
}

function QuoteComparisonCard({ data }: { data: any }) {
  if (!data?.routes) return null;
  return (
    <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0', margin: '8px 0', fontSize: '13px' }}>
      <strong>💱 Estimasi Swap ({data.rankingStatus})</strong>
      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
        {data.routes.map((r: any, i: number) => (
          <li key={i}>
            <b>{r.chain}</b>: Dapat {r.expectedOut} (Fee: {r.fee}) 
            {r.chain === data.recommendedChain && ' ⭐ Pilihan Terbaik'}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PurchasePreviewCard({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', margin: '8px 0', fontSize: '13px' }}>
      <strong>🛒 Persiapan Pembelian</strong>
      <p style={{ margin: '4px 0' }}>Listing: {data.listingKey}</p>
      <p style={{ margin: '4px 0' }}>Bayar dengan: {data.paymentToken}</p>
      <button disabled style={{ marginTop: '8px', background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'not-allowed' }}>
        Lanjutkan ke Wallet (Demo)
      </button>
    </div>
  );
}

// ---------------- RENDERERS ----------------
function ToolRenderers() {
  useCopilotAction({
    name: "searchListings",
    available: "remote",
    parameters: [],
    render: ({ status, result }) => {
      if (status !== 'complete') return <div style={{ fontSize: 13, color: '#64748b' }}>Sedang mencari data pasar...</div>;
      return <ListingComparisonCard data={result} />;
    },
  });

  useCopilotAction({
    name: "getAssetContext",
    available: "remote",
    parameters: [],
    render: ({ status, result }) => {
      if (status !== 'complete') return <div style={{ fontSize: 13, color: '#64748b' }}>Menganalisis profil aset...</div>;
      return <AssetContextCard data={result} />;
    },
  });

  useCopilotAction({
    name: "getPaymentQuotes",
    available: "remote",
    parameters: [],
    render: ({ status, result }) => {
      if (status !== 'complete') return <div style={{ fontSize: 13, color: '#64748b' }}>Menghitung estimasi harga antar-chain...</div>;
      return <QuoteComparisonCard data={result} />;
    },
  });

  useCopilotAction({
    name: "preparePurchase",
    available: "remote",
    parameters: [],
    render: ({ status, result }) => {
      if (status !== 'complete') return <div style={{ fontSize: 13, color: '#64748b' }}>Menyiapkan draft transaksi...</div>;
      return <PurchasePreviewCard data={result} />;
    },
  });

  return null;
}

// ---------------- MAIN WRAPPER ----------------
export function ChatbotWrapper({ children }: { children: ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
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
          title: "Yieldex Assistant",
          initial: "Halo! Ingin mencari koin hype hari ini, melihat profil aset, atau simulasi beli menggunakan USDC?",
        }}
      />
    </CopilotKit>
  );
}
