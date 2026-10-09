# Web / request backend

Web menyediakan halaman informasi `/`, functional wallet lab `/lab`, dan `GET /api/health` untuk process liveness. API produk yang sudah ada mencakup market/assets/positions/claims, auth/session, transaction intents, private conversation history, serta quote comparison read-only. Health bukan bukti bahwa RPC, database, atau integrasi sudah siap.

- `src/app`: pages dan HTTP route adapters.
- `src/server`: domain services/provider adapters khusus server; gunakan layanan dan interface yang sama saat mengintegrasikan AI tools.
- `@rwa/shared`: types/config browser-safe; validator lewat `@rwa/shared/validation`, compiled ABI lewat `@rwa/shared/abi`.

Core auth, wallet dan API telah diuji lokal dengan batas bukti pada [core verification](../../docs/core-verification.md). UI final mengikuti desainer tim; runtime CopilotKit/chatbot dan deployment hosted/Sepolia belum selesai. Keberadaan private history tidak berarti chatbot sudah terintegrasi.

Ikuti [local core runbook](../../docs/local-core.md) untuk database, deployment manifest, origin dan RPC. Terapkan seluruh migration termasuk `007` sebelum menjalankan web terbaru. API/AI secrets hanya di server; kunci finalizer tidak boleh masuk package web.
