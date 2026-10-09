## Why

Pemegang token saham dapat membutuhkan dana sekarang tanpa menjual hak atas pokok. Produk menyediakan perdagangan bagian pendapatan untuk jangka tertentu dengan backing terkunci dan kepemilikan/klaim onchain. Tim empat orang perlu satu kontrak perilaku dan data agar implementasi berbantuan AI dapat diintegrasikan tanpa perbedaan interpretasi.

## What Changes

- Menambah ledger backing dan posisi hak tanpa NFT, primary fixed-price sale dan secondary whole-position sale atomik.
- Menambah issuer event registry, metadata finalizer terbatas, per-position checkpoint, share accounting, payout claim, dan principal release yang menjaga cadangan.
- Mendukung beberapa token simulasi yang meniru mekanisme xStocks di Sepolia; adapter official-token dibuktikan melalui fork secara terpisah.
- Menambah read model/indexing, wallet transactions, authenticated private history dan antarmuka pengguna sesuai visual desainer.
- Menambah assistant untuk discovery/explanation/purchase preview hak serta read-only quote recommendations untuk token buy/sell; tidak ada swap/bridge execution atau model training wajib.
- Menetapkan satu versi data/interface/schema, task dependency dan risk-based verification untuk seluruh tim.

Capability di bawah menetapkan scope baseline. Core lokal sudah diimplementasikan dan mempunyai bukti tes; UI/chatbot final serta Sepolia masih terbuka. Status aktual mengikuti tasks.md dan docs/core-verification.md, bukan keberadaan proposal atau fixtures.

## Capabilities

### New Capabilities

- `asset-events`: allowlist/adapter, metadata classification, fingerprint, event ordering/finalization dan coverage.
- `income-accounting`: internal shares, principal/claims separation, dividend allocation, rounding, reserves dan payout.
- `rights-market`: primary listing/purchase/cancel, secondary resale, owner/expiry boundaries dan principal release.
- `read-model`: chain-authoritative indexing/API, reorg/freshness, schemas serta authenticated private data.
- `wallet-transactions`: deterministic previews, approvals/purchases/claims marketplace, receipt/replacement/recovery.
- `ai-assistant`: conversational discovery, explanation, cards, marketplace purchase preparation dan bounded tool authority.
- `quote-recommendations`: read-only amount-aware quotes, exact-input/output, fees, comparison and cross-chain assumptions.
- `integration-quality`: shared interface discipline, demo isolation, complete lifecycle evidence and reproducible validation.

### Modified Capabilities

Tidak ada baseline capability yang telah diarchive. `openspec/specs/` tetap kosong sampai acceptance change aktif lengkap dan archive sah; status implementasi parsial ada pada tasks.md.

## Impact

Target logis: Next.js web/server, worker, Foundry contracts, shared DTO/ABI/config, Supabase. OpenSpec, monorepo scaffold dan core runtime lokal sudah tersedia; integrasi UI/chatbot dan hosted/Sepolia deployment adalah tahap berikutnya. Tidak menambahkan external custody, signing agent, production issuer access atau eksekusi token exchange. Repo aktif adalah wildanniam/yieldex-rwa, dengan provenance import eksperimen pada docs/repository-import.md.

Read `docs/spec/decisions.md` for authority/status and `design.md` for architecture. Product decisions came from Wildan; routine technical choices are delegated and selected here with implementation gates. Current ownership: Afer UI, Rafi chatbot, Wildan/Codex core/quote/testing/integration. Team review task 1.1 remains open.
