# Menjalankan dan melanjutkan starter

## Scope

Starter monorepo sudah mempunyai web shell, request backend health, worker lifecycle, shared schema validator/types, interface Solidity dan ABI hasil compiler, commands serta CI. Belum ada UI produk, wallet, auth, database schema produk, token demo, transaksi, indexer/finalizer, CopilotKit atau live quote. Foundation mempersiapkan pekerjaan itu tanpa mengarang status integrasi.

Satu repo, empat tempat runtime pada tahap deployment: web/API, worker, Supabase dan blockchain. Starter berjalan dari full workspace; production packaging/hosting menjadi task berikutnya. Desainer menentukan UI produk. Jobdesk dipilih saat meet.

## Setup pertama

Prasyarat: Git, Node **24.18.0**, pnpm **11.3.0**, Python 3.12+ dan [uv](https://docs.astral.sh/uv/getting-started/installation/). Commands menggunakan shell POSIX (macOS/Linux/WSL2); Windows native belum diuji. NVM opsional; `.nvmrc` dan `.node-version` mencatat versi. Foundry Forge/Anvil **1.7.1** dipasang sebagai binary npm lokal resmi saat install; tidak perlu mengganti instalasi Foundry global. Solidity compiler **0.8.34** dipin di foundry.toml.

```sh
git clone https://github.com/wildanniam/eth-jkt.git
cd eth-jkt
nvm install
nvm use
corepack pnpm install --frozen-lockfile
corepack pnpm doctor
corepack pnpm dev
```

Jika Node distribution tidak menyertakan Corepack, pasang [pnpm 11.3.0](https://pnpm.io/installation) sesuai OS lalu jalankan command `pnpm` yang sama. Tidak menggunakan install script global otomatis dari repo. Setelah `pnpm` tersedia pada PATH, semua command di bawah dapat dijalankan langsung. Node 20 tidak cocok dengan package manager starter ini.

Web: `http://127.0.0.1:3000`. Worker liveness: `http://127.0.0.1:3101/health`. Tidak diperlukan API key, wallet, database atau RPC untuk menjalankan starter. Jika port web sudah dipakai, Next dapat memilih port lain dan menuliskannya di terminal; worker menolak port yang sedang dipakai, ubah WORKER_PORT.

Install pertama memerlukan jaringan untuk dependency/binary/compiler. Build tidak mengambil font atau aset dari Google. Dependency JavaScript berada dalam lockfile bersama; Foundry tetap compiler/test runner Solidity.

## Commands dari root

| Command                               | Tujuan                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm dev`                            | Web dan worker bersama; Ctrl-C menghentikan keduanya                                 |
| `pnpm dev:web` / `pnpm dev:worker`    | Kerjakan satu proses saja                                                            |
| `pnpm worker:once`                    | Status starter lalu exit; tidak menjalankan jobs                                     |
| `pnpm doctor`                         | Cek runtime/CLI tanpa membaca isi secrets                                            |
| `pnpm build`                          | Compile interface, type-check shared, build worker dan Next                          |
| `pnpm generate`                       | Spec → Solidity interfaces → compiled ABI; schema → types/validators; export context |
| `pnpm generate:check`                 | Verifikasi hasil generate sama; tidak menulis ulang file generated                   |
| `pnpm check`                          | Format, lint, typecheck, tests, interface tests, generation, spec checks dan build   |
| `pnpm test` / `pnpm test:integration` | Tes TypeScript atau integration saja                                                 |
| `pnpm test:contracts`                 | Wire compatibility Solidity; belum tes perilaku market                               |
| `pnpm chain:local`                    | Anvil isolated chain 31337; bukan deployment produk                                  |
| `pnpm format`                         | Format source starter dan interface Solidity                                         |

`pnpm check` membutuhkan uv/Python untuk pemeriksaan dokumen yang sudah ada. Binary Foundry diakses melalui pnpm, sehingga `forge` global tidak harus ada. `pnpm exec forge --version` memeriksa versi yang dipakai repo. CI menjalankan commands yang sama pada push ke main dan pull request; periksa hasil untuk commit terkait pada tab Actions di GitHub.

## Environment dan secrets

Copy `apps/web/.env.example` ke `apps/web/.env.local` hanya jika dibutuhkan. Worker membaca `apps/worker/.env`; copy dari contoh untuk mengganti port. Semua `.env*` privat di-ignore, hanya `.env.example` dilacak.

Server-only provider keys tidak menggunakan prefix NEXT_PUBLIC_. Signing key finalizer kelak hanya milik worker, bukan web, shared atau AI. Starter tidak mempunyai code path untuk membaca key tersebut atau mengirim transaksi. Deployments/asset manifests belum tersedia; chain IDs bukan bukti address terdeploy. Jangan memasukkan fixture address menjadi konfigurasi deployment.

## Batas package

| Lokasi                      | Tanggung jawab                                                 | Langkah berikutnya                                |
| --------------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| apps/web/src/app            | Pages dan route adapters                                       | Peta layar/data sesuai desain, task 5.1           |
| apps/web/src/server         | Request domain services dan provider integrations              | API/task 4.3–4.5; AI/tools task 6                 |
| apps/worker                 | Process lifecycle lalu indexer/finalizer terpisah secara logis | Task 2.5 dan 4.2 setelah dependency siap          |
| packages/contracts          | Interface dari spec, implementation dan test Solidity nanti    | Mock/adapter/registry task 2, accounting task 3   |
| packages/shared             | Public config, generated types/validators/ABI                  | Dipakai kedua app; tidak mengimpor server secrets |
| schemas + examples          | Source wire format dan fixtures                                | Revisi bersama ketika interface berubah           |
| supabase/migrations + tests | Database schema dan RLS berikutnya                             | Task 4.1; belum migration runtime                 |
| tests/integration + e2e     | Perilaku antarmodul dan browser                                | Tambahkan journey ketika fitur tersedia           |

`@rwa/shared` adalah package internal workspace. Tidak perlu publish npm. Source exports TypeScript dikompilasi Next atau dibaca tsx. ABI diekspor melalui `@rwa/shared/abi` dan dilabeli INTERFACE_ONLY: compiler sudah memeriksa bentuk interface, belum kontrak dana/deployment.

## Spec-driven development bersama

Langkah Git, standar testing sebelum push dan proses PR/review ada di [CONTRIBUTING](../CONTRIBUTING.md). Itu acuan workflow kontribusi; bagian ini merangkum hubungan dengan spec.

1. Sinkronkan branch/revision. Baca README, CONTRIBUTING, AGENTS, keputusan aktif, task dan interface modul.
2. Pilih satu task dan ownership file; koordinasikan perubahan schema/ABI sebelum coding consumer.
3. Ubah source spec/schema terlebih dahulu bila memang perlu; `pnpm generate`. Jangan edit generated files.
4. Implementasikan, jalankan tes terkait dan `pnpm check`, review diff termasuk generated outputs.
5. Dokumentasikan bukti aktual dan batas. Checkbox produk tidak selesai hanya karena fixture/stub lulus.
6. Gunakan branch fitur → tes → commit/push → PR → review. Issue opsional untuk tim; cukup ringkasan perubahan, hasil tes dan catatan di PR. Initial direct-main push hanya pengecualian bootstrap.

Interface Solidity dihasilkan dari tujuh code fences normative dalam contract-interface.md dengan pembagian market/registry/adapter. Penambahan struktur/metode memerlukan review generator dan interface ownership. CI memeriksa drift; generated ABI belum menjanjikan kompatibilitas implementasi yang belum dibuat.

Type generation tidak mengubah JSON string integer menjadi JS number. Runtime validator menangani schema shape/range; semantik ownership, chain snapshot, penghitungan, authorization dan validitas intent tetap milik implementation. Tiga semantic-invalid fixtures sengaja schema-valid dan tetap bukan izin sign/send.

## Sumber tooling

- [pnpm 11 migration/config](https://pnpm.io/blog/releases/11.0): allowBuilds dan settings workspace; package manager dipin tanpa mengganti global.
- [Next installation](https://nextjs.org/docs/app/getting-started/installation) dan [backend pattern](https://nextjs.org/docs/app/guides/backend-for-frontend).
- [Foundry](https://www.getfoundry.sh/forge/index.html); paket npm resmi berasal dari [foundry-rs/foundry](https://github.com/foundry-rs/foundry/tree/master/npm).
- [Ajv JSON Schema](https://ajv.js.org/json-schema.html): Draft 2020-12 dan runtime validation.

Versi dependency aktual dipin dalam package.json dan pnpm-lock.yaml. TypeScript 5.9 dipilih dalam rentang kompatibilitas typescript-eslint. ESLint 9.39.4 dipertahankan karena plugin React/import/a11y yang dipakai eslint-config-next belum menerima ESLint 10 dalam peer range; registry menandai ESLint 9 deprecated. Ini batas dev tooling yang dicatat, bukan alasan memaksakan peer override. Evaluasi migrasi lint setelah plugin kompatibel; production Next/React memakai versi yang dipin dan diuji. Tidak otomatis menaikkan semua tools ke major terbaru.
