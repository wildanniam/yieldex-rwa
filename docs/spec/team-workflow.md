# Bekerja Bersama dengan AI

Panduan kontribusi manusia dan AI ada di [CONTRIBUTING](../../CONTRIBUTING.md): branch/task, testing sebelum push, PR dan review. Dokumen ini melengkapi koordinasi spec dan konteks AI; tidak membuat workflow Git terpisah.

## Satu acuan dan satu perubahan terkoordinasi

Repo terbaru adalah acuan. `docs/TEAM-CONTEXT.md` adalah ekspor agar mudah diupload, bukan salinan yang diedit terpisah. Sebelum mulai sesi, tiap anggota memastikan branch/revision terbaru serta membaca decisions, change aktif dan interface modulnya. Designer boleh mengubah visual; perubahan field/status/action harus direview sebagai perubahan spec.

Pada baseline besar ini gunakan satu OpenSpec change agar semua interface awal dapat diperiksa sebagai satu paket. Pecah implementation menjadi pekerjaan terarah dari checklist; GitHub issue opsional untuk tim. Jangan membuat empat spec bertentangan untuk frontend, backend, AI dan kontrak. Setelah baseline benar-benar diterapkan/diverifikasi, archive memperbarui main specs; fitur berikutnya memakai change baru.

## Kontrak kerja tiap task

Sebelum coding: koordinasikan task/modul, dependency dan interface yang terkait lewat meet/chat atau task OpenSpec. Sepakati cara memeriksa hasilnya; tidak perlu issue atau tabel pengujian formal untuk setiap perubahan tim. Catat perubahan file/interface bersama agar tidak bertabrakan. Assignee ditetapkan saat meet; spec tidak mengasumsikan seorang tertentu mampu seluruh modul.

Satu anggota dapat memakai fixtures setelah schema disetujui meski provider/kontrak belum berjalan. Tandai data fixture, kontrak stub dan bukti runtime terpisah. Setelah interface berubah, regenerasi types/ABI/fixtures dan update semua consumer dalam perubahan terkoordinasi sebelum merge. Jangan mengubah expected test diam-diam supaya implementasi yang menyimpang lulus.

## Prompt awal untuk AI teman

```text
Baca README.md, CONTRIBUTING.md, AGENTS.md, docs/spec/decisions.md dan change OpenSpec
build-rwa-income-rights. Kerjakan hanya task [ID], modul [nama].
Baca capability spec serta kontrak data/interface yang terkait.
Jelaskan dependency dan tes yang relevan sebelum mengubah kode.
Issue opsional untuk tim; jangan memaksakan workflow pribadi Wildan ke anggota lain.
Gunakan nama field/enum/schema yang sama. Jika dokumen bertentangan,
laporkan konflik konkret dan perbaiki spec bersama sebelum mengasumsikan.
Jangan menambah NFT, swap execution, model training, atau mengubah hak ekonomi.
Visual mengikuti desain UI/UX tim. Jangan klaim fixture sebagai integrasi nyata.
Di akhir laporkan revision, task, file, hasil checks dan hal belum diuji.
Sebelum push jalankan pnpm check dan tes fitur terdampak; push hanya branch
task sendiri ke origin repo tim. Isi PR ke main dengan bukti aktual.
Jangan merge tanpa persetujuan manusia yang berlaku.
```

## Git dan review

Repo tim adalah [wildanniam/eth-jkt](https://github.com/wildanniam/eth-jkt), private. Anggota dengan akses write melakukan clone dan push branch masing-masing ke origin yang sama, lalu PR ke main; tidak memerlukan fork. Langkah dan gate mengikuti [CONTRIBUTING](../../CONTRIBUTING.md). Initial direct push hanya pengecualian bootstrap. Akses anggota, enforcement branch protection dan deployment memerlukan pengaturan terpisah.

Tidak menggabungkan dua perubahan antarmodul yang belum disepakati hanya karena CI schema lulus. Reviewer memeriksa perilaku, otorisasi, conservation dan user-visible state. Test setiap task dan jalur lengkap lintas modul; lihat verification.md.

## Gate sebelum coding paralel

1. Schema/interface baseline dibaca dan disepakati tim; tidak ada nama/enum ganda.
2. Foundation repo dan generation command sudah tersedia; tiap anggota memastikan setup dan starter checks berhasil. Tes perilaku kontrak produk ditambahkan saat implementasi.
3. Task dependency dan ownership disepakati saat meet, dengan satu penanggung jawab review untuk perubahan interface bersama.
4. Minimal satu fixture per endpoint/tool dan mock contract boundary sesuai spec.
5. Kesalahan runtime memicu update design/spec dan test, bukan patch yang menyembunyikan ketidakcocokan.

## Definisi selesai

Checkbox task hanya setelah acceptance nyata terpenuhi dengan bukti. PRD/spec selesai tidak menandai task build selesai. Provider docs bukan runtime compatibility. Initial source snapshot bukan audit. Mainnet read-only bukan mainnet deployment. `openspec validate` tidak memverifikasi ekonomi atau smart contract. Ringkasan PR cukup menyebut apa yang diuji, hasilnya, dan batas/bagian belum diuji. Status passed/failed/blocked/not tested boleh dipakai bila membantu; laporan terperinci wajib hanya bila acceptance fitur membutuhkannya atau dalam workflow pribadi Codex untuk Wildan.
