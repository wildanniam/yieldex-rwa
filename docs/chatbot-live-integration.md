# Integrasi chatbot Rafi ke data canonical

Issue: [#21](https://github.com/wildanniam/yieldex-rwa/issues/21). Sumber kontribusi UI: [PR #18](https://github.com/wildanniam/yieldex-rwa/pull/18), commit `8b84300f27fada1bc576da11a721375c0b01afe2`. Implementasi dikembangkan dari main `708263383b5b6a8baf7ad07016dc4400e15f5327`. Dokumen ini membedakan integrasi source, pengujian lokal, dan deployment; bukan persetujuan merge atau klaim audit kontrak.

## Yang dipertahankan dan disatukan

Greeting, composer, markdown, bubble ungu dan hierarchy card Rafi diadaptasi ke satu CopilotKit v2 provider. Popup dan `/chat` memakai conversation surface yang sama; membuka halaman penuh tidak membuat model/run kedua. Shell, sidebar, background bersama, landing dan fairy launcher yang sudah disetujui tetap menjadi dasar visual.

Server tools tetap `searchListings`, `getListing`, `getPosition`, `getAssetContext`, `getPaymentQuotes`, dan `preparePurchase` untuk user terautentikasi. Tool menggunakan domain service yang sama dengan API marketplace; kartu dirender dari shared `AssistantCard {kind,payload}`. Nilai atomic tetap string dan tampilan menggunakan decimals token. Harga hak memakai payment token manifest, bukan diasumsikan USDC. Search kosong atau kegagalan provider tidak diganti listing, ticker, harga, ataupun quote contoh.

Pengujian OpenAI sungguhan menemukan bahwa instruksi prompt saja tidak cukup: model mengubah skala USDC dalam narasi dan mencampur token backing dengan posisi hak pendapatan meskipun kartunya benar. Karena itu, respons yang memakai tool mendapatkan penjelasan deterministik dari DTO tervalidasi. Kartu tetap muncul progresif; prose model ditahan sampai run selesai agar klaim sebelum pemanggilan tool tidak telanjur tampil. Respons tanpa tool tetap memakai model, sehingga tidak dianggap bebas dari kesalahan. Checkpoint dan saved history menyimpan keluaran yang sama dengan yang dilihat pengguna.

Halaman account tambahan yang ada di sumber PR18 berisi fixture untuk positions/listings/claims dan belum menjadi implementasi live. Sumber kontribusi tetap tersedia di PR/commit asli; halaman tersebut tidak diaktifkan sebagai data akun sungguhan melalui integrasi chat ini.

## Alur yang dapat dilanjutkan tim

1. Buka bubble atau `/chat`; tanpa wallet tersedia discovery, asset context dan quote.
2. Card listing membuka `/marketplace/live/[listingKey]`. Halaman tersebut membaca detail canonical, bukan kartu marketplace fixture.
3. `/wallet` memisahkan connect, switch network dan sign-in ownership. Tanda tangan login tidak memberi approval token.
4. User memilih membuat chat tersimpan baru secara eksplisit. Guest transcript tidak dipindahkan otomatis. Riwayat tersimpan berasal dari session Supabase Web3 yang diverifikasi server.
5. Review pembelian meminta intent baru dengan wallet/chain server. Approval token dan pembelian masing-masing memerlukan klik dan signature terpisah; executor yang sama dengan wallet console melakukan validasi/simulasi ulang.
6. Receipt observer menyimpan hash pada journal lokal dan melanjutkan pemantauan setelah refresh. Error endpoint submission tidak menyebabkan transaksi dikirim ulang.

`/chat` tidak mengirim transaksi. Quote ETH/USDC adalah pembacaan mainnet; marketplace berjalan di jaringan manifest (Sepolia atau Anvil lokal). Quote tidak menjalankan swap dan tidak mengubah DemoUSD menjadi USDC.

## State dan keamanan

- HMAC ticket terikat browser cookie HttpOnly, principal terverifikasi, thread UUID dan expiry. Ticket hanya di header, tidak di query URL/log.
- Browser hanya boleh mengirim satu pesan user baru. Riwayat assistant, tool result, context, owner dan wallet tidak berasal dari body browser.
- Checkpoint sementara di `app_private.assistant_threads` memiliki TTL 30 menit; tidak tersedia sebagai saved history atau PostgREST guest. Cleanup berjalan pada pembuatan sesi berikutnya.
- Lease dan version fence di PostgreSQL membatasi satu run per thread lintas instance. Permintaan stop dicatat per run, termasuk bila tiba sebelum run diterima server. Pembatalan awal menutup pesan user dengan penanda pembatalan tanpa memanggil model; stop terlambat tidak menghentikan run berikutnya. Catatan kontrol dibatasi 128 run per thread dan ikut dihapus saat thread kedaluwarsa. Run lama tidak dapat menimpa run yang telah mengambil alih.
- Penyimpanan user/assistant ke saved history dan checkpoint memakai transaksi yang sama. Terminal sukses stream diteruskan setelah commit; error tidak dipoles menjadi jawaban selesai.
- Account/network switch dan logout membersihkan tampilan chat lama; perubahan cookie diserialisasi, termasuk respons login yang terlambat. Model tidak memiliki private key, calldata bebas, approval atau tool broadcast.

## Migrasi dan konfigurasi

Terapkan `supabase/migrations/202610100001_assistant_state.sql` dan `supabase/migrations/202610100002_assistant_run_controls.sql` secara berurutan setelah migrasi existing, **sebelum** merilis runtime ini. Tabel assistant tidak berisi saldo/pokok/hak onchain dan tidak mengubah kontrak. Bila migrasi/config tidak tersedia, chat gagal dengan error tersanitasi; tidak memakai fallback state per-process yang menyesatkan.

Runtime memerlukan konfigurasi existing `DATABASE_URL`, CA PostgreSQL jika remote, `CURSOR_SECRET`, `APP_ORIGIN`, `OPENAI_API_KEY`, `AI_MODEL`, manifest dan RPC marketplace. `ZEROX_API_KEY` diperlukan untuk quote provider. Tidak ada dependency baru atau signer baru pada web.

`AI_STATE_DATABASE_URL` adalah override opsional untuk QA checkpoint sementara. Jika berbeda dari `DATABASE_URL`, mode SAVED ditolak agar transaksi riwayat tidak terpisah database. Lingkungan produksi cukup memakai `DATABASE_URL` yang sama. Jangan menyalin konfigurasi QA ke Vercel.

## Verifikasi yang dapat diulang

`pnpm check` menjalankan format, lint, types, TypeScript tests, Foundry, generated parity, spec validation dan build. Browser/provider gates tetap harus dilaporkan terpisah.

`pnpm local:deploy` lalu `pnpm test:chatbot:local` menguji alur canonical dengan Anvil loopback 8545 dan Supabase lokal khusus pada PostgreSQL 54332 / Auth 54331. Harness menolak koneksi remote. Jalankan pada deployment lokal baru: tes membatalkan salah satu listing dan menggunakan wallet Anvil publik. Tidak memakai signer Sepolia atau data user produksi. Konfigurasi Supabase lokal perlu mengaktifkan native Web3 Ethereum seperti environment auth QA existing.

Cakupan harness: tool/read API parity, exact integer amounts, empty result, auth native Web3, guest/foreign intent rejection, exact allowance lalu fresh ready preview, listing cancel race, indexer catch-up, riwayat/card dedupe dan isolasi akun, rollback atomik saat fault, stop/concurrent lease/takeover/replay/TTL/quota. Checkpoint dengan lease expired boleh selesai hanya bila fence belum diambil alih; takeover menolak commit lama.

Bukti lokal ini tidak menggantikan wallet browser Sepolia, deployment migrasi hosted, atau smoke test Vercel. Status akhir dan revision teruji dicatat pada PR integrasi.
