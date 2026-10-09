# Database migrations

Migration SQL versioned sudah mencakup read-model, auth/session, intent submissions, finalizer outbox dan recovery identity. Ikuti [kontrak data](../../docs/spec/data-contracts.md), [API](../../docs/spec/api-contract.md) dan [runbook lokal](../../docs/local-core.md). Chain tetap menjadi sumber hak dan dana; database menyimpan index/cache serta identitas pekerjaan.

Jalankan `supabase migration up --local` secara berurutan sebelum menjalankan web/worker versi baru. Migration `202610080007_recovery_identity.sql` diperlukan oleh recovery ACK dan replacement transaksi: nonce intent lama tetap null, record job lama dipertahankan, dan SUPERSEDED hanya boleh menyimpan job tanpa signed transaction. Hentikan web/worker lama saat upgrade dan restart setelah migrasi; jangan reset database pengguna untuk menerapkan perubahan ini.

`pnpm test:recovery:edges` memverifikasi upgrade schema terisi pada database sementara, status job/intent lama serta flag RLS dan grants. Ini memakai fixture auth, bukan pengganti suite auth/RLS penuh. Jangan menyimpan dump database, service-role key atau credentials di repo.
