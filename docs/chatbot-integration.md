# Integrasi chatbot tahap pertama — PR #2 / issue #5

Status: integrasi lokal di branch `codex/5-chatbot-core-integration`, belum merge/deploy. Baseline hosted berasal dari PR #4 yang kini sudah merged ke main. Kontribusi Rafi `86d03ef` dan revisi `c97fbfe` disertakan melalui merge history. Revisi terbaru mulai memakai v2 dan desain kartu putih dengan border/shadow netral; gaya itu diadaptasi ke renderer canonical. Fallback harga buatan, query langsung Supabase yang melewati layanan domain, dan runtime tanpa boundary tidak digunakan. Scope ini menghubungkan popup/kartu chatbot dengan layanan core; penerimaan UI designer, saved history dan handoff wallet dari kartu tetap gate terpisah.

## Perubahan dan batas

- Satu runtime `BuiltInAgent` melalui entrypoint CopilotKit v2, paket runtime/react-core sama-sama dipin `1.77.2`. `AI_MODEL` konfigurasi server; tidak ada direct OpenAI loop `/api/chat` kedua. Postinstall telemetry Scarf tidak diizinkan. Script core, Postgres/Supabase/viem dan Node 24.18.0 dipertahankan.
- Lima tool guest membaca service yang sama dengan API: `searchListings`, `getListing`, `getPosition`, `getAssetContext`, `getPaymentQuotes`. `preparePurchase` hanya didaftarkan jika Supabase Web3 session diverifikasi server. Input Zod Standard Schema diperiksa lagi terhadap schema bersama; output juga divalidasi.
- Tidak ada harga, APY, tren atau jadwal dividen buatan. `incomeBps` adalah bagian income. Pendapatan berupa backing shares. DemoUSD Sepolia berbeda dari ETH/USDC mainnet. Quote tidak menyediakan swap, bridge, allowance atau signing.
- Kartu merender data tool yang valid; hasil parsial tidak ditampilkan sebagai angka final. ID kartu memakai thread/tool-call/kind. Quote kedaluwarsa ditandai ulang pada UI. Link preview membuka marketplace; pengguna masih memilih listing dan membuat preview baru di sana. **Handoff langsung preview → wallet belum selesai (6.7).**
- Chat sementara diterbitkan server dengan ticket HMAC 30 menit, cookie HttpOnly/SameSite dan ikatan identitas. Pergantian account/login/logout membatalkan akses ticket lama. Setiap pembukaan chat mempunyai thread berbeda, termasuk tab terpisah. Guest tidak membaca/menulis tabel private history. Refresh membuat percakapan baru; tidak mengaku menyimpan chat.
- Runtime hanya menerima info/run/connect/stop. Endpoints inspector, saved thread listing, memory, resource proxy dan suggestions ditutup. Client hanya mengirim pesan user baru; history berasal dari runner server. Client tool/state/context/prompt/model overrides dibuang.
- Batas: 6 langkah, 1.500 output tokens per model response, 60 detik/run, 12 detik/tool, maksimal 20 listing, satu run aktif/thread. Request HTTP maksimal 64 KiB; pesan 8.000 karakter; history 48.000 karakter; stream 1 MiB. Stop tidak mengirim atau membatalkan transaksi wallet. Read/DB yang tidak mendukung abort mungkin selesai setelah timeout; tool berikutnya tidak dimulai. Purchase preview tidak memindahkan dana.

## Menjalankan dan integrasi tim

Gunakan env backend existing pada `apps/web/.env.local` (ignored), plus `OPENAI_API_KEY`, `AI_MODEL`, `COPILOTKIT_TELEMETRY_DISABLED=true`, `DO_NOT_TRACK=1`. `APP_ORIGIN` harus sama persis dengan origin browser. Tanpa konfigurasi AI, klik chat menjelaskan unavailable dan marketplace tetap berfungsi. Tidak ada key di shared, browser atau Git. Model yang diuji dicatat di matriks verifikasi; pilihan deployment perlu menggunakan model yang tersedia bagi akun.

Popup berada di `ChatbotWrapper`, renderer di `features/assistant/cards.tsx`, domain tools di `server/assistant/tools.ts`. Afer dapat mengganti visual renderer tanpa mengganti DTO, nominal, state atau wallet authority. Rafi melanjutkan UX conversation/runtime pada jalur v2 yang sama. Jangan menghidupkan lagi route langsung OpenAI maupun mock harga pada runtime live.

**Batas deployment:** runner/history sementara dan quota masih process-local. Konfigurasi ini untuk development/integrasi satu proses; restart dapat kehilangan transcript. Beberapa instance Vercel tidak memiliki history, lock dan quota yang sama. Sebelum AI diaktifkan publik di Vercel, pilih runner/lock/quota bersama atau host runtime sebagai satu proses terkontrol, lalu uji reconnect serta batas sesi kembali. Jangan menyalakan fitur AI publik hanya karena build lolos. Deployment core existing tetap terpisah dan tidak diubah oleh PR ini.

## Matriks verifikasi

Rencana sebelum implementasi tercatat di issue #5. Bukti operasional lokal berada di `.local/chatbot-integration/` (ignored); tidak memasukkan transcript privat, secret, screenshot atau file mesin ke commit.

| Skenario                                           | Status                     | Bukti / batas                                                                                                                                     |
| -------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR asli install frozen                             | FAIL direproduksi          | `ERR_PNPM_IGNORED_BUILDS`, `@scarf/scarf@1.4.0`; CI PR #2 juga gagal                                                                              |
| Install sesudah perbaikan                          | PASS                       | Dependency/script core dipulihkan; postinstall Scarf ditolak secara eksplisit                                                                     |
| Tipe, lint, unit integrasi                         | PASS awal                  | 14 test: boundary sesi/origin/schema, guest allowlist, output malformed, preview idempotency, timeout/abort/error stream, precision/card identity |
| Live OpenAI → search → card                        | PASS                       | `gpt-4.1-mini`; localhost membaca indeks Sepolia Supabase; hasil kosong sesuai listing publik, snapshot FINALIZED/HEALTHY                         |
| Browser quote live 0x                              | PASS                       | 1 ETH, tiga chain, angka berasal dari service; sumber/fee partial/hypothetical dan expiry terlihat; tidak ada swap                                |
| Live asset / injection / concurrency / stop        | PENDING                    | Diperbarui setelah matriks HTTP selesai                                                                                                           |
| Seluruh `pnpm check`                               | PENDING                    | Diperbarui setelah perubahan akhir                                                                                                                |
| Saved history, designer acceptance, handoff wallet | NOT TESTED dalam slice ini | Task 6.6–6.8 tidak ditandai selesai; belum klaim seluruh acceptance AI                                                                            |
| Deployment AI Vercel / concurrency antar instance  | NOT TESTED / belum siap    | Butuh runtime state dan quota bersama seperti batas di atas                                                                                       |

Dokumentasi paket: [quickstart v2](https://docs.copilotkit.ai/quickstart), [server tools](https://docs.copilotkit.ai/server-tools), [useRenderTool](https://docs.copilotkit.ai/reference/hooks/useRenderTool). Kompatibilitas runtime harus dibuktikan tes repo, bukan hanya adanya dokumentasi.
