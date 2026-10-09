# Yieldex — import baseline dan handoff

## Asal source

Repo aktif: [wildanniam/yieldex-rwa](https://github.com/wildanniam/yieldex-rwa), public. Initial commit adalah **import baseline eksperimen**, bukan klaim seluruh implementasi dibuat pada waktu initial commit.

- Source: repo private `wildanniam/eth-jkt`, branch `feat/verified-rwa-core`.
- Source commit: `fc03e032c186c51e13a274cd222cbaae4e11d47a`.
- Source Git tree: `879db6b5adea4bf25cbbe53cf1ce29c1fbd46ed7`.
- Pemilik tim mengonfirmasi bahwa panitia mengizinkan progres eksperimen dibawa. Ini konfirmasi dari pemilik tim; bukan verifikasi langsung dari panitia oleh repository ini.
- Snapshot hanya file tracked; tidak membawa Git history lama, private env/keys, local deployment/data, node_modules, build output atau raw QA artifacts.

Issue [#1](https://github.com/wildanniam/yieldex-rwa/issues/1) melacak import ini. Initial push adalah bootstrap yang diminta pemilik tim; setelahnya gunakan branch → tes → PR → review. Tidak perlu membuat PR kosong atau merge draft PR dari repo eksperimen untuk menyalin snapshot. Repo sumber dipertahankan tanpa perubahan.

## Scope dan bukti

Core/contracts/API/schema/accounting tidak diubah oleh import. Identitas repo, onboarding, status implementasi pada docs, pesan doctor dan project ID Supabase lokal disesuaikan. Nama package `@rwa/*`, schema IDs dan OpenSpec change `build-rwa-income-rights` tetap sama agar consumer tidak mengalami perubahan interface.

[Core verification](core-verification.md), [starter verification](starter-verification.md) dan [remediation](presepolia-remediation.md) adalah bukti historis repo eksperimen. Nomor issue/PR dan source hashes di sana tidak boleh dianggap issue atau commit yang ada di Git history baru. Tautan repo private mungkin tidak dapat dibaca reviewer publik; prosedur dan hasil relevan tetap tertulis di dokumen ini dan runbook lokal.

| Pemeriksaan checkout Yieldex                | Status                              | Batas                                                                                                                                                                                                         |
| ------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot integrity dan public-file scan     | PASS                                | 242 file sumber terjaga; satu dokumen import baru. Runtime/contracts/tests/schema/ABI/migrations/lockfile identik. Scan payload dan perbandingan nilai private env tidak menemukan secret                     |
| Frozen dependency install / toolchain       | PASS                                | pnpm install --frozen-lockfile pada checkout baru; Node 24.18.0, pnpm 11.3.0, Forge 1.7.1, Python/uv; doctor lulus                                                                                            |
| pnpm check / generated context              | PASS                                | 107 Vitest, 46 Foundry (fuzz 1000; invariant 128 × 64), format/lint/types, parity, OpenSpec 85 requirements/185 scenarios dan production build. Context dihasilkan ulang dari 67 sumber                       |
| Worker / recovery / replacement integration | PASS dengan batas eksekusi di bawah | Worker/recovery/recovery:edges memakai Anvil dan database sementara. Quarantine/adapter, nonce/replacement, upgrade 007, concurrency/restart dan history diverifikasi; tidak memigrasikan lab pengguna        |
| HTTP/browser boot dari production build     | PASS scope tanpa env                | /, /lab, /api/health HTTP 200; /api/v1/deployments HTTP 503 yang diharapkan saat backend belum configured. Browser lab/reload menampilkan unavailable, console tanpa error/warning. Bukan full wallet journey |
| Official-token pinned fork                  | PASS                                | 4 tes pada Ethereum block 26145883, runtime dari checkout Yieldex. Synthetic history/pause tetap synthetic, tidak broadcast                                                                                   |
| Hosted/Sepolia/full UI dan chatbot          | NOT TESTED                          | Tidak dilakukan sebagai bagian import                                                                                                                                                                         |

Satu run worker bersamaan dengan suite lain FAIL pada timeout RPC `anvil_mine` 2001 blok. Pengulangan terpisah pada kode dan assertion yang sama PASS, termasuk backwards-history test tersebut. Penyebab timeout tidak diklaim sebagai bug worker yang telah diperbaiki; jalankan regression berat secara terpisah bila host sibuk.

Revisi teruji dicatat pada issue import dan evidence lokal setelah commit. Historical pass tidak otomatis menjadi pass untuk deployment hosted. OpenSpec tetap **29/48 task selesai, 19 terbuka**; import ini tidak menyelesaikan task UI/AI/Sepolia.

## Melanjutkan bersama

Clone repo aktif dan ikuti [development](development.md) serta [CONTRIBUTING](../CONTRIBUTING.md). Afer memegang visual UI, Rafi chatbot, Wildan/Codex core/quote/testing/integrasi. Kerjaan rekan yang belum dipush ke source repo tidak tercakup snapshot; bawa ke branch masing-masing di Yieldex, review diff lalu tes bersama. Jangan mengganti seluruh folder dengan salinan lama atau force-push ke main.

Env lokal disiapkan terpisah dari source. Sepolia signer hanya untuk deployer/worker sesuai peran, tidak masuk Vercel/client/shared. Manifest/alamat deployment baru dibuat setelah deployment nyata dan harus dipakai bersama. Initial source ini belum terhubung ke project Vercel/Supabase hosted dan tidak memiliki deployment Sepolia.

Supabase local ID sekarang `yieldex-rwa`. Stack lama mungkin memakai port 54321/54322 yang sama; jangan reset atau hapus volumenya. Pilih satu stack berjalan atau atur port terpisah sebelum menyalakan stack baru. Integration fixtures memakai database sementara dan tidak memigrasikan dataset pengguna. UI `/lab`, deployment config dan pembacaan provider punya gates terpisah pada [execution plan](spec/execution-plan.md).
