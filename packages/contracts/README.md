# Solidity workspace

`src/interfaces/` digenerate dari [interface spec](../../docs/spec/contract-interface.md) dan dikompilasi Foundry. Implementasi kelak mengikuti interface tersebut. Jangan mengedit generated files; ubah spec secara terkoordinasi lalu `pnpm generate`.

ABI pada shared adalah **INTERFACE_ONLY**, belum ABI deployment atau bukti perilaku transaksi. Tidak ada address palsu/default address, mock token, custody atau deployable market.

`pnpm test:contracts` dari root menjalankan wire compatibility checks (selector, enum encoding, tuple order). Unit/fuzz/invariant/fork untuk perilaku ekonomi tetap task 2/3/7. Root menginstal binary resmi `@foundry-rs/forge`/`anvil` secara lokal, sehingga instalasi global tidak wajib. Compiler dipin di foundry.toml; unduhan compiler pertama membutuhkan internet.
