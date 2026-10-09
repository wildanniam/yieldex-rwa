# Menjalankan core lokal

Gunakan toolchain root yang dipin. Docker dan Supabase CLI 2.108.0 diperlukan untuk pengujian database; Forge/Anvil dipasang oleh pnpm. Supabase config mematikan Studio/storage/realtime yang tidak dipakai core.

```sh
pnpm install --frozen-lockfile
pnpm generate
supabase start
supabase migration up --local
# Terminal terpisah; jangan gunakan key wallet pribadi untuk Anvil.
pnpm exec anvil --host 127.0.0.1 --chain-id 31337 --silent
# Root repo, terminal kedua:
pnpm test:local
```

`test:local` membuat deployment baru dengan tiga mock assets, memverifikasi receipt, lalu menjalankan lifecycle Alice/Bob/Carol, finalized indexer/PostgreSQL, dan read-service pagination. Script tidak mengirim ke RPC remote. Anvil memakai akun lokal unlocked; ini hanya jaringan development di localhost. Simulasi waktu dan dividen diberi label. Setiap rerun membuat deployment baru; tidak mereset data milik pengguna.

Output ignored: `.local/deployment.json`, deployment/lifecycle evidence. Manifest mencatat source commit, sementara evidence mencatat `sourceDirty`; hasil dirty tidak dipresentasikan sebagai deployment source-pinned. Setelah commit, rerun untuk mendapatkan provenance bersih. Jangan commit manifest lokal sebagai alamat Sepolia.

Tes RLS rollback-only:

```sh
docker exec -i supabase_db_yieldex-rwa psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/core_rls.sql
```

Web `.env.local` dan worker `.env` membutuhkan DATABASE_URL lokal, MARKETPLACE_RPC_URL, DEPLOYMENT_MANIFEST (path hasil deploy), dan web CURSOR_SECRET acak minimal 32 karakter. Jangan memakai nilai test cursor dari script untuk hosting. Semua env tetap ignored. Restart web/worker setelah mengganti manifest; deployment context dipin selama proses berjalan.

```sh
pnpm worker:index
pnpm dev:web
```

`worker:index` membaca finalized logs; mode default worker shell tetap hanya health. Indexer tidak mempunyai key penandatangan. Apabila finalized hash bertentangan, semua cursor chain ditahan REBUILDING. Operator hanya boleh menjalankan recovery setelah memeriksa sumber RPC; full replay mempertahankan raw orphan logs dan membangun ulang projection. Kegagalan batch tidak memajukan cursor.

Public endpoints: `/api/v1/deployments`, `/api/v1/chains/{chainId}/registries/{registry}/assets`, `/api/v1/chains/{chainId}/markets/{market}/listings`, detail/positions/account claims; `/api/v1/quotes/compare` menerima shared QuoteRequest. Private routes dan transaction status mempunyai gate terpisah; jangan menganggap catch-all menyediakan endpoint yang belum ada.

