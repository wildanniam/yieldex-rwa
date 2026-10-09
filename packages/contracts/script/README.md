# Deployment scripts

Implementasi kontrak dan deployment Anvil tersedia. Runner berada di [scripts/local/deploy.mts](../../../scripts/local/deploy.mts), dijalankan dari root melalui `pnpm local:deploy` setelah build kontrak dan Anvil siap. `pnpm test:local` juga menjalankan deploy lalu lifecycle, indexer dan read-service checks; ikuti [local core runbook](../../../docs/local-core.md).

Runner hanya mengirim ke `127.0.0.1:8545`, mewajibkan chain `31337`, memakai akun Anvil unlocked dan membuat registry, adapter, market, DemoUSD serta tiga token simulasi. Manifest/evidence disimpan di `.local/` yang di-ignore; source commit dan dirty state membedakan provenance deployment.

Script deployment Sepolia dan manifest Sepolia terverifikasi belum tersedia. Task deployment berikutnya perlu seed/role setup, receipt/explorer checks dan manifest sesuai schema. Jangan menganggap dukungan chain Sepolia pada config sebagai bukti kontrak telah dideploy. Token demo tidak memiliki backing saham nyata. Jangan menaruh private key atau broadcast artifact di Git.
