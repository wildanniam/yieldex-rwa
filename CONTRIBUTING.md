# Kontribusi tim

Kita bekerja di **satu repo public: [wildanniam/yieldex-rwa](https://github.com/wildanniam/yieldex-rwa)**. Setelah mendapat akses write, anggota clone repo ini, push branch masing-masing ke `origin` yang sama, lalu membuat PR ke `main`. Tidak perlu fork atau repo pribadi.

**Alur tim: pilih pekerjaan → branch → coding → tes → push → PR → review → merge.**

**Issue opsional.** Tidak perlu membuat issue untuk setiap perubahan. Issue berguna untuk menyimpan bug, backlog atau diskusi yang panjang. Satu PR boleh berisi beberapa commit dan perbaikan kecil yang masih satu tujuan; tidak perlu PR baru untuk setiap commit.

## Mulai mengerjakan

Ikuti [setup development](docs/development.md) saat pertama clone. Sebelum coding, sepakati bagian yang dikerjakan lewat meet/chat atau task OpenSpec supaya tidak bertabrakan. Baca spec dan interface yang berkaitan dengan pekerjaanmu; task OpenSpec tidak harus disalin menjadi GitHub issue.

Dari working tree yang bersih:

```sh
git switch main
git pull --ff-only origin main
git switch -c feat/create-listing
```

Nama branch cukup jelas, misalnya `feat/create-listing`, `fix/claim-button`, atau `docs/setup-guide`. Nomor issue tidak wajib. Simpan pekerjaan yang belum selesai di branch-nya sebelum berpindah; jangan membuang perubahan agar bisa pull.

Jangan push langsung ke `main` atau menimpa branch teman. Initial push starter langsung main hanya pengecualian setup awal.

## Sebelum push

1. Coba fitur yang kamu ubah dari awal sampai hasilnya benar. Cek input salah/kasus gagal yang relevan, lalu fitur lain yang bisa ikut terdampak. Untuk UI, lihat juga error browser dan hasil setelah refresh; untuk bug, pastikan langkah yang tadinya gagal sudah bekerja.
2. Tambahkan atau perbarui tes sesuai perubahan. Jalankan `pnpm check` dari root. Kalau gagal, perbaiki sebelum push; jangan sekadar mengubah expected test agar hijau.
3. Periksa diff. Jangan ikutkan `.env` privat, secrets, node_modules, build output atau perubahan teman.

```sh
pnpm check
git diff --check
git status --short
```

Jika mengubah spec/schema/interface atau dokumen yang masuk konteks AI, jalankan `pnpm generate` sebelum check dan sertakan hasilnya. Jika format gagal, jalankan `pnpm format`, regenerate bila diperlukan, lalu ulangi check. Jangan mengedit file generated secara langsung.

**Catatan tes di PR boleh singkat**, misalnya: “`pnpm check` lulus; create listing normal dan input kosong sudah dicoba; error RPC belum dites.” Tidak wajib membuat tabel risiko, laporan panjang, atau mencatat hash commit secara manual untuk setiap PR. GitHub sudah menampilkan commit PR. Jelaskan dengan jujur apa yang sudah dan belum diuji.

Tetap ikuti acceptance spec. Untuk perubahan yang menyentuh dana, hak, smart contract, auth atau migrasi, koordinasikan dengan reviewer yang memahami modul dan jalankan pengujian lebih kuat yang relevan. [Panduan pengujian produk](docs/spec/verification.md) menjadi rujukan saat dibutuhkan. Administrasi yang lebih ringan tidak mengurangi pemeriksaan kebenaran fitur tersebut.

Core lokal sudah mempunyai tes lifecycle ekonomi, auth/RLS, worker dan wallet. Integrasi RPC/database, fork resmi dan browser mempunyai command serta batas bukti tersendiri di [core verification](docs/core-verification.md). `pnpm check` hijau tidak otomatis membuktikan UI/chatbot final atau deployment Sepolia.

## Push dan PR

Pilih/stage file yang sudah ditinjau melalui Git atau IDE, lalu commit. Contoh berikut mengasumsikan file yang ingin dikirim sudah di-stage:

```sh
git diff --cached
# Ganti pesan sesuai pekerjaanmu.
git commit -m "feat: add listing form"
git branch --show-current
# Pastikan branch yang tercetak adalah branch tugasmu, bukan main.
git push -u origin HEAD
```

Di GitHub, buat PR dengan **base: main** dan **compare: branch-mu**. Isi tiga hal saja:

- Apa yang berubah.
- Apa yang sudah dites dan hasilnya.
- Catatan atau hal yang belum selesai/belum diuji, jika ada.

Nomor issue atau `Closes #N` hanya dicantumkan jika memang ada issue terkait. Perubahan lanjutan cukup di-push ke branch yang sama; PR otomatis diperbarui. Tidak perlu membuat issue/PR baru untuk setiap revisi review.

Kalau fitur belum memenuhi acceptance, gunakan draft PR dan sebutkan yang belum selesai. Draft bukan tanda siap merge. Check yang tersedia tetap dijalankan sebelum push; verifikasi fitur yang masih tertunda jangan diklaim lulus.

## Review dan sinkronisasi

Minta satu teman meninjau PR. Tunggu CI pada revisi terbaru hijau, selesaikan komentar penting dan konflik, lalu maintainer dapat merge sesuai kesepakatan tim. PR membuat perubahan mudah dicek sebelum masuk main; deskripsinya cukup ringkas. CI tidak menggantikan mencoba fitur.

CI saat ini berjalan pada PR dan push main, bukan pada push feature branch yang belum mempunyai PR. Aturan ini belum dipaksakan oleh branch protection atau pre-push hook.

Jika main berubah ketika kamu sedang coding, dari branch tugas dengan working tree bersih:

```sh
git fetch origin
git merge origin/main
```

Selesaikan konflik bersama pemilik file, regenerate bila perlu, lalu ulangi tes yang terdampak dan `pnpm check`. Jangan force push branch bersama atau memilih seluruh perubahan sendiri untuk menimpa pekerjaan teman. Jika perlu membatalkan merge yang baru dimulai, gunakan `git merge --abort`.

Setelah PR merged, kembali ke main dan `git pull --ff-only origin main` sebelum membuat branch task berikutnya.

## Aturan pribadi Wildan

Workflow issue wajib dan laporan verifikasi terperinci untuk **Codex yang bekerja atas nama Wildan** tetap berlaku sesuai [AGENTS](AGENTS.md). Itu aturan pribadi, bukan kewajiban teman-teman atau AI yang mereka gunakan. Workflow umum tim tetap panduan singkat di atas, baik coding manual maupun dengan AI.
