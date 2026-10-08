# Database migrations

Belum ada schema produk atau migration SQL. Mulai task 4.1 dari [kontrak data](../../docs/spec/data-contracts.md) dan [API](../../docs/spec/api-contract.md). Jangan membuat tabel pembanding yang mengubah DTO atau menjadikan cache sebagai pemilik dana.

Gunakan migration yang versioned setelah konfigurasi Supabase local disiapkan. Tes fresh database, reset/replay migration dan akses dua pengguna melalui RLS sebelum menghubungkan aplikasi. Jangan menyimpan dump database, service-role key atau credentials di repo.
