# RWA Income Rights — Konteks Tim dan OpenSpec

**Status: starter monorepo tersedia; fitur produk belum diimplementasikan.** Working name ini bukan branding final. Empat anggota tim dan AI masing-masing menggunakan repository ini sebagai acuan bersama. Visual UI mengikuti desain tim; isi, state, tindakan dan format data mengikuti spec.

Produk memungkinkan Alice menjual bagian pendapatan token saham untuk periode tertentu dengan pembayaran di awal, sambil mempertahankan hak atas pokok. Bob dapat menjual ulang seluruh posisi; klaim lama tetap milik Bob dan tenggat awal tidak berubah. AI membantu pencarian, penjelasan/preview pembelian, serta rekomendasi quote token yang **tidak mengeksekusi swap**.

## Jalankan starter

Gunakan Node **24.18.0**, pnpm **11.3.0** serta Python/uv untuk pemeriksaan spec. Tidak diperlukan API key, RPC, wallet atau database untuk boot starter.

```sh
nvm install
nvm use
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Web: `http://127.0.0.1:3000`. Worker health: `http://127.0.0.1:3101/health`. Panduan lengkap, alternatif setup tanpa NVM/Corepack, command dan batas package ada di **[development guide](docs/development.md)**. `pnpm check` menjalankan pemeriksaan starter; hasil dan batasnya dicatat dalam [verification report](docs/starter-verification.md).

```text
apps/web             Next.js halaman starter, API health; ruang FE/backend/AI
apps/worker          Boot/health/shutdown; ruang indexer dan finalizer
packages/contracts   Foundry + generated interfaces; belum kontrak produk
packages/shared      Generated types, schema validator dan interface ABI
supabase             Tempat migration dan RLS tests; belum database produk
tests                Integration starter dan tempat E2E berikutnya
schemas/examples     Definisi data dan fixtures bersama
openspec/docs        Scope, interface, skenario, task dan panduan tim
```

ABI saat ini **INTERFACE_ONLY**. Tidak ada deployment address atau transaksi yang bisa dieksekusi. `pnpm generate` memperbarui file bersama; jangan edit generated files. Lanjutkan task yang dipilih di OpenSpec setelah menyepakati ownership dengan tim.

## Mulai dari sini

1. [PRD](docs/product.md): penjelasan produk dan simulasi.
2. [Keputusan aktif](docs/spec/decisions.md): scope yang berlaku dan usulan lama yang digantikan.
3. [Proposal OpenSpec](openspec/changes/build-rwa-income-rights/proposal.md), [design](openspec/changes/build-rwa-income-rights/design.md), [tasks](openspec/changes/build-rwa-income-rights/tasks.md).
4. Dokumen interface sesuai pekerjaan: [kontrak](docs/spec/contract-interface.md), [accounting/finality](docs/spec/accounting-and-finality.md), [data](docs/spec/data-contracts.md), [API](docs/spec/api-contract.md), [AI/quote](docs/spec/ai-and-quotes.md).
5. [Workflow kolaborasi](docs/spec/team-workflow.md) dan [verifikasi](docs/spec/verification.md).

[TEAM-CONTEXT.md](docs/TEAM-CONTEXT.md) adalah ekspor satu Markdown untuk dibagikan/upload ke AI teman. File itu dihasilkan dari sumber di repo; **jangan diedit langsung**. Versi repo terbaru mengalahkan ekspor lama. Tidak ada mekanisme yang otomatis mengubah konteks chat AI teman setelah file diperbarui.

## Otoritas dokumen

- Persetujuan manusia terbaru mengubah keputusan melalui revision spec yang tercatat.
- Perilaku normatif baseline: `openspec/changes/build-rwa-income-rights/specs/`.
- Data wire: `schemas/*.schema.json`; makna, validasi lintas field dan onchain ABI rencana: `docs/spec/`.
- Jika schema/spec/interface bertentangan: hentikan perubahan modul yang terdampak dan perbaiki paket bersama; jangan memilih diam-diam.
- PRD untuk pemahaman; laporan riset/evidence adalah jejak bukti historis, bukan pengganti kontrak interface terbaru.
- `openspec/specs/` sengaja kosong: fitur belum dibangun dan change belum diarchive.

## Tooling spesifikasi

OpenSpec **1.3.1** dipin sebagai dependency lokal. Runtime starter adalah Node **24.18.0**. Gunakan tool repo melalui pnpm agar versi konsisten. Syntax CLI terpasang adalah acuan bila halaman docs terbaru berbeda.

```sh
pnpm exec openspec status --change build-rwa-income-rights
pnpm spec:check
pnpm generate
pnpm generate:check
```

Validator dokumen memerlukan `jsonschema==4.25.1`; `pnpm spec:check` menjalankannya melalui uv. Runtime validator aplikasi memakai schema yang sama melalui shared package. OpenSpec diinisialisasi tanpa tool-specific skills (`--tools none`) supaya tidak menebak editor teman; masing-masing boleh menjalankan `pnpm exec openspec init --tools <tool-id>` setelah tools tim diketahui. Semua artifact tetap Markdown biasa dan dapat dibaca tanpa integrasi editor.

## Batas tahap ini

Repository tim: [wildanniam/eth-jkt](https://github.com/wildanniam/eth-jkt) (private). Wildan mengotorisasi satu initial push langsung ke `main` setelah pembersihan. Pekerjaan berikutnya menggunakan issue → branch fitur → checks → PR → review tim; pengecualian initial push tidak berlaku otomatis untuk perubahan berikutnya.

Arsitektur ada di [design](openspec/changes/build-rwa-income-rights/design.md). Foundation ini menyediakan proses, interface dan tooling; **market/accounting, token demo, provider, AI, wallet, database/RLS dan deployment tetap pekerjaan berikutnya**. Hanya task dengan bukti acceptance yang boleh dicentang. Test interface/schema tidak membuktikan keamanan ekonomi kontrak atau keberhasilan integrasi provider.

## Riset pendukung

- [Riset teknis](research/technical-notes.md) dan [evidence](research/evidence-2026-10-08/README.md).
- [Daftar sumber/research decisions](docs/spec/sources.md).
