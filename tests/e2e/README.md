# Browser journey tests

Folder ini belum memiliki suite E2E browser otomatis. Bukti browser manual untuk starter dan functional lab `/lab` dicatat secara historis pada [starter verification](../../docs/starter-verification.md) dan [core verification](../../docs/core-verification.md): UI, requests/console, refresh serta state chain/database diperiksa. Alur wallet lokal memakai provider EIP-1193 terkontrol; bukti tersebut bukan pengujian MetaMask extension atau Sepolia.

`pnpm test:wallet:local` menguji wallet recovery melalui harness RPC, bukan suite browser di folder ini. `pnpm check` juga tidak menjalankan browser journey. Baca revisi dan batas setiap hasil pada verification notes; jangan menganggap hasil historis otomatis memverifikasi UI baru.

Saat menambah suite, gunakan browser nyata dan akun isolated sesuai [matriks produk](../../docs/spec/verification.md). Periksa state chain/DB setelah refresh, bukan hanya teks tampilan. Bedakan mock provider, Anvil, official-token fork dan Sepolia. UI tim, chatbot serta full hosted journey tetap memerlukan acceptance terpisah.
