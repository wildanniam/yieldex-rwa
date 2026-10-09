# Locked execution plan — 8 Oktober 2026

Wildan menyetujui implementasi autonomous dengan pengujian nyata sebelum melanjutkan bagian yang bergantung padanya. Riwayat implementasi: [issue #3 repo eksperimen](https://github.com/wildanniam/eth-jkt/issues/3) (private). Repo aktif sekarang Yieldex; [catatan import](../repository-import.md) membedakan bukti lama dan pemeriksaan pada checkout baru. Scope ekonomi dan interface v1 tetap baseline OpenSpec; lock ini bukan klaim implementasi selesai atau audit keamanan.

## Ownership dan handoff

| Workstream | Owner | Boundary |
| --- | --- | --- |
| Core, config, contracts, DB, worker, API, quote, wallet logic, testing/integrasi | Wildan/Codex | Canonical schemas/ABI/services; temporary functional UI memakai logic final yang sama |
| Visual UI/slicing | Afer | Konsumsi DTO/fixtures; perubahan desain tidak mengubah ekonomi |
| Chatbot runtime/tools/cards | Rafi | Konsumsi API dan quote service; tidak membuat quote engine lain |

Tidak mengklaim rekan telah membaca atau menyelesaikan handoff. Task 1.1 tetap terbuka sampai review tim benar-benar terjadi. Wildan mengotorisasi pekerjaan core sekarang berdasarkan baseline yang diterima; review tim tidak memblokir implementasi lokal Codex, tetapi perubahan shared interface harus tercatat dan tersedia untuk rekan sebelum integrasi.

## Gate sebelum dependent work

1. Tulis matriks tes per milestone, termasuk normal, boundary, failure/recovery dan regresi berdekatan.
2. Implementasikan bagian paling kecil yang lengkap; jalankan tes perilaku dan perbaiki kegagalan sebelum fitur dependent mengandalkannya.
3. Sebuah gate hanya PASS untuk scope yang terbukti. Unit test dengan mock bukan bukti provider, database, UI atau Sepolia.
4. Catat PASS, FAIL, BLOCKED atau NOT TESTED berikut command, revision, expected/actual dan batas bukti. Task OpenSpec baru dicentang setelah seluruh acceptance-nya terpenuhi.
5. Jika gate eksternal blocked, kerjakan bagian independen tanpa mengklaim dependency telah lulus. Bukti yang belum tersedia tetap eksplisit.
6. Jalankan integration/regression pada revisi gabungan. Passing bagian sebelumnya tidak menghapus kewajiban tes interaksinya setelah integrasi.
7. PR draft selama acceptance yang dijanjikan PR belum lengkap. Merge dan deployment mengikuti persetujuan yang berlaku; tidak menunggu merge untuk pekerjaan independen.

## Urutan dan matriks minimum

| Gate | Acceptance dan tes | Bukti yang belum boleh diklaim |
| --- | --- | --- |
| G1 Environment/manifest | chain separation, checksum/zero/duplicate address, asset identity, decimals, secrets absent; shared config unit + spec/generate/type checks | Address deployment nyata |
| G2 Mock/adapter | mint authority, shares vs tokens, rounding, split/reverse, pending override, pause/fee; pinned fork transfer/deposit/history normalization | Classification issuer trustless atau mainnet readiness |
| G3 Registry | roles, immutable identity, ordered event batches, fingerprint changes, coverage regression/future, quarantine isolation | Kebenaran HTTP issuer dari hash saja |
| G4 Market/accounting | V-01–V-19, independent integer oracle, fuzz dan stateful invariants, complete Alice/Bob/Carol lifecycle; payment/transfer rollback | UI/wallet/Sepolia journey |
| G5 Backend/worker/quote | schema/RLS dua pengguna, replay/reorg/restart, worker receipt reconciliation, quote exact-in/out/stale/error/net costs, real provider smoke | Sustained quote-only entitlement dari satu response |
| G6 Functional UI/integration | real browser requests/console, account/network switch, two buyers/tabs, reload, rejected/replaced transaction, final persisted balances; Afer/Rafi integration | Keberhasilan chatbot sebelum runtime rekan diuji |
| G7a Sepolia core | Setelah G2–G5 core dan recovery lulus: official-token fork, source-pinned deploy/seed (7.3), script/functional-harness lifecycle dengan finality nyata (7.8); tidak menunggu UI/chatbot final | Final UI/AI acceptance atau production financial safety |
| G7b Demo lengkap | G6, 7.1, 7.8 lalu full browser Sepolia/live quotes (7.4), security review dan runbook (7.5–7.6) | Real stock backing demo atau audit production |

Detailed financial matrix: [verification.md](verification.md). Semua gate dimulai NOT TESTED pada implementation branch; kesiapan provider sebelumnya hanya smoke akses, bukan gate produk.

## External gates saat mulai

Docker belum terhubung pada pemeriksaan terakhir; Supabase lokal belum berjalan. AI_MODEL kosong dan inference/runtime belum diuji. 0x price read berhasil sekali, tetapi pricing FAQ membatasi quote berkelanjutan tanpa transaksi; produk tetap tanpa swap, provider qualification wajib. Sepolia wallet memiliki 0.4 test ETH menurut screenshot; signer/deploy belum disiapkan. Afer/Rafi progress belum diverifikasi. Ini bukan alasan menurunkan acceptance atau mengarang data sukses.

## Checkpoint 9 Oktober 2026

Core lokal, native auth admission, private history, 9 intent actions, reviewed-source outbox/reconciler, live read-only quote dan functional browser lifecycle sudah diuji. Lihat core-verification.md untuk batas tiap bukti. Docker/Supabase lokal sekarang berjalan. Gate Afer/Rafi dan Sepolia tetap terbuka; tidak ada deployment publik atau merge yang diklaim.
