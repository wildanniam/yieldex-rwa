# Perbaikan audit sebelum Sepolia — 9 Oktober 2026

> Riwayat verifikasi dari repo eksperimen `wildanniam/eth-jkt` sebelum import. Nomor issue/PR dan hash lama di bawah mengacu ke repo sumber yang private, bukan Yieldex. Hasil ulang pada repo aktif dan batas import ada di [catatan import](repository-import.md).

Scope issue [#3](https://github.com/wildanniam/eth-jkt/issues/3), draft PR [#4](https://github.com/wildanniam/eth-jkt/pull/4). Baseline audit: `76716ed3db8e61b93e005bfc1f838dba8568795b`. User menyetujui perbaikan; ini bukan deployment atau persetujuan merge. Bukti mentah/screenshot tetap lokal, tidak masuk repo.

## Risiko dan matriks yang dipakai sebelum implementasi

| Temuan                                                                         | Perbaikan                                                                                                                                       | Verifikasi yang diperlukan                                                                                                                                                                           |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 P1: karantina menutup append padahal resume membutuhkan head synchronized | Izinkan metadata repair terverifikasi untuk karantina sementara; pertahankan latch finalityConflict, role dan semua guard                       | Recovery dua jenis karantina; finalizer tidak bisa resume; paused/config/history invalid ditolak; 33-event backlog; coverage/checkpoint/settle/release tetap tertahan; reserve klaim setelah release |
| A-02 P2: satu adapter revert menghentikan hydrate semua aset                   | Isolasi deterministic contract/ABI failure pada aset; simpan shares/owner, nilai konversi null; provider/registry/canonical failure tetap abort | Fault pada token di Anvil terisolasi, RPC nyata → migrasi PostgreSQL nyata → indexer → read service; aset sehat tetap maju; konversi pulih; preview aman; unit transport/registry errors             |
| A-03: dokumen aktif masih mengatakan implementation belum ada                  | Reconcile design, development, contribution, decisions/accounting dan generated team context                                                    | Generate/drift/schema/OpenSpec checks dan pemeriksaan manual atas klaim progres                                                                                                                      |
| A-04: Sepolia core tergantung UI/chatbot final                                 | Pisahkan task 7.3/7.8 core dari 7.4–7.6 full demo                                                                                               | Dependency eksplisit, task belum selesai tetap unchecked; tidak menganggap local proof sebagai Sepolia                                                                                               |

## Perilaku sesudah perbaikan

Finalizer dapat append event dan acknowledge snapshot yang valid selama temporary quarantine. Ia tidak dapat membuka karantina, memperbarui saldo, memilih penerima atau mengabaikan riwayat. Admin hanya dapat kembali NORMAL setelah synchronization dan transfer safety terpenuhi. Konflik record final tetap permanen dan tidak bisa di-reset melalui jalur ini. Reviewed reconciler mengembalikan `HELD` sambil menunggu admin; ini tidak membuat job coverage yang pasti revert atau mengubahnya menjadi outbox job `HELD`. Sesudah admin resume, report yang sama dapat melanjutkan coverage.

Aset dengan adapter tidak terbaca menampilkan `ADAPTER_UNAVAILABLE`, `currentMultiplier/currentNonce = null`, serta nilai konversi principal/klaim `null`. Shares dan ownership tetap berasal dari kontrak. Registry safetyState tidak dipalsukan oleh backend. Preview selain cancel listing ditahan; cancel tetap memerlukan identitas dan simulation sukses. Tampilan harus mengatakan data tidak tersedia, bukan saldo nol. Ini revisi DTO v1 pradeployment: Afer/Rafi wajib memakai hasil generate terbaru dan null guards sebelum integrasi.

## Bukti dan batas

- Empat tes recovery Foundry baru gagal sebelum perbaikan pada baseline (append revert), lalu lulus setelah perbaikan. Suite penuh: **46 PASS**, termasuk fuzz 1000 runs dan invariant 128 × 64 actions.
- Unit reader menguji deterministic failure, healthy control, transport/registry propagation dan blocked claim preparation.
- `pnpm test:recovery:local` menggunakan Anvil pada port sementara, database baru dengan migrasi read-model/outbox aktual, random finalizer key khusus tes, actual transactions dan read services. Controlled token-code failure hanya pada Anvil milik tes. Tidak mengubah deployment/database `/lab`.
- Bukti ini bukan pengujian auth baru: database sementara hanya membuat prasyarat `auth` agar migrasi read-model dapat diterapkan. Auth/RLS mempunyai suite terpisah dan bukti historis di core-verification.md.
- Final UI/chatbot, public Sepolia deployment/lifecycle dan production security audit belum dibuktikan. Perubahan tidak menambah administrator sweep, proxy upgrade, reset immutable history atau hak model untuk mengirim transaksi.

Hasil combined regression dan revision final dicatat di [core verification](core-verification.md). Jalankan `pnpm check`, `pnpm test:fork` dan `pnpm test:recovery:local` sebelum menganggap perbaikan core ini siap dibawa ke tahap deployment.

## Re-audit worker R-01/R-02 — rencana verifikasi

Baseline reproduksi: `c0b81163be824002a7399af16ae2046f49614a14`. Scope perbaikan worker high-risk dalam issue #3/PR #4; tidak mengubah ekonomi, ABI, role finalizer, atau deployment.

| Risiko                                           | Skenario wajib                                                                                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| R-01: parser menolak NO_INCOME (kind 3) yang sah | Semua empat enum diterima, enum/revision salah ditolak; JSON operator → append → ACK → coverage → checkpoint menjaga principal dan klaim nol |
| R-02: snapshot A → B → A memakai job ACK lama    | Beberapa siklus dengan evidence sama/berbeda, nonce dan waktu pending sama; snapshot terakhir dan head registry harus sama                   |
| Retry/concurrency                                | Pengulangan report dan worker bersamaan tidak membuat job/transaksi ACK kedua untuk transisi yang sama                                       |
| Crash/response loss                              | Signed bytes tersimpan sebelum broadcast; instance baru menyelesaikan job yang sama tanpa nonce baru                                         |
| Regression                                       | Recovery quarantine/adapter, seluruh check, immutable conflict dan missing classification tetap fail closed                                  |

Identitas ACK memakai snapshot tujuan serta occurrence ACK terakhir di registry (block hash, transaction hash, log index). Pembacaan head/live/log memakai blok yang sama. Ini membedakan kunjungan ulang snapshot walaupun source report/evidence digunakan ulang, tanpa mereset job lama. Kegagalan membaca riwayat tidak boleh diganti key acak.

Tambahan yang ditemukan saat menguji concurrency: R-03, kedua worker membaca transaksi belum ada, worker pertama broadcast, lalu worker kedua melihat nonce sudah naik dan keliru memberi NONCE_UNRESOLVED. Sebelum memberi HELD, outbox harus membaca ulang receipt/transaksi dengan hash signed bytes yang sama. Transaksi nyata yang tidak dikenal atau replacement tetap HELD; receipt sukses/revert dan finality tetap diverifikasi pada poll berikutnya. Matriks diperluas untuk race broadcast serta replacement yang benar-benar berbeda.

## R-04/R-05/T-01 — rencana perbaikan terarah

Baseline `50f7fb32f6fa9d7ca9f91883b1e7c31adc83df92`. User menyetujui perbaikan setelah audit; tetap issue #3/draft PR #4, high-risk karena worker signing dan migrasi data privat. Tidak mengubah ekonomi, ABI, DTO publik atau ownership tim.

| Risiko                  | Perubahan minimum                                                                                                                                             | Tes wajib                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-04 unsigned stale ACK | Status internal SUPERSEDED hanya untuk READY tanpa signer/nonce/hash/bytes, setelah snapshot finalized dan live sama-sama berbeda dari target; simpan riwayat | Transient error sebelum signing, pending override, finalized recovery, report baru, recurrence sebelum ACK, RPC error/unfinalized tetap ditahan, signed/HELD tidak dihapus, concurrency                |
| R-05 replacement        | Simpan transaction_nonce dari transaksi yang sudah diverifikasi; cocokkan replacement dengan nonce dan identitas preview                                      | Pending → speed-up → receipt success saat hash lama hilang; repeat/restart/concurrent submissions; wrong nonce/data/signer/chain ditolak; legacy nonce-null fail closed/recover jika original tersedia |
| T-01 nonce assertion    | Receipt transaksi asli sebagai baseline sebelum membandingkan retry; tetap cek job/hash/signed bytes dan satu ACK                                             | Automining normal dan controlled pending interval; retry tidak sign lagi; unknown replacement tetap HELD                                                                                               |
| Migrasi/regresi         | Migrasi additive nonce; partial unique key mengecualikan superseded sambil menyimpan riwayat, check superseded wajib unsigned                                 | Fresh + upgrade database sementara, existing rows/RLS tetap, suite core/worker/recovery/spec/build                                                                                                     |

SUPERSEDED bukan CONFIRMED: tidak ada transaksi yang diklaim berhasil. Unique key tetap berlaku untuk semua job non-superseded; kunjungan ulang target yang sebelumnya dibatalkan sebelum signing boleh membuat job baru tanpa menghapus record lama. Receipt/signed-transaction recovery tetap tidak berubah.
