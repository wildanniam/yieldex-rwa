# Browser journey tests

Tempat suite E2E ketika UI produk mulai dibuat. Tidak ada dummy purchase test yang dianggap membuktikan transaksi. Starter diverifikasi melalui browser nyata: halaman, health link, refresh, ukuran mobile, console dan request.

Untuk fitur berikutnya, gunakan Playwright serta akun isolated sesuai [matriks produk](../../docs/spec/verification.md). E2E perlu memeriksa state chain/DB setelah refresh, bukan hanya teks tampilan. Bedakan Anvil, official-token fork, dan Sepolia.
