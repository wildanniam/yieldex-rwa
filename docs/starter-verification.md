# Starter verification — 8 Oktober 2026

Scope: starter monorepo pada 8 Oktober 2026. Pemeriksaan ini mencakup foundation sebelum initial push; riwayat diskusi/proses lokal tidak disertakan. Hasil CI untuk revisi GitHub tersedia pada tab Actions. Ini verifikasi fondasi, bukan bukti produk selesai atau keamanan dana.

## Pemeriksaan

| Skenario                                                                       | Status           | Bukti / batas                                                                                                                                         |
| ------------------------------------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen install pada folder bersih                                              | Passed           | Snapshot source di folder sementara bersih, tanpa node_modules/build/env; install --offline --frozen-lockfile memakai dependency cache lokal          |
| Format / ESLint / TypeScript / production build                                | Passed           | `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`; seluruh pnpm check juga lulus pada salinan bersih                                   |
| Shared schema / fixture / HTTP / worker tests                                  | Passed           | 43 TypeScript tests; fixture shape, integer overflow, no coercion, invalid port, liveness HTTP, 404/405, worker one-shot, occupied port, stop/restart |
| Solidity interface build dan wire compatibility                                | Passed           | Solidity 0.8.34, Forge 1.7.1; 3 tests untuk selector purchase, enum ordinal dan tuple encoding. Tidak ada implementasi market                         |
| Generated Solidity/types/schema/ABI/context parity                             | Passed           | 66 named wire definitions; 3 interface ABIs; 59 context sources. Empat controlled drift probes ditolak dan dipulihkan                                 |
| Spec, schema refs dan numerical boundary checks                                | Passed           | OpenSpec strict; 4 schemas, 244 refs, 29 fixtures, 1.554 integer checks; 84 requirements/169 scenarios; 3 tasks complete, 44 open                     |
| Web normal navigation / refresh / mobile                                       | Passed           | Browser nyata: halaman starter, health link, back/reload; mobile 390×844 tanpa horizontal overflow; desktop 1440×900                                  |
| Browser requests / console                                                     | Passed after fix | Initial favicon.ico 404 diperbaiki; fresh browser halaman → health → back/reload: request 200, 0 console errors/warnings                              |
| Worker compiled start tanpa env credentials                                    | Passed           | `pnpm --filter @rwa/worker start --once` menghasilkan FOUNDATION_ONLY/jobsEnabled=false lalu exit                                                     |
| Combined dev shutdown                                                          | Passed           | Ctrl-C pada pnpm dev menghentikan kedua proses; port 3000/3101 tidak lagi listen                                                                      |
| Production HTTP from clean build                                               | Passed           | next start: halaman/health 200, no-store, POST 405, API produk 404, favicon redirect 200; process dihentikan setelah QA                               |
| Cloud GitHub Actions                                                           | Not run          | Belum berjalan pada pemeriksaan lokal awal; lihat Actions untuk hasil revisi GitHub                                                                   |
| Protocol unit/fuzz/invariant/fork, provider, wallet, auth/RLS, full product UI | Not tested       | Di luar starter; belum diimplementasikan                                                                                                              |

## Lingkungan dan koreksi

macOS, Node 24.18.0, pnpm 11.3.0, Next 16.4.0 / React 19.3.0, TypeScript 5.9.3, Solidity 0.8.34, Forge/Anvil 1.7.1. Versi runtime dikunci di repo; toolchain global tidak diubah.

- Node default sebelumnya 20 tidak kompatibel dengan pnpm 11. Runtime proyek dipilih eksplisit melalui `.nvmrc`/`.node-version`.
- pnpm 11 menggunakan allowBuilds dan settings pada workspace YAML. Hanya binary/build scripts yang diperlukan diizinkan; postinstall OpenSpec yang sekadar mencetak hint dinonaktifkan.
- ESLint 10 gagal peer range plugin Next (react/import/a11y). ESLint 9.39.4 dipin agar peer checks bersih; registry menandainya deprecated. Upgrade lint menjadi pekerjaan tooling ketika plugin kompatibel, bukan peer override tersembunyi.
- Sandbox default menolak HTTP bind (EPERM). Listener test dijalankan dengan izin localhost, setelah error bind terisolasi; kemudian test normal dan recovery lulus.
- Tidak ada API key/database/RPC yang digunakan untuk boot. Endpoint health menyatakan FOUNDATION_ONLY; API produk belum dibuat dan mengembalikan 404.
- Bukti browser lokal berada di `output/playwright/` dan `.playwright-cli/`, di-ignore dari Git. Screenshot tidak menggantikan request/console/HTTP checks.

## Batas selesai

Task foundation yang benar-benar memenuhi acceptance dapat ditandai selesai dengan tautan laporan ini. Review bersama semua anggota (1.1), deployment/config asset nyata (1.4), dan seluruh fitur lanjutan tetap belum selesai. Generated ABI ditandai INTERFACE_ONLY; schema validity bukan otorisasi transaksi. Tiga semantic-invalid fixtures masih memerlukan pemeriksaan domain pada task produk.

Task foundation 1.2, 1.3 dan 1.5 selesai dalam batas tersebut. Dependency 1.2 dari review tim dipisahkan sesuai izin langsung Wildan menjalankan starter sebelum meet; 1.1 tetap review tim sebelum coding paralel. Checks ini tidak menandai requirement produk atau task 3.9 ABI implementasi produk selesai.

## Pemeriksaan sebelum initial push

Pembersihan pada 8 Oktober 2026 mempertahankan source, spec, fixtures, lockfile dan bukti riset; mengeluarkan empat berkas percakapan/proses historis; memindahkan PRD ke docs/product.md dan riset ke research/technical-notes.md. Referensi, workflow tim dan generated context diperbarui. Riwayat sebelum pembersihan tetap lokal; initial main dibuat dari snapshot bersih agar berkas yang dikeluarkan tidak ikut melalui parent commits.

- `pnpm check` lulus setelah pembersihan: 43 TypeScript tests, 3 Solidity interface tests, format/lint/typecheck, generated parity, strict OpenSpec/schema/link checks dan build.
- Pemeriksaan 144 calon berkas tidak menemukan path build/cache/env privat atau pola credential yang diperiksa. Ini pemeriksaan terbatas, bukan audit secrets menyeluruh.
- Kode runtime dan UI tidak berubah pada pembersihan. Bukti browser/production HTTP di atas berasal dari pemeriksaan starter sebelumnya; tidak diklaim sebagai pengujian browser ulang setelah perubahan dokumen.
- Repo private wildanniam/eth-jkt diperiksa kosong sebelum initial push. Initial push ke main diotorisasi langsung oleh Wildan; tidak ada deployment atau transaksi. Status CI cloud diperiksa terpisah pada commit GitHub.
