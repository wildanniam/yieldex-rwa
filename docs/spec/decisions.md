# Keputusan Aktif — Baseline 1

Tanggal 8 Oktober 2026. **Approved product decisions** berasal dari diskusi Wildan; **selected technical design** dipilih agent di bawah mandat terbaru untuk menyelesaikan detail tanpa meminta approval rutin. Keduanya membentuk baseline rencana, bukan bukti sudah diimplementasikan. Perubahan ekonomi/trust/core UX di luar baseline tetap perlu dibahas.

## Scope yang sudah diterima

| ID | Keputusan | Implikasi |
| --- | --- | --- |
| D-01 | Income rights sementara atas token saham, pembayaran upfront | Buyer tidak mendapat pokok atau pengembalian harga pembelian; tidak menjanjikan dividen |
| D-02 | Multi-asset via allowlist dan adapter | Mulai satu mekanisme lalu konfigurasi beberapa aset; bukan menerima ERC-20 sembarang |
| D-03 | Backing terkunci saat primary listing | Belum dibeli boleh cancel/reclaim setelah accounting aman; bukan seluruh wallet terkunci |
| D-04 | Harga seller fixed; durasi mulai purchase | Listing validity default 7 hari terpisah; price edit cancel/relist |
| D-05 | Ledger posisi, tanpa NFT | Secondary menjual seluruh posisi lewat marketplace; tidak ada direct gift/partial transfer |
| D-06 | Resale tidak reset expiry | Checkpoint sebelum owner berubah; old claims tetap pada alamat sebelumnya |
| D-07 | Payout in-kind dengan claim shares terpisah | Pertumbuhan klaim yang belum diambil tetap milik penerimanya, termasuk setelah resale/expiry |
| D-08 | Event efektif pada token di [start,end), plus cursor | Detection/announcement/claim time bukan entitlement; split bukan dividend |
| D-09 | Team metadata finalizer disetujui untuk hackathon | Approval terbaru menyelesaikan gate riset lama; role terbatas, trusted event classification/completeness, no arbitrary withdrawal/recipient |
| D-10 | Data ambigu dapat menunda aksi terkait; payout keluar tidak auto-clawback | Tidak menjanjikan finalitas issuer atau maksimum withdrawal delay; tampilkan batas trust |
| D-11 | Tiga fungsi AI inti | Discovery/compare; explain/preview purchase hak; quote recommendations token buy/sell |
| D-12 | Quotes read-only, tanpa eksekusi swap/bridge | Mainnet data boleh; transaksi marketplace demo tetap Sepolia. Tidak perlu liquidity setup atau ML training |
| D-13 | Kontrak sungguhan Sepolia dengan token simulasi | Token demo bukan saham asli; real-token integration proof menggunakan fork terpisah |
| D-14 | Next.js/TS, Solidity/Foundry, wagmi/viem, OpenAI, Supabase | Data keuangan authoritative onchain, API key di server |
| D-15 | UI visual mengikuti desainer tim | Spec menetapkan data/status/tindakan; tidak memaksakan tema/layout |
| D-16 | Ownership diperbarui 8 Oktober | Afer UI; Rafi chatbot; Wildan/Codex core, quote, testing dan integrasi; review bersama 1.1 tetap terbuka |

## Pilihan teknis berdasarkan mandat

- Dua tanggung jawab onchain: income market/accounting dan registry event, adapter/library untuk token. Tidak memakai upgrade proxy pada produk hackathon. Role updater bukan AI model.
- Accounting memakai internal shares serta multiplier integer, rounding konservatif dan claim reserve. Lihat accounting-and-finality.md untuk formula normative dan recovery policy.
- Finalized coverage watermark berbeda dari freshness chain. Registry harus menyatakan cakupan sampai boundary sebelum principal keluar; live fingerprint guard melindungi perubahan owner sebelum data siap. Boundary rinci ada di contract-interface.md.
- Tidak membangun DEX atau testnet payment pool. Read-only quote source dikurasi; exact-input/exact-output, native/wrapped mapping dan cross-chain assumptions eksplisit.
- CopilotKit v2 dipilih sebagai arah runtime/card berdasarkan dokumentasi, memakai satu built-in agent dan server tools. Uji kompatibilitas versi adalah gate implementasi, bukan klaim sudah berjalan.
- Supabase Web3 sign-in untuk data privat; public market/quote tidak membutuhkan login. RLS dan signature identity tetap diuji sebelum memakai sesi privat.
- Satu repo aplikasi/kontrak/shared contracts, satu worker sebagai proses terpisah. Core lokal sudah dibuat dan diuji dalam pnpm workspace; UI/chatbot final dan Sepolia tetap gate berikutnya. Commands dan batas starter di [development guide](../development.md).
- Interface baseline diberi versi 1. Penambahan breaking field/function perlu revision serentak schema/spec/fixtures/consumers. Tidak ada fee platform pada demo; perubahan monetisasi diperlakukan perubahan ekonomi berikutnya.

## Riwayat yang digantikan

| Sebelumnya | Berlaku sekarang |
| --- | --- |
| Posisi NFT ERC-721 | Ledger onchain tanpa NFT |
| Dua pool pembayaran demo dan eksekusi swap | Quote recommendations read-only, pool nyata dibaca tanpa mengirim transaksi |
| Finalizer menunggu persetujuan | Disetujui eksplisit pada instruksi pembuatan spec ini |
| ML slippage lama harus dipakai | Tidak diperlukan baseline; data/model lama belum tervalidasi untuk pasar ini |
| Semua pola UI ditentukan agent | Desainer memilih visual; data dan perilaku wajib konsisten |

## Makna selesai

Paket spec selesai bila requirement/scenario, design/interface/schema/fixtures/task konsisten dan validator lulus. Produk baru selesai ketika implementasi serta bukti test sesuai docs/spec/verification.md tersedia. Archive OpenSpec bukan alat untuk membuat rencana tampak selesai.
