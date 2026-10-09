# Rekonsiliasi fondasi FE — PR #6 / issue #8

Scope: komponen/style Aver dari `2a2cdc8` digabung dengan main `df98030` yang sudah memuat chatbot canonical. Ini resolusi pada branch PR #6, bukan merge ke main atau final product UI acceptance.

## Keputusan integrasi

- Layout mempertahankan shell/sidebar Aver dan satu `ChatbotWrapper` dari main. Navigasi workspace memakai URL root agar berfungsi juga dari `/lab`; lab tetap dapat dibuka dari home/sidebar.
- Dependency UI dan chatbot digabung; lockfile dibuat package manager dari versi exact main. `lucide-react`/`framer-motion` tidak dipakai oleh kode PR dan dihapus; icon tetap SVG lokal sesuai spec Aver. Dependency core, script, DTO, server services, wallet controller, contracts, worker dan migrasi tidak diganti.
- Default style input berada di CSS base layer agar utility classes dan CSS modules dapat mempertahankan error/focus dan styling masing-masing. Lab tetap memakai surface/warna eksplisit agar background putih tidak mewarisi teks putih tema gelap. Launcher error chatbot tetap terbaca. Shell menyisakan ruang bawah agar kontrol terakhir tidak tertutup launcher.
- Halaman komponen tetap demonstrasi visual. Teks status lama dikoreksi, DemoUSD dibedakan dari USDT/mainnet, tombol showcase tidak mengaku menghubungkan wallet atau mengirim transaksi. Password contoh diberi ID/label eksplisit.
- Lima change UI dikembalikan dari archive ke active. Ada task verifikasi yang belum selesai saat diarsipkan, dan tes source-contract tidak membuktikan seluruh interaksi. Semua requirement tetap tersimpan pada delta masing-masing; salinan main-spec identik dihapus. Baseline produk tetap active, tidak ada acceptance ekonomi yang dicentang.

## Matriks sebelum implementasi

Issue #8 mencatat frozen install/full check, layout desktop/mobile, navigasi, native input, rendering lab/quote, chatbot configured/unavailable, console/request dan parity domain terhadap main. Bukti lokal terpisah dari provider, wallet dan final UI.

## Hasil

Build gabungan diuji sesudah resolusi dan perbaikan ruang launcher. Parent: Aver `2a2cdc84ecf2f37fc43cb62843dec8785d92b287` + main `df9803016b174db68cc42956a6e0a3b3fc839389`. Hash commit hasil dicatat di PR #6. Dokumentasi hasil tidak mengubah runtime.

| Skenario                                       | Status                 | Bukti / batas                                                                                                                                                             |
| ---------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen dependency install                      | PASS                   | Lockfile gabungan dipasang tanpa update versi core/AI                                                                                                                     |
| Full `pnpm check`                              | PASS                   | 136 Vitest / 18 files, 46 Foundry, format, lint, types, generation, strict spec/schema validation dan production builds                                                   |
| Parity core terhadap main                      | PASS                   | Tidak ada diff API/server, lab controller, contracts/shared, worker, schemas atau migrasi; perubahan fitur existing hanya CSS                                             |
| Home → lab → workspace dan reload              | PASS                   | Root anchor dan `/lab` bekerja, tiga demo assets SYNCED terbaca dari hosted index, empty finalized listings tetap jujur                                                   |
| Responsive / visual                            | PASS lingkup smoke     | Home/lab 390px dan desktop 1440px tanpa overflow horizontal; lab light surface dan popup/kartu chatbot terbaca                                                            |
| Password contoh / overlap launcher             | PASS setelah perbaikan | Show/hide lewat keyboard dan klik; ruang bawah shell mencegah launcher menutupi kontrol terakhir                                                                          |
| Manual quote live                              | PASS                   | Loading/disabled pulih; 1 ETH → USDC menghasilkan tiga quote AVAILABLE dari 0x; disclosure hypothetical/PARTIAL tetap ada                                                 |
| Chatbot live / card                            | PASS                   | OpenAI menghasilkan card canonical dari indeks FINALIZED/HEALTHY; hasil kosong tidak diganti listing rekaan                                                               |
| Live HTTP boundary / stop / recovery           | PASS                   | Foreign thread 403, inspector/proxy/injected assistant 400, concurrent run 409, wrong stop false, active stop true, run berikutnya selesai; live asset/quote tools sukses |
| AI tidak dikonfigurasi                         | PASS                   | UI menampilkan chat belum tersedia tanpa menghilangkan workspace; konfigurasi ini diuji pada proses lokal terpisah                                                        |
| Console / request                              | PASS dengan batas      | Tidak ada console error pada alur configured; HTTP matrix memverifikasi respons/status/stream nyata. Tidak mengklaim capture seluruh request browser                      |
| Semua form controls baru                       | NOT TESTED lengkap     | Belum dipakai dalam alur transaksi: OTP editing, uncontrolled toggle/slider, label/error associations, keyboard select/segmented tetap perlu acceptance sebelum integrasi |
| Wallet signing / chain lifecycle baru          | NOT TESTED pada PR ini | Browser QA tanpa wallet extension; tidak broadcast transaksi atau mengulang hosted lifecycle. Domain source identik main, suite lokal lulus                               |
| Final designer approval / AI public deployment | NOT TESTED             | Batas runner satu proses, saved history dan evaluasi AI di dokumen chatbot tetap berlaku; tidak deploy atau merge main                                                    |

Bukti browser/API disimpan lokal, tidak dikomit bersama source atau credential. Lima change UI tetap aktif sampai acceptance masing-masing benar-benar selesai. Resolusi conflict bukan klaim seluruh komponen UI siap produk.
