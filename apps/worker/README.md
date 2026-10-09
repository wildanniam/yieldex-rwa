# Worker process

Default `pnpm dev:worker` menjalankan health shell pada `127.0.0.1:3101/health`; port dapat diganti melalui `.env` lokal. `pnpm worker:once` mengeluarkan status lalu exit. Kedua command ini tidak memproses jobs, meskipun modul indexer dan finalizer sudah diimplementasikan.

Jobs dijalankan secara eksplisit dari root repo:

- `pnpm worker:index`: finalized-chain indexer berulang; tidak memerlukan signing key.
- `pnpm worker:finalize`: satu putaran durable outbox untuk jobs yang sudah tersimpan; bukan daemon.
- `pnpm --filter @rwa/worker finalize:once /path/to/reviewed.json`: memeriksa satu reviewed report dan melanjutkan append/ACK/coverage sesuai state/finality. Jalankan kembali setelah finality bila masih pending.
- `pnpm --filter @rwa/worker issuer:poll SPYx`: observasi issuer dengan mapping aset eksplisit; tidak otomatis memfinalisasi dividen.

Lihat [local core runbook](../../docs/local-core.md) untuk konfigurasi, reviewed-file format dan recovery. Terapkan seluruh migration termasuk `007` sebelum menjalankan worker terbaru. Indexer tidak mempunyai hak memindahkan dana. Finalizer memakai key privat khusus worker dan hanya boleh melaporkan metadata registry sesuai role terbatas; report yang lolos parser belum membuktikan kelengkapan data issuer.

Implementasi dan regression lokal tercatat pada [core verification](../../docs/core-verification.md); operasi hosted/Sepolia masih perlu diuji. Build memakai tsc; start health shell memakai Node dengan tsx loader agar shared TypeScript workspace dapat diimpor tanpa publikasi npm. Target saat ini full workspace checkout; packaging dan supervision deployment masih perlu disiapkan.
