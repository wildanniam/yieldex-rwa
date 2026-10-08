# Bekerja Bersama dengan AI

## Satu acuan dan satu perubahan terkoordinasi

Repo terbaru adalah acuan. `docs/TEAM-CONTEXT.md` adalah ekspor agar mudah diupload, bukan salinan yang diedit terpisah. Sebelum mulai sesi, tiap anggota memastikan branch/revision terbaru serta membaca decisions, change aktif dan interface modulnya. Designer boleh mengubah visual; perubahan field/status/action harus direview sebagai perubahan spec.

Pada baseline besar ini gunakan satu OpenSpec change agar semua interface awal dapat diperiksa sebagai satu paket. Pecah implementation menjadi task/issue kecil dari checklist. Jangan membuat empat spec bertentangan untuk frontend, backend, AI dan kontrak. Setelah baseline benar-benar diterapkan/diverifikasi, archive memperbarui main specs; fitur berikutnya memakai change baru.

## Kontrak kerja tiap task

Sebelum coding: sebut task ID, requirement yang dipenuhi, modul yang dimiliki, dependency yang harus selesai, test matrix dan interface yang dikonsumsi. Catat file bersama yang akan berubah. Assignee ditetapkan saat meet; spec tidak mengasumsikan seorang tertentu mampu seluruh modul.

Satu anggota dapat memakai fixtures setelah schema disetujui meski provider/kontrak belum berjalan. Tandai data fixture, kontrak stub dan bukti runtime terpisah. Setelah interface berubah, regenerasi types/ABI/fixtures dan update semua consumer dalam perubahan terkoordinasi sebelum merge. Jangan mengubah expected test diam-diam supaya implementasi yang menyimpang lulus.

## Prompt awal untuk AI teman

```text
Baca README.md, AGENTS.md, docs/spec/decisions.md dan change OpenSpec
build-rwa-income-rights. Kerjakan hanya task [ID], modul [nama].
Baca capability spec serta kontrak data/interface yang terkait.
Jelaskan dependency dan matriks pengujian sebelum mengubah kode.
Gunakan nama field/enum/schema yang sama. Jika dokumen bertentangan,
laporkan konflik konkret dan perbaiki spec bersama sebelum mengasumsikan.
Jangan menambah NFT, swap execution, model training, atau mengubah hak ekonomi.
Visual mengikuti desain UI/UX tim. Jangan klaim fixture sebagai integrasi nyata.
Di akhir laporkan revision, task, file, hasil checks dan hal belum diuji.
```

## Git dan review

Repo tim adalah [wildanniam/eth-jkt](https://github.com/wildanniam/eth-jkt), private. Initial push langsung ke main diotorisasi khusus oleh Wildan pada 8 Oktober 2026. Pekerjaan berikutnya memakai issue → non-main branch → implementation → verification → commit/push/PR sesuai otorisasi → human review. Smart contracts/finality high-risk, tidak auto-merge. Akses anggota dan deployment memerlukan pengaturan terpisah.

Tidak menggabungkan dua perubahan antarmodul yang belum disepakati hanya karena CI schema lulus. Reviewer memeriksa perilaku, otorisasi, conservation dan user-visible state. Test setiap task dan jalur lengkap lintas modul; lihat verification.md.

## Gate sebelum coding paralel

1. Schema/interface baseline dibaca dan disepakati tim; tidak ada nama/enum ganda.
2. Foundation repo dan generation command sudah tersedia; tiap anggota memastikan setup dan starter checks berhasil. Tes perilaku kontrak produk ditambahkan saat implementasi.
3. Task dependency dan ownership disepakati saat meet, dengan satu penanggung jawab review untuk perubahan interface bersama.
4. Minimal satu fixture per endpoint/tool dan mock contract boundary sesuai spec.
5. Kesalahan runtime memicu update design/spec dan test, bukan patch yang menyembunyikan ketidakcocokan.

## Definisi selesai

Checkbox task hanya setelah acceptance nyata terpenuhi dengan bukti. PRD/spec selesai tidak menandai task build selesai. Provider docs bukan runtime compatibility. Initial source snapshot bukan audit. Mainnet read-only bukan mainnet deployment. `openspec validate` tidak memverifikasi ekonomi atau smart contract. Catat empat status: passed, failed, blocked, not tested.
