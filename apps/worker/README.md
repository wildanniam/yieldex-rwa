# Worker process

Saat ini hanya boot/config/health/shutdown. `pnpm worker:once` mengeluarkan status lalu exit. `pnpm dev:worker` mendengarkan `127.0.0.1:3101/health`; port dapat diganti melalui `.env` lokal. Jobs selalu disabled karena belum diimplementasikan.

Task 2.5 menambah pemeriksaan/pelaporan issuer; task 4.2 menambah finalized-chain indexer. Pisahkan modul dan kewenangannya. Indexer tidak punya hak memindahkan dana. Finalizer hanya melaporkan metadata registry dengan role yang dibatasi spec. Jangan mengaktifkan signing berdasarkan adanya env key saja.

Build memakai tsc; start memakai Node dengan tsx loader agar shared TypeScript workspace dapat diimpor tanpa publikasi npm. Target saat ini full workspace checkout, bukan standalone deployment image. Siapkan packaging production pada task deployment.
