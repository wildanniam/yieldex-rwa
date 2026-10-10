# Yieldex — film produk motion graphic

Film explainer Yieldex v2: **94,4 detik, 1920×1080, 30 fps, dengan voice-over bahasa Inggris, musik original, dan sound design**. Film ini dibuat sebagai kode dengan [Remotion](https://www.remotion.dev/) 4.0.534, sehingga setiap frame bisa direvisi, dirender ulang, dan tetap konsisten dengan design system. Folder ini sengaja berdiri sendiri (punya `pnpm-workspace.yaml` dan lockfile sendiri) agar dependency video tidak ikut ke install `apps/*`/`packages/*` tim.

## Tonton tanpa render

[Unduh MP4 preview 720p](exports/yieldex-film-preview-720p.mp4): **1280×720, 30 fps, 94,4 detik, sekitar 8,2 MB**, lengkap dengan voice-over, musik, dan SFX hasil polish. File ini disimpan langsung di Git biasa, sehingga ikut terunduh saat clone atau pull branch `feat/product-film-video` tanpa Git LFS atau render ulang.

**Status preview:** MP4 yang tersimpan masih hasil polish pada `932cf71`. Revisi identitas Apple/AAPLx, Microsoft/MSFTx, NVIDIA/NVDAx dan USDC sudah tersedia di source; render versi ini dilakukan secara lokal dengan perintah di bawah.

Dari root repository di Mac:

```sh
git switch feat/product-film-video
git pull --ff-only
open video/exports/yieldex-film-preview-720p.mp4
```

Hanya salinan preview di `exports/` yang disimpan di Git. Master 1080p dan output build tetap berada di `out/` yang diabaikan Git.

## Jalankan

Butuh Node 24 dan pnpm. Untuk audio juga butuh [uv](https://docs.astral.sh/uv/), dengan dependency Python yang sudah dipin di script.

```sh
cd video
pnpm install --frozen-lockfile
pnpm audio           # musik + SFX + mix VO → public/audio/mix.wav (wajib sebelum render/preview audio)
pnpm studio          # preview interaktif (Remotion Studio)
pnpm render          # out/yieldex-film.mp4
pnpm assets          # out/assets/*.png: lembar aset + PNG transparan per aset
pnpm stills YieldexFilmSilent 300,900,1500 out/stills
pnpm typecheck
```

Untuk preview 720p versi terbaru (dari folder `video`):

```sh
pnpm audio
pnpm exec remotion render src/index.ts YieldexFilm out/yieldex-film-preview-720p.mp4 --scale=0.6666666667 --crf=26
open out/yieldex-film-preview-720p.mp4
```

`public/audio/mix.wav` dan `out/` adalah hasil build dan tidak di-commit. `pnpm audio` deterministik: menjalankannya ulang menghasilkan file yang identik (MD5 sama). Komposisi `YieldexFilmSilent` sama persis dengan film utama tanpa track audio, berguna untuk render cepat dan still.

## 1. Riset singkat

| Temuan                                                                                                                                                                                                           | Dipakai di film                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Video SaaS homepage paling efektif 60–90 detik; hook 0–6 dtk, mekanisme 2–3 langkah visual, bukti sebelum detik 80, satu CTA ([MAW](https://mawmotionstudios.com/saas-explainer-video-examples/))                | Hook di detik 0; tiga langkah inti (lock & list → beli → klaim); bukti Sepolia di ~82 dtk; satu CTA. Sedikit melewati 90 dtk karena narasi diberi ruang bernapas |
| Sebut produk dalam satu kalimat segera setelah masalah ([Demogent](https://demogent.com/blogs/saas-explainer-video))                                                                                             | Detik ~11: "Meet Yieldex. A marketplace for time-limited income rights on tokenized stocks."                                                                     |
| Jangan buka dengan logo; UI sebagai bukti, bukan plot (MAW)                                                                                                                                                      | Logo kecil bersama definisi; logo besar hanya di akhir; UI disederhanakan menjadi objek                                                                          |
| Fintech launch film terasa dinamis lewat punch-in kamera, match cut, tipografi kinetik, UI yang diabstraksi ([Impractical — Rho](https://impractical.ai/launch-videos/rho-rho-close))                            | Satu kamera kontinu, match cut antar-scene, caption kata-per-kata, kartu UI bergaya                                                                              |
| Remotion: animasi harus digerakkan `useCurrentFrame()`/`interpolate()`/`spring()`; CSS transition tidak dirender ([remotion-dev/skills](https://github.com/remotion-dev/skills))                                 | Semua gerak frame-driven; setiap scene punya komposisi sendiri di Studio                                                                                         |
| Kokoro-82M adalah TTS open-weight (Apache-2.0) yang kualitasnya bersaing dengan model jauh lebih besar; voice `af_heart` punya grade tertinggi ([hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)) | Voice-over memakai `af_heart`; dijalankan lokal via [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx)                                                   |

Fakta produk diambil dari `docs/product.md`, `docs/spec/decisions.md`, OpenSpec `build-rwa-income-rights` (rights-market, ai-assistant), `DESIGN.md`, dan `docs/hosted-rollout.md`.

## 2. Konsep: "objek, bukan slide"

Penonton harus paham **apa yang berpindah, apa yang tetap, dan siapa yang mengontrol**. Karena itu setiap konsep produk punya satu objek fisik yang konsisten sepanjang film:

| Objek                                | Arti                    | Aturan visual                                                         |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------- |
| Koin hijau 3D `AAPLx`                | Token saham / principal | Tetap milik Alice; tidak pernah berpindah ke pembeli                  |
| Cincin cahaya                        | Hak pendapatan          | Lepas dari koin, dilipat jadi tiket, berpindah utuh ke Bob lalu Carol |
| Lintasan luar cincin + pin di jam 12 | Jam tenor dan expiry    | Mulai saat pembelian; tidak reset saat resale                         |
| Vault kaca                           | Backing yang dikunci    | Tidak bergerak sepanjang panggung                                     |
| Koin perak `$`                       | USDC (pembayaran)       | Netral, tidak pernah hijau; selalu berlawanan arah dengan hak         |
| Tetes hijau kecil                    | Pendapatan in-kind      | Keluar dari vault, terbelah sesuai persentase                         |
| Kapsul hijau                         | Satu transaksi atomik   | "Both happen, or neither"                                             |
| Orb ungu                             | Yieldex AI              | Ungu hanya untuk AI (sesuai color-system spec)                        |

Kuning hanya dipakai untuk peringatan ("Income can be lower, or zero"); merah tidak dipakai. Font Inter dan token warna mengikuti `apps/web`. Facet logo diambil dari mark footer.

### Bahasa sinematik (v2)

Versi kedua sengaja keluar dari gaya landing page. Efeknya ada di `src/fx/`:

- **Kamera**: drift handheld halus ditambah shake yang dipicu dari cue suara yang sama (`src/cues.ts`), sehingga hentakan visual dan audio selalu jatuh di frame yang sama. Panggung marketplace dimiringkan 9° dalam perspektif 3D, lengkap dengan refleksi lantai dan contact shadow.
- **Cahaya**: bokeh tipis di tepi frame agar objek dan teks terbaca, anamorphic flare, god ray saat dividen jatuh, light sweep untuk time-lapse, bloom saat transisi, light leak yang bergerak, dan bokeh di latar depan dengan parallax yang lebih cepat dari dunia.
- **Gerak**: motion smear (ghost sample di sepanjang lintasan objek) untuk semua token yang terbang; burst partikel, shockwave, dan motes untuk lock, settle, dividen, klaim, dan logo.
- **Transisi**: kamera menembus cincin pendapatan ke panggung (portal); bloom ungu ke AI; zoom-through ke angka; teks pada dial memudar sebelum cincin membesar secara seragam, membuka scene ledger melalui aperture bundar; blok ledger menyatu menjadi logo.
- **Pembuka**: close-up makro dengan focus pull dan flare, lalu pull-back.

## 3. Storyboard dan timing

Semua timing berasal dari satu file, `src/timeline.ts`. Beat visual, penempatan VO, dan cue SFX semuanya merujuk ke file itu.

| Waktu       | Scene         | Visual                                                                                                    | VO (ringkas)                                                                    |
| ----------- | ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 0:00–0:08   | Hook/masalah  | Close-up koin → timeline pendapatan M1–M6 → koin "dijual" (smear) menyisakan slot kosong "TODAY"          | "Your tokenized stocks earn income. Slowly… Selling means giving up the asset." |
| 0:08–0:17   | Ide/definisi  | Cincin pendapatan terlepas (burst, shockwave), Principal vs Income right, logo + definisi, portal         | "So what if you could sell, just the income? Meet Yieldex…"                     |
| 0:17–0:28   | Lock & list   | Koin masuk vault, gembok + shockwave; cincin dilipat jadi tiket 50% · 6 bulan · 90 USDC · valid 7 hari    | "Alice locks her shares… half the income, for six months, at ninety USDC."      |
| 0:28–0:36   | Beli          | Kursor Bob, kapsul atomik, 90 USDC → Alice, cincin → Bob, "Settled"; "Day 1 of 180"                       | "Bob buys it… Both happen, or neither. His six-month clock starts now."         |
| 0:37–0:47   | Pendapatan    | Light sweep time-lapse → hari 62; god ray, +1 AAPLx terbelah 0,50/0,50 ke tray klaim                      | "When a dividend lands, the contract splits it… whenever they like."            |
| 0:47–0:57   | Resale        | Kartu "Whole position · 45 USDC", cincin pindah ke Carol, flare di pin expiry, klaim Bob tetap            | "Bob resells the whole right to Carol. New owner. Same deadline…"               |
| 0:57–1:02   | Ringkasan     | Wide shot; event kedua → Alice 1,00 · Bob 0,50 · Carol 0,50                                               | "Every share of income, accounted for."                                         |
| 1:02–1:12   | AI            | Bloom ungu, orb + ripple, prompt diketik, 3 listing ilustratif, kartu risiko, preview "Confirm in wallet" | "Ask Yieldex AI… Your wallet always has the final say."                         |
| 1:12–1:21   | Angka jujur   | Dial: 200 → +10 (+11,11%), 100 → −40, 0 → −90; partikel mengalir/terkuras                                 | "The price is fixed. The income isn't. Higher. Lower. Or nothing at all."       |
| 1:21–1:28   | Bukti onchain | Garis cahaya → rantai event kontrak asli, chip bukti Sepolia, alamat market                               | "Backing, rights and claims are enforced by smart contracts…"                   |
| 1:28–1:34,4 | Penutup       | Blok menyatu → boom → logo, tagline, CTA                                                                  | "Yieldex. Your shares stay yours. Your income has options."                     |

## 4. Audio

| Lapisan | Sumber                                                                                                                                                                                                                                                                     | File                        |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| VO      | Kokoro-82M (Apache-2.0), voice `af_heart`, 23 baris. Dibuat lokal; teks ada di `src/audio/voiceover.json`. Hasilnya di-commit sebagai FLAC karena untuk membuat ulang perlu mengunduh model sekitar 350 MB                                                                 | `public/audio/vo/*.flac`    |
| Musik   | Original, disintesis di `scripts/audio/build.py`: D major, 100,65 BPM (tempo dipilih agar hit logo jatuh tepat di downbeat), pad, arpeggio pluck dengan ping-pong delay, bass, kick/hat/clap dengan sidechain. Aransemen mengikuti cerita (lihat `MUSIC` di `src/cues.ts`) | `out/audio/stems/music.wav` |
| SFX     | 114 cue (`src/cues.ts`) dari sekitar 30 jenis bunyi yang disintesis: whoosh, riser, impact, clink koin, gembok, chime, typing, dan lainnya. Pan stereo mengikuti posisi objek di layar                                                                                     | `out/audio/stems/sfx.wav`   |
| Mix     | VO: high-pass + kompresi ringan + normalisasi per baris. Musik di-duck ±6 dB saat narasi. Master −15 LUFS, true peak −1 dBFS                                                                                                                                               | `public/audio/mix.wav`      |

Tidak ada sampel pihak ketiga di musik maupun SFX. Untuk membuat ulang VO (misalnya mengganti teks atau voice):

```sh
# unduh kokoro-v1.0.onnx dan voices-v1.0.bin dari
# https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
pnpm voiceover --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--voice am_michael] [--only set_terms]
pnpm audio   # export-timeline memeriksa bahwa baris VO tidak saling tumpang tindih
```

Jika satu baris menjadi lebih panjang, geser `VOICE` atau beat terkait di `src/timeline.ts`. `scripts/export-timeline.ts` akan gagal bila ada baris yang tumpang tindih.

### Verifikasi render v2 sebelum polish

- Whisper `base.en` pada **mix akhir** mentranskripsi ke-23 baris di waktu yang tepat. Salah dengar yang muncul hanya kesalahan ASR yang wajar: "rights"→"writes" (homofon) dan "Yieldex"→"Yildex", yang juga muncul pada VO kering.
- Audio hasil render Remotion vs `mix.wav`: lag 0 sampel, korelasi 1,0.
- MP4 final: 2814 frame, audio AAC 48 kHz, terukur −15,0 LUFS (ffmpeg ebur128). Tidak ada clipping; limiter hanya menyentuh 54 sampel.
- Belum ada pengecekan dengan telinga manusia. Rasa musik dan SFX perlu direview langsung.

## 5. Batas klaim (dicek terhadap spec)

- Semua angka adalah contoh hipotetis dari PRD §4 (90 USDC, 50%, 6 bulan, 200/100/0, resale 45 USDC). Film menyebutnya "Hypothetical… Not a forecast · Not a loan".
- Identitas aset dalam film memakai Apple/AAPLx, Microsoft/MSFTx, NVIDIA/NVDAx dan USDC. Nama dan logo adalah ilustrasi presentasi; kontrak dan aset pengujian Sepolia tidak diubah. Penanda Sepolia dan angka hipotetis tetap tampil.
- Tidak ada NFT, transfer parsial, atau hadiah: resale ditampilkan sebagai "Whole position".
- AI ditampilkan read-only: tidak swap, tidak tanda tangan; wallet pengguna yang mengonfirmasi (AI-001/AI-006). Listing di chat diberi label ilustratif.
- Pembayaran dan hak berpindah atomik (MKT-005); tenor mulai saat pembelian (MKT-003); resale mempertahankan expiry dan klaim lama (MKT-006). VO menyebut pembagian "by the agreed share", bukan "otomatis", karena klasifikasi event melewati finalizer.
- Bukti dari `docs/hosted-rollout.md` dan `deployments/sepolia.json`: live di Sepolia, 7 kontrak cocok di Sourcify, lifecycle 23 transaksi, alamat market `0x25e228…c76f`. Nama event di rantai blok adalah event asli `IIncomeRightsMarket`.
- CTA tidak memuat URL. Isi URL demo final di `src/copy.ts` setelah UI final dan chatbot terintegrasi.

## 6. Struktur

| Path                                     | Isi                                                                   |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `src/timeline.ts`                        | Beat semua scene, penempatan VO                                       |
| `src/cues.ts`                            | Cue SFX + impuls kamera + marker aransemen musik                      |
| `src/copy.ts`                            | Semua teks layar                                                      |
| `src/scenes/*`                           | Lima scene                                                            |
| `src/Film.tsx`                           | Perakitan, kamera global, transisi, track audio                       |
| `src/fx/*`                               | Kamera, cahaya, partikel, motion smear, refleksi                      |
| `src/assets/*`                           | Objek: koin, cincin, vault, tiket, avatar, orb AI, dial, ledger, logo |
| `src/AssetSheet.tsx`                     | Asset kit (`pnpm assets`)                                             |
| `scripts/audio/voiceover.py`, `build.py` | Pembuatan VO dan soundtrack                                           |

## 7. Belum dikerjakan

- Review dengar oleh tim, terutama selera musik, level SFX, dan pilihan voice. Voice lain cukup diganti dengan satu flag `--voice`.
- Belum ada screen recording UI asli karena UI final Afer dan chatbot Rafi belum terintegrasi. Kartu di film adalah stilisasi design system.
- Review desainer tim untuk visual film.
- Turunan: versi 9:16, cutdown 30/15 detik, caption atau VO Bahasa Indonesia (teks di `src/copy.ts` dan `src/audio/voiceover.json`; Kokoro tidak punya voice Indonesia, sehingga VO ID butuh TTS lain).

## 8. Polish setelah review visual — 10 Oktober 2026

Baseline `e224163`, branch `feat/product-film-video`. Scope: layout AI, konektor ledger, transisi angka → bukti, serta pacing VO/teks penutup.

- Conversation memakai viewport terpotong di bawah header solid. Panel ditambah ruang vertikal; chip batas AI dan catatan ilustrasi berada di dua baris terpisah pada koordinat layar.
- Kartu ledger memakai ukuran border-box 420 × 192. Konektor hanya menempati gap 80 px dan berada di layer belakang; kartu pertama muncul di dalam aperture sebelum kamera bergerak sepanjang ledger.
- Dial tetap bundar. Angka dan teks memudar terlebih dahulu, lalu rim cahaya membesar menuju kamera dan membuka ledger. SFX swell/whoosh mengikuti timing yang sama.
- Jeda 0,65 detik disisipkan pada batas sunyi 0,644 detik dalam FLAC `close_tagline`. Suara asli dipertahankan; edit diterapkan oleh audio builder, sehingga berulang kali menjalankan `pnpm audio` tidak menumpuk jeda. Jika VO dibuat ulang, periksa ulang offset ini. Exporter memperhitungkan tambahan durasi saat memeriksa overlap dan batas akhir.
- Logo diberi beat sendiri; dua baris tagline muncul bergiliran mengikuti ucapan. Film menjadi 2832 frame / 94,4 detik. MP4 polish sudah diekspor ke `out/yieldex-film-polished.mp4` (output ignored).

Verifikasi pada baseline `e224163` + working diff polish:

- PASS `pnpm --dir video typecheck`, ESLint video, dan `git diff --check`.
- PASS preview Chromium: frame masuk/scroll/akhir AI, langkah transisi 2410–2474, ledger 2510/2595, dan brand resolve 2668–2790. Pemeriksaan bounding box pada frame 2140 memastikan panel, chip, dan catatan tidak beririsan. Header solid dan viewport `overflow: hidden` terverifikasi.
- PASS playback cuplikan AI, portal, dan penutup melalui Remotion Studio; tidak ada page error. Pemeriksaan versi Remotion ke `bugs.remotion.dev` diblokir jaringan, tanpa menghalangi preview.
- PASS `pnpm audio`: 94,4 detik, 23 VO, 114 cue, −15,0 LUFS, peak −1,0 dBFS. FFmpeg mendeteksi jeda brand 0,676 detik pada stem final. Batas potong sumber −57 dBFS; pengecekan hasil `build_voice()` memastikan bagian jeda benar-benar sunyi dan narasi selesai sebelum fade-out.
- PASS `pnpm check`: format, lint, tipe, 158 Vitest, 46 Foundry, generated parity, 10 OpenSpec items, pemeriksaan dokumen dan production build. Percobaan awal menemukan cache `.next/dev` dari branch sebelumnya; cache dipindahkan lalu suite lengkap lulus.
- PASS export MP4 H.264 1920×1080 / 30 fps, 2832 frame / 94,4 detik, AAC stereo 48 kHz, sekitar 243 MB. Empat rentang frame berurutan dirender dengan Chromium lalu digabung dengan mix lengkap. Timestamp seluruh frame berkesinambungan, termasuk ketiga sambungan; metadata fast-start berada sebelum data media.
- PASS decode seluruh MP4 dengan FFmpeg: 2832 frame tanpa error, −15,0 LUFS, true peak −1,0 dBFS. Audio hasil encode pada cuplikan awal, tengah, dan penutup memiliki lag 0 sampel terhadap mix, korelasi >0,9999. Frame hasil encode 2140, 2458, 2510, dan 2790 diperiksa secara visual untuk layout AI, portal, ledger, dan penutup.
- NOT RUN: review dengar oleh manusia, browser selain Chromium. Screenshot dan cuplikan audio QA disimpan sebagai output ignored.

Akses API GitHub pada environment ini mengembalikan Forbidden, sehingga issue/PR remote belum dapat diperiksa atau diperbarui.

## 9. Identitas aset dan polish lanjutan — 10 Oktober 2026

Baseline `932cf71`, branch `feat/product-film-video`.

- Koin utama dan pendapatan memakai logo Apple dengan ticker AAPLx. Listing AI memakai logo Apple, Microsoft, NVIDIA dengan nama perusahaan serta ticker AAPLx, MSFTx, NVDAx.
- Label saldo, pembayaran, listing dan angka memakai USDC. VO `set_terms` dibuat ulang dengan Kokoro `af_heart`; penyebutan “U S D C” menggantikan nama sebelumnya. Jeda penutup 0,65 detik dipertahankan.
- Bokeh dikurangi dan ditempatkan di tepi layar. Ticker koin dan label bulan dibuat lebih jelas; metadata purchase preview diringkas agar tidak berdesakan dengan tombol wallet.
- CTA menjadi “Explore Yieldex”. Seluruh teks layar dan naskah VO memakai identitas yang sama; durasi tetap 2832 frame / 94,4 detik.
- Preview yang didistribusikan tetap `exports/yieldex-film-preview-720p.mp4`, disimpan di Git biasa agar dapat diunduh atau diambil dengan `git pull`.

Logo Apple dan NVIDIA berasal dari [Simple Icons 13.9.0](https://github.com/simple-icons/simple-icons/tree/13.9.0) (CC0); path SVG di-inline dalam `src/assets/TokenBrand.tsx` agar tajam dan tidak memerlukan request jaringan saat render. Logo Microsoft memakai empat bidang vektor berwarna. Nama/logo merek tetap milik pemiliknya masing-masing.

Verifikasi revisi identitas pada baseline `932cf71` + working diff:

- PASS `pnpm check`: format, lint, typecheck, 158 Vitest, 46 Foundry, generated parity, 10 OpenSpec items, dokumen dan production build.
- PASS pemeriksaan frame 115, 820, 1210, 2005, 2140, 2310, 2458, 2510, 2795: ikon merek, listing/risiko/purchase preview, label harga dan penutup terbaca tanpa overlap.
- PASS playback Chromium dari AI melalui penutup dan loop pembuka; tidak ada error aplikasi. Request pengecekan versi Remotion diblokir jaringan dan tidak memengaruhi playback.
- PASS `pnpm audio`: 94,4 detik, 23 VO, 114 cue, −15,0 LUFS, peak −1,0 dBFS. Baris harga baru berdurasi 5,921 detik dan lolos pemeriksaan jarak antar-VO; tidak ada perubahan sumber suara penutup.
- PASS pencarian source: tidak ada label/naskah dengan kata “demo” di `src/`.
- Render penuh revisi identitas di cloud dihentikan sesuai permintaan pengguna untuk melanjutkan di lokal. Preview MP4 yang dilacak Git tetap versi `932cf71`; render frame untuk QA dan mix audio baru sudah selesai, sedangkan encode MP4 final revisi ini belum selesai/diverifikasi.
