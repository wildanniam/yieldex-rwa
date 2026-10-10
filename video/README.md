# Yieldex — film produk motion graphic

Draft v1 film explainer Yieldex: **87,5 detik, 1920×1080, 30 fps**, dibuat sebagai kode dengan [Remotion](https://www.remotion.dev/) 4.0.534 supaya setiap frame bisa direvisi, dirender ulang, dan konsisten dengan design system. Folder ini sengaja berdiri sendiri (punya `pnpm-workspace.yaml` dan lockfile sendiri) agar dependency video tidak ikut ke install `apps/*`/`packages/*` tim.

Belum ada audio. Naskah voice-over dan cue sound design ada di bawah.

## Jalankan

```sh
cd video
pnpm install --frozen-lockfile
pnpm studio          # preview interaktif (Remotion Studio)
pnpm render          # out/yieldex-film.mp4
pnpm assets          # out/assets/*.png: lembar aset + PNG transparan per aset
pnpm stills YieldexFilm 300,900,1500 out/stills   # frame tertentu
pnpm typecheck
```

Hasil render (`out/`) tidak di-commit.

## 1. Riset singkat

| Temuan                                                                                                                                                                                                                | Dipakai di film                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Video SaaS homepage paling efektif 60–90 detik; hook 0–6 dtk, mekanisme 2–3 langkah visual, bukti sebelum detik 80, satu CTA ([MAW](https://mawmotionstudios.com/saas-explainer-video-examples/))                     | 87,5 dtk; hook di detik 0; tiga langkah inti (lock & list → beli → klaim); bukti Sepolia di ~77 dtk; satu CTA              |
| Sebut produk dalam satu kalimat segera setelah masalah: "[Produk] adalah [kategori] yang [melakukan apa] untuk [siapa]" ([Demogent](https://demogent.com/blogs/saas-explainer-video))                                 | Detik ~12: "A marketplace for time-limited income rights on tokenized stocks."                                             |
| Jangan buka dengan logo; jangan jadikan tutorial; UI sebagai bukti, bukan plot (MAW)                                                                                                                                  | Logo kecil baru muncul bersama definisi; logo besar hanya di akhir. UI disederhanakan menjadi objek                        |
| Video fintech terasa dinamis lewat punch-in kamera, match cut, tipografi kinetik besar, dan UI diabstraksi menjadi geometri bersih ([Impractical — Rho](https://impractical.ai/launch-videos/rho-rho-close))          | Satu kamera kontinu di panggung marketplace, objek yang sama berpindah antar-beat, caption kata-per-kata, kartu UI bergaya |
| Remotion: animasi harus digerakkan `useCurrentFrame()`/`interpolate()`/`spring()`; CSS transition tidak dirender; scene didaftarkan sebagai komposisi ([remotion-dev/skills](https://github.com/remotion-dev/skills)) | Semua gerak frame-driven; tiap scene punya komposisi sendiri di Studio                                                     |

Fakta produk diambil dari `docs/product.md`, `docs/spec/decisions.md`, OpenSpec `build-rwa-income-rights` (rights-market, ai-assistant), `DESIGN.md`, dan `docs/hosted-rollout.md`.

## 2. Konsep: "objek, bukan slide"

Penonton harus paham **apa yang berpindah, apa yang tetap, dan siapa yang mengontrol** (prinsip yang sama dengan landing). Karena itu setiap konsep produk punya satu objek fisik yang konsisten sepanjang film:

| Objek                                | Arti                    | Aturan visual                                                         |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------- |
| Koin hijau 3D `demoAAPL`             | Token saham / principal | Tetap milik Alice; tidak pernah berpindah ke pembeli                  |
| Cincin cahaya                        | Hak pendapatan          | Lepas dari koin, dilipat jadi tiket, berpindah utuh ke Bob lalu Carol |
| Lintasan luar cincin + pin di jam 12 | Jam tenor dan expiry    | Mulai saat pembelian; tidak reset saat resale                         |
| Vault kaca                           | Backing yang dikunci    | Tidak bergerak sepanjang panggung                                     |
| Koin perak `$`                       | DemoUSD (pembayaran)    | Netral, tidak pernah hijau; selalu berlawanan arah dengan hak         |
| Tetes hijau kecil                    | Pendapatan in-kind      | Keluar dari vault, terbelah sesuai persentase                         |
| Kapsul hijau                         | Satu transaksi atomik   | "Both happen, or neither"                                             |
| Orb ungu                             | Yieldex AI              | Ungu hanya untuk AI (sesuai color-system spec)                        |

Kuning hanya dipakai sebagai tanda peringatan ("Income can be lower, or zero"); merah tidak dipakai. Font Inter dan token warna mengikuti `apps/web` (navy/green/purple). Facet logo diambil dari mark footer.

Teknik imersif yang dipakai: satu dunia dengan kamera bergerak (dolly/truck/zoom) alih-alih potongan slide; parallax debu dan lantai grid perspektif; koin 3D CSS dengan sheen yang mengikuti rotasi; jejak cahaya pada setiap perpindahan nilai; transisi "dive"/zoom-through antar-scene; spring dengan overshoot untuk kedatangan objek; grain dan vignette untuk tekstur sinematik.

## 3. Storyboard dan timing

| Waktu     | Scene          | Visual                                                                                                                    | Caption layar                                                                                | Yang harus dipahami                                     |
| --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 0:00–0:05 | Hook           | Koin berputar masuk; kamera dolly memperlihatkan timeline M1–M6 berisi tetes pendapatan                                   | "Your tokenized stocks earn income." → "Slowly. Over months."                                | Aset menghasilkan pendapatan di masa depan              |
| 0:05–0:08 | Masalah        | Koin dan pendapatan masa depannya pergi, menyisakan slot kosong "TODAY"                                                   | "Need cash today?" / "Selling means giving up the asset."                                    | Menjual = kehilangan aset                               |
| 0:08–0:15 | Ide + definisi | Koin kembali; cincin pendapatan terangkat dan terpisah; label Principal vs Income right; logo + definisi                  | "What if you could sell just the income?" + definisi satu kalimat                            | Kepemilikan dan pendapatan bisa dipisah                 |
| 0:15–0:27 | Lock & list    | Dive ke panggung; 5 koin masuk vault, tutup terkunci; cincin dilipat jadi tiket 50% · 6 bulan · 90 DemoUSD · valid 7 hari | "Lock the shares. Keep the ownership." → "Set your terms. Sell a share of the income."       | Backing dikunci, harga tetap, tenor dimulai saat dibeli |
| 0:27–0:35 | Beli           | Kursor Bob klik "Buy rights"; kapsul atomik; 90 DemoUSD ke Alice, cincin ke Bob; "Day 1 of 180"                           | "Bob buys the income right." → "Paid upfront. The clock starts now."                         | Pembayaran dan hak berpindah dalam satu transaksi       |
| 0:35–0:44 | Pendapatan     | Time-lapse ke hari 62; event dividen +1 demoAAPL terbelah 0,50/0,50 ke tray klaim                                         | "Income arrives. The contract splits it." → "Paid in the asset token. Claim anytime."        | Pembagian otomatis, payout in-kind, klaim kapan saja    |
| 0:44–0:53 | Resale         | Kamera ke Carol; kartu "Whole position · 118 days left · 45 DemoUSD"; cincin pindah tanpa reset; tray Bob tetap 0,50      | "Want out early? Resell the whole right." → "New owner. Same deadline."                      | Jual ulang utuh, expiry tetap, klaim lama milik Bob     |
| 0:53–0:57 | Ringkasan      | Wide shot keempat elemen; event kedua → Alice 1,00 · Bob 0,50 · Carol 0,50                                                | "Every share of income, accounted for."                                                      | Contoh resale di PRD §4                                 |
| 0:57–1:08 | AI             | Orb ungu; prompt diketik; 3 listing ilustratif; kartu "Before you buy"; preview "Confirm in wallet"                       | "Not sure? Ask Yieldex AI." + "Read-only quotes · No automatic swaps · Your wallet confirms" | AI membantu cari/jelaskan; tidak mengeksekusi           |
| 1:08–1:17 | Angka jujur    | Dial alokasi: income 200 → +10 (+11,11%), 100 → −40, 0 → −90                                                              | "The price is fixed. The income isn't."                                                      | Bukan pinjaman, tidak ada yield terjamin                |
| 1:17–1:22 | Bukti onchain  | Rantai blok dengan nama event kontrak asli; chip bukti Sepolia; alamat market                                             | "Backing, rights and claims, enforced by smart contracts."                                   | Aturan ditegakkan kontrak, sudah live di testnet        |
| 1:22–1:27 | Penutup        | Facet logo menyatu; tagline; CTA                                                                                          | "Your shares stay yours. Your income has options." + "Explore the Sepolia demo"              | Satu ajakan                                             |

## 4. Naskah voice-over (opsional)

Caption di layar sudah cukup untuk menonton tanpa suara. Jika ingin VO, berikut naskah yang sudah dipas ke timing (±150 kata/menit).

| Mulai | English (utama)                                                                                                                              | Bahasa Indonesia                                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00  | Your tokenized stocks earn income. Slowly, over months.                                                                                      | Saham tokenisasi kamu menghasilkan pendapatan. Pelan, selama berbulan-bulan.                                                                                     |
| 0:05  | Need cash today? Selling means giving up the asset.                                                                                          | Butuh dana hari ini? Menjual berarti melepas asetnya.                                                                                                            |
| 0:08  | What if you could sell just the income? That's Yieldex: a marketplace for time-limited income rights on tokenized stocks.                    | Bagaimana kalau yang dijual cukup pendapatannya? Itulah Yieldex: marketplace hak pendapatan berjangka untuk saham tokenisasi.                                    |
| 0:16  | Alice locks her shares in a vault and keeps the ownership. She offers fifty percent of the income for six months, at a fixed ninety DemoUSD. | Alice mengunci sahamnya di vault dan tetap memilikinya. Ia menawarkan lima puluh persen pendapatan selama enam bulan, dengan harga tetap sembilan puluh DemoUSD. |
| 0:27  | Bob buys. Payment and the right move in one transaction: both happen, or neither. His six-month clock starts now.                            | Bob membeli. Pembayaran dan hak berpindah dalam satu transaksi: terjadi bersamaan, atau tidak sama sekali. Tenor enam bulannya mulai sekarang.                   |
| 0:35  | When a dividend lands, the contract splits it. Each side claims their share, in the asset token, whenever they like.                         | Saat dividen masuk, kontrak membaginya. Masing-masing mengklaim bagiannya dalam token aset, kapan pun mereka mau.                                                |
| 0:44  | Want out early? Bob resells the whole right to Carol. New owner, same deadline. What Bob already earned stays his.                           | Ingin keluar lebih awal? Bob menjual ulang seluruh haknya ke Carol. Pemilik baru, tenggat tetap sama. Yang sudah Bob dapatkan tetap miliknya.                    |
| 0:58  | Not sure what you're buying? Ask Yieldex AI. It finds offers, explains the risks and prepares a preview. Your wallet always confirms.        | Ragu? Tanya Yieldex AI. Ia mencari penawaran, menjelaskan risiko, dan menyiapkan preview. Wallet kamu yang selalu mengonfirmasi.                                 |
| 1:08  | Because the price is fixed, but the income isn't. It can be higher, lower, or zero.                                                          | Karena harganya tetap, tapi pendapatannya tidak. Bisa lebih tinggi, lebih rendah, atau nol.                                                                      |
| 1:17  | Backing, rights and claims are enforced by smart contracts, live on Ethereum Sepolia.                                                        | Backing, hak, dan klaim ditegakkan smart contract, sudah live di Ethereum Sepolia.                                                                               |
| 1:22  | Yieldex. Your shares stay yours. Your income has options.                                                                                    | Yieldex. Sahammu tetap milikmu. Pendapatanmu punya pilihan.                                                                                                      |

## 5. Cue sound design

Musik: elektronik minimal/ambient, 100–110 BPM, build ringan sampai 0:31 lalu napas di 0:57 (masuk AI) dan resolve di logo. Gunakan musik berlisensi atau komposisi sendiri.

| Waktu                    | Cue                                                      |
| ------------------------ | -------------------------------------------------------- |
| 0:00                     | Pad masuk, shimmer saat koin berputar                    |
| 0:05–0:07                | Whoosh rendah ketika koin pergi; musik turun             |
| 0:08                     | Swell "what if"; 0:09–0:11 shimmer cincin terangkat      |
| 0:14.6                   | Whoosh dive ke panggung                                  |
| 0:16.5–0:17.9            | Lima klik koin masuk vault                               |
| 0:19.3                   | Klik gembok + pulse rendah                               |
| 0:21.7                   | Swish kartu terbuka; tick halus tiap baris 0:22.6–0:23.9 |
| 0:28.6                   | Klik tombol                                              |
| 0:29.4–0:31.7            | Dua whoosh berlawanan arah (DemoUSD vs hak)              |
| 0:31.9                   | Chime sukses "Settled"                                   |
| 0:36.9                   | Pulse dividen; 0:38.1–0:40.1 sparkle terbelah            |
| 0:46.3                   | Klik; 0:46.8–0:48.8 whoosh resale                        |
| 0:54.4–0:56.9            | Pulse + sparkle event kedua                              |
| 0:57.5                   | Transisi ungu, tone AI                                   |
| 0:58.9–1:00.4            | Tick mengetik; 1:01.9–1:02.6 pop kartu                   |
| 1:09.5 / 1:11.7 / 1:13.9 | Sweep dial per skenario (turun nada di skenario nol)     |
| 1:17–1:19.5              | Thud lembut tiap blok                                    |
| 1:22.7                   | Hit logo; 1:24.9 chime CTA                               |

## 6. Batas klaim (dicek terhadap spec)

- Semua angka adalah contoh hipotetis dari PRD §4 (90 DemoUSD, 50%, 6 bulan, 200/100/0, resale 45 DemoUSD). Film menyebutnya "Hypothetical… Not a forecast · Not a loan".
- Token adalah `demo*` dan DemoUSD simulasi; tidak ada klaim backing saham nyata. Tidak memakai logo emiten.
- Tidak ada NFT, transfer parsial, atau hadiah: resale ditampilkan sebagai "Whole position".
- AI ditampilkan read-only: tidak swap, tidak tanda tangan; wallet pengguna yang mengonfirmasi (AI-001/AI-006). Listing di chat diberi label "Illustrative listings · simulated demo tokens".
- Pembayaran dan hak berpindah atomik (MKT-005); tenor mulai saat pembelian (MKT-003); resale mempertahankan expiry dan klaim lama (MKT-006).
- Bukti yang ditampilkan berasal dari `docs/hosted-rollout.md` dan `deployments/sepolia.json`: deploy di Sepolia, 7 kontrak cocok di Sourcify, lifecycle lengkap 23 transaksi, alamat market `0x25e228…c76f`. Nama event di rantai blok adalah event asli `IIncomeRightsMarket`.
- CTA tidak memuat URL. Isi URL demo final di `src/copy.ts` setelah UI final dan chatbot terintegrasi; staging `/lab` saat ini masih functional harness.

## 7. Aset

Sumber aset adalah komponen React di `src/assets/`; `pnpm assets` merender lembar aset dan PNG transparan per aset ke `out/assets/`.

| Aset                                                      | File                                           |
| --------------------------------------------------------- | ---------------------------------------------- |
| Koin saham 3D, koin DemoUSD, tetes pendapatan             | `src/assets/Coins.tsx`                         |
| Cincin hak pendapatan + jam tenor                         | `src/assets/IncomeRing.tsx`                    |
| Vault kaca isometrik (tutup, gembok, tumpukan koin)       | `src/assets/Vault.tsx`                         |
| Tiket penawaran, kartu resale                             | `src/assets/OfferTicket.tsx`                   |
| Avatar Alice/Bob/Carol, saldo wallet, tray klaim          | `src/assets/People.tsx`                        |
| Kursor, kapsul transaksi atomik, jejak cahaya             | `src/assets/Interaction.tsx`                   |
| Orb AI, panel chat, kartu listing/penjelasan/preview      | `src/assets/AiOrb.tsx`, `src/assets/Chat.tsx`  |
| Dial alokasi, blok ledger                                 | `src/assets/Dial.tsx`, `src/assets/Ledger.tsx` |
| Logo mark (facet) + wordmark                              | `src/assets/Logo.tsx`                          |
| Atmosfer (glow, debu parallax, lantai grid, orbit, grain) | `src/assets/Atmosphere.tsx`                    |

Struktur lain: `src/copy.ts` (semua teks layar), `src/theme.ts` (token warna), `src/scenes/*` (lima scene), `src/Film.tsx` (perakitan dan overlap transisi), `src/AssetSheet.tsx` (asset kit).

## 8. Belum dikerjakan

- Audio (musik, SFX, VO) belum ada.
- Belum ada screen recording UI asli karena UI final Afer dan chatbot Rafi belum terintegrasi. Kartu di film adalah stilisasi design system; setelah UI final siap, scene AI dan tiket bisa diganti/dilengkapi capture asli sebagai bukti.
- Review desainer tim untuk visual film.
- Turunan: versi 9:16 untuk sosial, cutdown 30/15 detik, versi caption Bahasa Indonesia (cukup ganti `src/copy.ts`).
