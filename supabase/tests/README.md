# Database / RLS tests

[core_rls.sql](core_rls.sql) menguji PostgreSQL/RLS dalam satu transaksi yang di-rollback: isolasi conversation/messages dua user, penolakan forged assistant dan sesi tanpa admission, akses anonymous, private schema, numeric/address bounds, parent ownership dan duplicate protection. Fixture SQL ini bukan bukti login provider berhasil.

Jalankan pada Supabase lokal dengan seluruh migration diterapkan sesuai [local core runbook](../../docs/local-core.md). Pengujian auth provider/HTTP terpisah melalui `pnpm test:auth:local` dan `pnpm test:auth:http`; history, intents dan recovery juga memiliki runner integrasi masing-masing. Suite eksternal ini tidak otomatis dijalankan oleh `pnpm check`.

Hasil serta revisi pengujian lokal dicatat pada [core verification](../../docs/core-verification.md). Migration `007` juga memiliki tes upgrade schema berisi data pada `pnpm test:recovery:edges`; itu tidak menggantikan full auth/RLS journey. Migrasi dan acceptance pada Supabase hosted masih perlu diverifikasi.