Quote live memerlukan ZEROX_API_KEY server. `pnpm test:quotes:live` menjalankan tepat 12 amount-specific price reads (dua mode × dua arah × tiga chain), tanpa swap/approval/signing. Hasil live terpisah dari fixture. [0x pricing](https://0x.org/pricing) membatasi penggunaan berkelanjutan hanya untuk quote pada Standard plan; satu smoke tidak menjamin entitlement hosting. Rate limiter lokal berlaku per proses; default tidak mempercayai header IP pengguna. Hosting multi-instance memerlukan shared budget dan edge yang menimpa header IP sebelum TRUST_PROXY_IP_HEADER diaktifkan.

`pnpm test:fork` memerlukan ETHEREUM_RPC_URL dari env ignored. Fork proof adalah source-state/transfer compatibility; impersonated corporate events/pause dinyatakan synthetic. Tidak membutuhkan token resmi dibeli di mainnet.

Local Supabase memakai project ID `yieldex-rwa`. Jika stack eksperimen `RWA-ETHJKT` masih memakai port 54321/54322, hentikan stack itu secara terkontrol atau pilih port terpisah sebelum `supabase start`. Jangan memakai `db reset` untuk memindahkan project dan jangan menghapus volume/data lama. Hosted project/link dan env tidak ikut dalam import source.

## Private API and operator checks

`APP_ORIGIN=http://localhost:3000` must match the browser origin exactly. Configure local Supabase URL/publishable key and enable native Ethereum Web3 in config.toml. App challenge and admitted-session RLS protect private APIs even when the native provider accepts replay. Use `pnpm test:auth:local`, `pnpm test:auth:http` (Next running on localhost:3000), `pnpm test:intents:local` and `pnpm test:history:local`. Intent integration uses new isolated wallets funded only on Anvil and exercises all nine actions. Run against a fresh `pnpm test:local` deployment when a previous economic scenario was interrupted; never reuse an ambiguous issuer schedule as a clean baseline.

Local deploy sets Anvil virtual timestamps to one second per block. This deliberate simulator clock removes wall-clock latency races; it does not accelerate Sepolia or claim real issuer timing.

`pnpm test:outbox:local` uses a new random local finalizer account, grants its bounded registry role, and tests persisted signed bytes, response loss after broadcast, restart, finalized confirmation and unique nonces across assets. The test deliberately quarantines assets and latches one finality conflict; create a new deployment afterwards for an ordinary demo. It never uses a personal wallet. `pnpm test:issuer:live` reads official public corporate-action history and tests revision observation storage; those observations do not finalize dividends.

`worker:finalize` requires FINALIZER_PRIVATE_KEY only in the private worker env and processes existing reviewed jobs. RegistryOutbox accepts only event append, snapshot acknowledgment, coverage, quarantine escalation and finality-conflict reports. It stores signed metadata transaction bytes before broadcast and resubmits only identical bytes/hash; confirmed status requires finalized receipt. A nonce consumed by an unknown replacement or a reverted receipt is HELD for operator review. No automatic fresh-nonce retry, fee bump, arbitrary target, payout or balance edit exists. The finalizer key is not needed by the read indexer, web or chatbot.

`issuer:poll SPYx` is observation-only and requires explicit ISSUER_ASSET_KEY mapping and DATABASE_URL; it has no signer. Pagination is bounded to 1,000 observations, unknown/cancelled types stay held, and same-version changes preserve both payload hashes. A reviewed classification/history/implementation-evidence workflow is still required before live issuer observations can authorize registry jobs or coverage. Do not advertise the observation CLI as fully automated issuer reconciliation.

## Functional wallet lab dan reviewed operator

Buka `http://localhost:3000/lab` setelah deployment/indexer/web siap. Wallet harus memakai chain 31337 lokal atau 11155111 sesuai manifest. `APP_ORIGIN` harus sama dengan browser. Lab menampilkan tombol fungsional dan review; Afer dapat memakai `MarketplaceWallet` serta shared `prepareTransaction` pada desain final. Rafi memakai HTTP intent/history/quote dan DTO yang sama. Guest dapat memakai wallet/manual market; login hanya untuk fitur privat.

`pnpm test:wallet:local` menguji wrong account/chain, tampered preview, rejected prompt, double click, pending journal reload, same-nonce repricing/cancellation dan controlled receipt reorg. Ia membuat snapshot Anvil lalu mengembalikannya; hentikan indexer/browser yang aktif menulis selama tes ini. Browser acceptance aktual serta batas wallet fixture dicatat pada core-verification.md. Jangan pasang test provider pada aplikasi production.

`pnpm test:reconcile:local` menguji finalized source → append → acknowledge → coverage dengan receipt final, missing classification, immutable correction incident dan runtime/implementation policy. Gunakan deployment baru; test sengaja mengkarantina aset ketiga.

Runner private menerima satu file operator: `pnpm --filter @rwa/worker finalize:once /absolute/path/reviewed.json`. Tanpa argumen ia hanya memproses outbox yang sudah tersimpan. File maksimal 1 MiB, field tambahan ditolak, bilangan uint256 berupa string desimal; `kind` 0/1/2/3 (DIVIDEND/SPLIT/REVERSE_SPLIT/NO_INCOME) dan `sourceRevision` tetap JSON integer. Struktur persis parser `apps/worker/src/finalizer/review-file.ts`: root `{policy, report}`, policy memuat assetId, tokenRuntimeCodeHash, implementationAddress (null untuk mock tanpa proxy); report memuat assetId, sourceKind, evidenceHash, sourceBlockNumber/hash/timestamp, reviewedThrough, events. Setiap event mengikuti `FinalizedAssetEvent` ABI dengan integer besar berupa string.

Simpan laporan di lokasi private/ignored. Operator bertanggung jawab memeriksa klasifikasi dan kelengkapan sumber; file lolos parser **bukan** bukti data issuer lengkap. `SIMULATOR` hanya untuk aset demo. Report mengikat finalized source block dan code/implementation policy. Jalankan lagi setelah finality untuk melanjutkan tahap berikutnya; PENDING/WAITING_SOURCE bukan COMPLETE. Koreksi yang bertentangan dengan event terpakai menyebabkan HELD/finality conflict; tidak ada rewrite atau pengambilan kembali payout. Jalur ini bukan endpoint browser/model.

Urutan regression terisolasi: `pnpm test:local` → auth/history/intents → `pnpm test:wallet:local`; kemudian **deployment baru** untuk `test:reconcile:local`, dan deployment baru lagi untuk `test:outbox:local`. Reconciler/outbox sengaja meninggalkan incident state. Jangan menjalankan simulator berbeda serentak pada deployment yang sama.

## Recovery sebelum Sepolia

`pnpm test:recovery:local` menguji temporary quarantine → verified append/ack → admin resume → coverage/checkpoint, lalu deterministic adapter failure dengan indexer/SQL/read services aktual. Ia membuat chain/database sementara sendiri; tidak memerlukan `local:deploy` dan tidak memodifikasi dataset `/lab`. Supabase PostgreSQL port 54322 harus aktif.

Jika reviewed reconciler berstatus `HELD` sesudah metadata temporary quarantine tersinkronisasi, periksa safetyState/finalityConflict dan bukti operator. Resume hanya oleh admin setelah penyebab selesai; jalankan report lagi untuk coverage. `finalityConflict=true` tidak bisa dipulihkan melalui resume. Outbox `HELD` akibat reverted/replaced transaksi adalah insiden berbeda yang memerlukan review; jangan reset atau buat nonce baru otomatis.

### Worker regression terisolasi

`pnpm test:worker:local` membuat Anvil pada port sementara dan database baru di Supabase lokal (54322), lalu membersihkannya. Menguji JSON NO_INCOME sampai checkpoint serta pengulangan jadwal A → B → A, evidence sama/berbeda, concurrent retry, response loss dan restart. Tidak memakai chain/database `/lab`. Bukti lokal berada di `.local/worker-regression-evidence/`; ini bukan tes auth atau Sepolia.

ACK memakai key transisi dari occurrence ACK sebelumnya (block hash, transaction hash, log index) dan snapshot tujuan; scope chain/registry/asset tetap berlaku. Riwayat dibaca mundur dalam rentang maksimal 2000 blok per RPC pada blok yang sama dengan head/live snapshot. Provider harus mendukung pembacaan history sejak deployment; error history menahan proses, tidak membuat key alternatif. Pengulangan source/evidence tidak menyamakan transisi yang terjadi pada waktu berbeda. Konflik payload pada job yang sama tetap ditolak; job pending/HELD lama diselesaikan atau direview sesuai runbook, tidak dihapus untuk melewati nonce recovery.

### Recovery identitas ACK dan transaksi wallet

Terapkan migration `202610080007_recovery_identity.sql` sebelum menjalankan web/worker yang memuat perbaikan ini. Upgrade memakai `supabase migration up --local`; hentikan proses lama dan restart sesudah migration. Regression terisolasi tidak memperbarui database `/lab` milik pengguna.

`pnpm test:recovery:edges` membuat Anvil/database sementara sendiri. Ia menguji ACK unsigned usang, override jadwal dan recurrence, concurrency/restart, signed job yang tetap HELD, serta speed-up wallet dengan hash lama yang benar-benar hilang dari RPC. Evidence di `.local/recovery-edge-evidence/`. Fixture session dan controlled RPC retention diberi label; bukan bukti UI/auth/Sepolia.

READY ACK hanya dapat menjadi SUPERSEDED jika belum memiliki signer/nonce/hash/bytes dan snapshot finalized serta live sama-sama membuktikan targetnya usang. Riwayat dipertahankan; report baru tetap harus melalui review/validasi. Signed job mengikuti receipt recovery seperti biasa. Jangan mengubah signed/HELD job ke SUPERSEDED secara manual.

Intent menyimpan nonce dari transaksi RPC yang sudah cocok dengan preview. Replacement tetap harus memiliki signer/chain/target/calldata/value dan nonce yang sama. Untuk intent lama dengan nonce null, original yang masih tersedia diverifikasi ulang. Jika original sudah hilang, API memberi HTTP409 ORIGINAL_TRANSACTION_UNAVAILABLE dan mempertahankan record lama; ini bukan transaksi sukses maupun alasan untuk otomatis mengirim ulang tindakan ekonomi.
