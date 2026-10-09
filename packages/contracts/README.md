# Contract workspace

Registry, market, adapter dan token simulasi ada di `src/`; interfaces normatif digenerate dari spec. `pnpm generate` mengompilasi implementasi dan memeriksa parity ABI sebelum mengekspor `implementationAbis` dan `interfaceAbis` di shared. Tahap IMPLEMENTED_LOCAL tidak berarti audit atau deployment Sepolia.

`pnpm test:contracts` menjalankan unit, independent arithmetic, fuzz 1000 runs dan invariant 128×64. Fork official-token dipisahkan lewat `pnpm test:fork` dan memerlukan ETHEREUM_RPC_URL; missing key tidak dianggap pass. `pnpm test:local` melakukan transaksi Anvil sungguhan dan tes DB/read service setelah Anvil/Supabase aktif. Lihat [runbook](../../docs/local-core.md) dan [bukti](../../docs/core-verification.md).

DemoUSD (6 decimals), demoSPY/demoAAPL/demoMSFT (18 decimals) adalah simulasi tanpa backing saham nyata. Mainnet fork writes hanya terjadi dalam fork terisolasi; tidak ada mainnet deployment atau swap.
