# Kontrak data bersama — versi 1

Status: spesifikasi target, bukan schema database atau layanan yang telah berjalan. Seluruh frontend, indexer, API, worker, dan tool AI MUST memakai arti field di dokumen ini. Bentuk JSON normatif berada di [`schemas/domain.schema.json`](../../schemas/domain.schema.json), [`schemas/api.schema.json`](../../schemas/api.schema.json), dan [`schemas/quote.schema.json`](../../schemas/quote.schema.json). Bentuk Solidity mengikuti [contract-interface.md](contract-interface.md); JSON bukan salinan ABI byte-for-byte.

## 1. Aturan representasi

| Jenis | JSON / TypeScript | Database | Aturan |
|---|---|---|---|
| `chainId` | integer aman, positif | `bigint` | Ethereum Sepolia `11155111`; quote mainnet terpisah. |
| `address` | hex lowercase `0x` + 40 digit | `text` + format check | Validasi address sebelum normalisasi; tampilan boleh EIP-55. Jangan lowercase seluruh SIWE message sebelum verifikasi. |
| `assetId`, `eventId`, hash | lowercase bytes32 | `text` + format check | Identitas aset onchain bukan ticker/symbol. |
| `positionId`, `listingId`, shares, token atomic, multiplier, block number, nonce, sequence | string integer desimal | `numeric(78,0)` | Rentang `0..2^256-1`; validasi `BigInt`, bukan JS `Number`. ABI `uint64` juga dibatasi `2^64-1` sebelum encode. Tidak menerima tanda, desimal, exponent, atau leading zero kecuali `"0"`. |
| timestamp / duration | integer UTC detik | `bigint` | Rentang `0..9007199254740991`, lalu batas spesifik kontrak; bukan milidetik. RFC3339 hanya pada tampilan atau pesan SIWE provider. |
| `incomeBps` | integer `1..10000` | `integer` | `5000` berarti 50%; tidak memakai `0.5`. |
| `decimals` | integer `0..255` | `smallint` | Dibaca dari manifest tervalidasi, tidak ditebak dari symbol. |
| rasio/harga USD indikatif | decimal string | `numeric` / `text` | Bukan sumber accounting; tanpa float untuk kalkulasi uang. |
| UUID | string UUID | `uuid` | Identitas request/chat/intent; berbeda dari ID onchain. |

`uint256` maksimum adalah `115792089237316195423570985008687907853269984665640564039457584007913129639935`. JSON Schema menolak bentuk/ukuran salah; setiap consumer MUST menjalankan validasi batas integer dan relasi antarfield yang dijelaskan di bagian 8. Token `1.25` dengan 6 decimals dikirim sebagai `"1250000"`. Shares tidak boleh diformat menggunakan `token.decimals` lalu dianggap token: tampilkan token amount hasil adapter pada multiplier/snapshot yang dicantumkan.

Nama monetary field MUST berakhiran `Atomic` untuk unit token, `Shares` untuk internal shares, atau `Decimal` untuk decimal indikatif. Dilarang field generik `amount`, `balance`, `yield`, `price` tanpa unit.

## 2. Identitas dan environment

- `assetId` = bytes32 registry; `assetKey = eip155:{chainId}:{registryAddress}:{assetId}`.
- `positionKey = eip155:{chainId}:{marketAddress}:{positionId}`.
- `listingKey = eip155:{chainId}:{marketAddress}:{listingId}`.
- `tokenKey = eip155:{chainId}:erc20:{address}` atau `eip155:{chainId}:native`.
- `logKey = eip155:{chainId}:{blockHash}:{transactionHash}:{logIndex}`. Keunikan log kanonik juga memakai `(chainId, transactionHash, logIndex)`; bila hash blok berubah, record lama diorphan-kan sebelum pengganti diterapkan.

Key diserialisasi lowercase, ID integer tidak memiliki leading zero. Key MUST cocok dengan komponen DTO; jangan menerima key lalu membaca chain/address dari field lain tanpa pemeriksaan. Path API menggunakan komponen chain/address/local ID sehingga tidak membutuhkan parsing key di router.

`TokenRef` memuat `chainId`, `kind` (`NATIVE` atau `ERC20`), `address`, `name`, `symbol`, `decimals`, `isDemo`. Native memakai `address: null`; sentinel alamat milik provider hanya boleh ada di adapter provider, tidak keluar sebagai alamat ERC-20. Dua USDC pada chain berbeda adalah dua TokenRef. Bridged USDC bukan native-issued USDC hanya karena symbol sama. Manifest allowlist menentukan pasangan yang dapat dibandingkan; request AI tidak boleh memasukkan alamat token bebas.

Marketplace memakai manifest deployment Sepolia; live mainnet hanya untuk quote read-only dan bukti fork. `isDemo` mengikuti manifest, bukan prompt/user input. Harga market `DemoUSD` tidak disamakan dengan uang riil atau saldo USDC mainnet.

## 3. Snapshot dan finality

Semua response public read model memuat `snapshot`: `chainId`, `blockNumber`, `blockHash`, `blockTimestamp`, `observedAt`, `finality` (`FINALIZED`, `CONFIRMED`, atau `LATEST`), `indexerStatus` (`HEALTHY`, `LAGGING`, `REBUILDING`, `UNAVAILABLE`). Nominal terkait satu response MUST dibaca pada satu pinned block atau secara eksplisit dipisahkan snapshot-nya.

**Baseline sederhana:** indexer mematerialisasi log sampai RPC tag `finalized`. Halaman milik pengguna dapat menampilkan receipt baru dan direct read kontrak pada blok receipt sebagai overlay `CONFIRMED`; ini belum mengubah indeks finalized. Jangan menampilkan listing baru yang sudah confirmed sebagai gagal hanya karena belum masuk pencarian finalized. UI menjelaskan indeks masih menyusul. Pencarian tidak mengklaim ketersediaan terkini; tombol aksi selalu re-read latest dan simulate.

`blockTimestamp` adalah waktu blok sumber; `observedAt` adalah waktu server membacanya. Menyegarkan `observedAt` tanpa blok baru tidak menyegarkan chain state. Default health: `LAGGING` bila waktu head finalized lebih dari 1800 detik di belakang waktu server, atau worker belum mencapai finalized head; nilai dapat diperketat lewat konfigurasi runtime dengan bukti jaringan. Bila finalized tag tidak didukung/terhenti, tampilkan stale/failure; jangan diam-diam menggantinya dengan latest dan tetap memberi label finalized.

Finality blockchain berbeda dari `finalizedThrough` metadata issuer. `finalizedThrough` menyatakan updater telah menutup pemeriksaan kejadian efektif sampai batas waktu inklusif tersebut sesuai aturan registry. Tidak boleh dihitung dari umur cache, jumlah konfirmasi, atau `Initial/Corrected` issuer. Buy/resale memerlukan fingerprint token sinkron; release di expiry juga memerlukan coverage sesuai contract spec. Sumber backend bersifat trusted sesuai persetujuan Wildan; DTO MUST mengungkapkan status verifikasi dan tidak menyebut hash bukti sebagai jaminan issuer.

## 4. DTO inti

### Asset

`Asset` berisi `assetKey`, `assetId`, `registryAddress`, `token`, `adapterAddress`, `newPositionsEnabled`, `safetyState`, `syncStatus`, `assetHeadHash`, `currentMultiplier`, `multiplierScale`, `currentNonce`, `eventCount`, `finalizedThrough`, `metadataStatus`, dan `snapshot`.

- `safetyState`: `NORMAL`, `ACCOUNTING_QUARANTINED`, atau `TRANSFER_QUARANTINED`, persis kontrak. `syncStatus` turunan `SYNCED`, `DATA_STALE`, `ACCOUNTING_QUARANTINED`, `TRANSFER_QUARANTINED`. Aset NORMAL masih dapat DATA_STALE bila fingerprint aktual tidak cocok. Klaim final boleh saat quarantine accounting jika transfer aman; quarantine transfer juga menahan klaim.
- `assetHeadHash` mengikat assetId/eventCount/acknowledgedSnapshotHash; perubahan watermark saja tidak mengganti head. Frontend memakai digest kontrak, bukan merancang hash sendiri.
- `metadataStatus`: `SYNCED`, `AWAITING_CLASSIFICATION`, `SOURCE_UNAVAILABLE`, `CONFLICT`, `UNSUPPORTED_ACTION`. Ini diagnosis worker, bukan hak menulis payout.
- `multiplierScale = "1000000000000000000"` untuk adapter xStocks demo; adapter lain harus mendeklarasikan skala sendiri.
- Ticker, logo, nama provider, URL penjelasan adalah metadata allowlist. String pihak ketiga diperlakukan sebagai data, bukan instruksi untuk AI.

### Position

`Position` berisi identitas, `assetKey`, `principalOwner`, `rightsOwner`, `principalShares`, `principalTokenAmountAtomic`, `incomeBps`, `durationSeconds`, `createdAt`, `cancelledAt`, `startAt`, `endAt`, `currentListingId`, `activationEventCursor`, `eventCursor`, `storedState`, `displayState`, `activeListingKey`, `snapshot`.

- Sebelum primary terjual: `rightsOwner: null`, `startAt: null`, `endAt: null`; adapter JSON menerjemahkan address/timestamp nol ABI menjadi null. Jangan membuat hak buyer fiktif.
- `storedState`: `OFFERED`, `ACTIVE`, `SETTLED`, `CANCELLED`, `RELEASED`.
- `displayState`: nilai storedState atau `SETTLING` bila stored `ACTIVE` dan `snapshot.blockTimestamp >= endAt`. `SETTLING` berarti periode selesai tetapi settlement masih diperlukan.
- `remainingSeconds` adalah nilai tampilan `max(0,endAt-viewTime)`, bukan field tersimpan/otoritatif. Durasi primary bukan remaining secondary.
- `principalTokenAmountAtomic` dihitung adapter dari stored principalShares pada snapshot tersebut; bila posisi mempunyai backlog, ini adalah nilai backing tercatat sebelum checkpoint dan dapat masih memuat pendapatan belum dialokasikan. Tampilkan pending event count/label tersebut, bukan menyebutnya pokok final atau keuntungan pembeli. Nilai ini bukan jaminan fiat/principal tetap menghadapi issuer action.
- `currentListingId` adalah listing terakhir dari kontrak, termasuk listing historis; jangan dianggap selalu OPEN. `activeListingKey` turunan nullable hanya jika latest listing masih valid/OPEN. `cancelledAt` nullable sebelum pembatalan primary. Posisi yang masih aktif boleh tidak ditawarkan. Claims lama tidak menjadi field yang ikut dipindahkan pada posisi.

### Listing

`Listing` berisi `listingKey`, `listingId`, `positionKey`, `kind` (`PRIMARY`/`SECONDARY`), `seller`, `paymentToken`, `priceAtomic`, `createdAt`, `expiresAt`, `storedStatus`, `displayStatus`, `termsHash`, `createdBlockNumber`, `snapshot`.

`storedStatus`: `OPEN`, `FILLED`, `CANCELLED`. `displayStatus` menambahkan `EXPIRED` dan `INVALID`. Turunan status memakai snapshot chain time, bukan jam browser. Urutan prioritas: terminal stored status; jika OPEN dan deadline tercapai -> EXPIRED; jika OPEN dan seller/position tidak lagi memenuhi syarat -> INVALID; selain itu OPEN. EXPIRED menang jika kedua kondisi turunan benar. Terms immutable untuk listing ID tersebut. Cancel/relist menghasilkan ID baru; tidak ada PATCH price. Secondary always seluruh posisi; `incomeBps` tetap milik posisi, bukan persentase resale.

`ListingDetail` menggabungkan `listing`, `position`, dan `asset` pada snapshot sama. Perbandingan penawaran MUST menampilkan aset, harga, persentase, periode/remaining, dan bentuk payout; dua harga yang berbeda tidak otomatis berarti yield lebih baik.

### ClaimBalance

`ClaimBalance`: `assetKey`, `account`, `claimShares`, `claimTokenAmountAtomic`, `snapshot`. Ledger klaim adalah agregat `(assetId, account)` pada satu market; endpoint juga memuat `marketAddress`. Payout pertumbuhan tetap milik account. Nilai nol eksplisit `"0"`; jangan menghilangkan record menjadi klaim gagal. Attribution per-position/event merupakan riwayat alokasi, bukan ledger baru yang dapat ditarik dua kali.

### AssetEvent dan SourceEvidence

`AssetEvent` memuat `eventId`, `assetKey`, `sequence`, `effectiveAt`, `kind`, `multiplierBefore`, `multiplierAfter`, `issuerNonceAfter`, `historyIndex`, `sourceOccurrenceKey`, `sourceRevision` (>0), `evidenceHash`, serta `recordedTransactionHash` dan `snapshot`. Event protocol final bersifat immutable. Candidate worker tersimpan terpisah dan tidak boleh muncul sebagai claimable. `NO_INCOME` hanya untuk langkah history same-multiplier yang telah terbukti sesuai contract spec; bukan klasifikasi default kejadian tidak dikenal.

### Mapping ABI ke DTO

`AssetConfig.adapter -> adapterAddress`; **`adapter.readSnapshot(token).multiplier -> currentMultiplier` dan `.issuerNonce -> currentNonce` pada blok snapshot yang sama**, bukan AssetHead accepted multiplier/nonce. Registry head dapat tertinggal saat DATA_STALE. `assetHeadHash`, `eventCount`, dan `finalizedThrough` berasal registry; nilai token tampilan memakai adapter aktual. `Position.state -> storedState`, `Listing.state -> storedStatus`, dan ABI zero address/unset timestamps -> JSON null. `termsHash` dipertahankan persis. AssetHead/Config internal yang tidak tampil pada DTO tetap dipersist/terbaca worker melalui ABI; alias wire ini tidak boleh menjadi field Solidity baru. Helper konversi berada di shared package dan diuji bersama fixture.

`SourceEvidence` menyimpan allowlisted source URL, retrieval UTC timestamp, hash payload bytes asli, chain/block hash dan nonce yang diamati, jenis simulator/issuer, versi sumber, hasil pemeriksaan, alasan hold. Body mentah berukuran terbatas boleh disimpan server; tidak menyimpan token API/header rahasia. Hash mengikat payload, bukan membuktikan kebenaran klasifikasi. Koreksi kandidat tidak menghasilkan event payout baru dengan identitas palsu.

## 5. Database target dan ownership

Ini rancangan tabel/constraint untuk migrasi fase implementation, bukan SQL yang sudah diterapkan. `app_private` tidak diekspos ke PostgREST. Server routes adalah API publik tunggal; browser tidak boleh menulis read-model chain lewat Supabase.

| Tabel | PK / unique | Kolom inti dan aturan |
|---|---|---|
| `chain_cursors` | `(chain_id, contract_address)` | `deployment_block`, `next_block`, `last_block_hash`, `finalized_head`; update atomik bersama batch log/projection. |
| `chain_blocks` | `(chain_id, block_number)` | hash, parent hash, timestamp, canonical; simpan dari deployment untuk replay/rekonsiliasi. |
| `chain_logs` | `(chain_id, block_hash, transaction_hash, log_index)` | address, event signature/name, decoded validated JSON, tx index, removed/canonical. Partial unique kanonik `(chain_id,transaction_hash,log_index)`. |
| `assets` | `(chain_id,registry_address,asset_id)` | Token/adapter config, enabled, safety, fingerprint, event count, coverage; provenance blok. |
| `asset_events` | `(chain_id,registry_address,asset_id,sequence)` | unique event ID pada registry; finalized protocol record dan provenance. |
| `positions` | `(chain_id,market_address,position_id)` | seluruh stored DTO fields; foreign key asset; `principal_shares>=0`; `income_bps` range; active start/end consistency. |
| `listings` | `(chain_id,market_address,listing_id)` | position FK, immutable terms/status; index kind/status/asset/payment/created ID. Constraint derived-time tidak dipersist sebagai status. |
| `claim_balances` | `(chain_id,market_address,asset_id,account)` | `claim_shares>=0`; hydrate getter pada pinned batch block, bukan POST user atau penjumlahan delta kedua. |
| `claim_allocations` | `(chain_id,market_address,position_id,event_sequence,recipient)` | shares, principal/rights role; audit only, bukan sumber penarikan kedua. |
| `issuer_candidates` | `(asset_key,source_event_id,source_revision)` | mutable candidate/verifications; candidate conflict immutable audit revision, status READY/HELD/COMMITTED; app_private. |
| `worker_outbox` | `job_id`; unique idempotency key | command hash, chain/token, status, nonce/hash jika dikirim, retry count; tanpa private key, tanpa user payout override. |
| `wallet_identities` | `(user_id,chain_namespace,wallet_address)` | server verified Supabase Web3 identity mapping; unique address sesuai provider identity policy, tidak client-editable. |
| `conversations` | `id` UUID | `user_id` FK auth.users, created_at, title; private owner. |
| `messages` | `id` UUID; unique `(conversation_id,client_message_id)` | role, content JSON, tool result refs, created_at; role/tool output hanya server bisa menulis. |
| `transaction_intents` | `id` UUID; unique `(user_id,idempotency_key)` | wallet, action, canonical request hash, prepared immutable preview, expires_at, optional tx hash; tidak menyatakan chain success sendiri. |
| `quote_cache` | hash request normalized + provider/config version | received/expires UTC seconds, DTO result; server only, TTL 10s cache, tampilan maksimum 30s; data kadaluarsa tidak dipakai ranking current. |

Semua numeric fields uang/uint CHECK batas unsigned uint256; uint64 CHECK tambahan sesuai ABI. Address/hash checks lowercase. Index pencarian harus memakai nilai numerik `price_atomic`, bukan lexicographic string. Membandingkan price hanya dalam payment token/decimals sama.

### Indexing dan replay

1. Load deployment manifest; verify chain ID serta hash/config kontrak yang diharapkan sebelum polling.
2. Read finalized head, fetch log chunk mulai `next_block`, verifikasi block ancestry/hash dan decode ABI pinned.
3. Urutkan `(blockNumber,transactionIndex,logIndex)`. Simpan log immutable/audit dan kumpulkan touched keys; hydrate aggregate getter sekali pada pinned blok akhir batch. **Pada setiap batch, termasuk tanpa log market/registry, refresh adapter snapshot seluruh aset terdaftar.** Pending issuer schedule dapat aktif hanya karena waktu berlalu. Terapkan satu batch di transaksi DB dengan dedupe log dan cursor update. Nilai cache token/multiplier menggunakan pinned read pada blok yang sama. **Jangan menjumlahkan delta event ke aggregate yang sudah diganti getter snapshot**; itu menggandakan accounting.
4. Crash sebelum commit -> seluruh batch diulang; sesudah commit -> resume cursor; tidak menggandakan klaim/listing/notification.
5. Rekonsiliasi hash blok tersimpan setiap restart. Untuk mismatch bahkan pada finalized tag, set `REBUILDING`, tahan state-dependent API action prep, tandai hasil turunan affected stale, cari common ancestor, orphan-kan log setelahnya, bangun ulang projections dari baseline + log kanonik. Jangan meneruskan angka palsu sambil memberi label finalized.
6. Receipt overlay juga memeriksa receipt/block canonical setelah refresh; `REORGED` kembali pending/re-read, bukan menambah row chain di browser. Timestamp countdown berasal last chain snapshot + elapsed UX, keputusan tetap kontrak.

Pemetaan event ke hydration:

| Event | Touched data yang dibaca ulang pada batch block |
|---|---|
| AssetRegistered/AssetIntakeChanged/AssetSafetyStateChanged/AssetSnapshotAcknowledged/FinalityCoverageAdvanced | `getAsset` + `getAssetHead` + adapter snapshot -> asset DTO |
| AssetEventFinalized | asset/head + `getAssetEvent(assetId,sequence)` -> immutable asset_events; posisi lazy tidak dipaksa accrued |
| PositionCreated/PositionCheckpointed/PositionSettled/PrincipalReleased | `getPosition(positionId)` -> positions; asset token display conversion memakai current multiplier |
| ListingCreated/ListingCancelled/ListingFilled | `getListing(listingId)` + `getPosition(positionId)`; current listing state disinkronkan |
| RightsOwnerChanged | `getPosition(positionId)`; claims lama tidak dipindahkan |
| IncomeAllocated | `getPosition`; `claimShares(assetId,principalOwner)` dan nonzero rightsOwner; event menghasilkan audit `claim_allocations` saja |
| IncomeClaimed | `claimShares(assetId,beneficiary)` -> claim_balances |

Jika satu wallet adalah principalOwner dan rightsOwner, gabungkan kedua bagian pada unique attribution key sebelum audit insert dan tandai role BOTH; ledger getter sudah aggregate. Split/pertumbuhan payout tanpa market event tidak membutuhkan perubahan claim shares: token display amount dihitung dari snapshot multiplier terbaru pada read, jangan memakai nominal cache dari claim terakhir lalu melabelinya dengan blok yang lebih baru. Batch RPC harus mendukung historical block tag; kegagalan historical getter tidak diganti latest tanpa mengubah snapshot seluruh batch.

## 6. Auth, RLS, dan backend

Gunakan **Supabase Auth Web3 Ethereum** (`signInWithWeb3`) berbasis SIWE untuk akses private chat/intents; bukan server JWT buatan sendiri. Supabase saat diperiksa mendokumentasikan validasi signature, struktur pesan, waktu, serta domain/URI sebelum membuat session. Wallet connection hanya mengenalkan address; bukan login terverifikasi. [Sumber Supabase](https://supabase.com/docs/guides/auth/auth-web3).

- Membaca marketplace dan quote tidak membutuhkan login. Menandatangani transaksi melalui wallet tidak membutuhkan session Supabase; pengguna tetap dapat memanggil kontrak langsung. Penyimpanan chat/intent server memerlukan session; UI biasa dapat menyiapkan transaksi secara lokal dengan aturan identik.
- Server memverifikasi session melalui Auth server, lalu memetakan wallet dari identitas Web3 terverifikasi; jangan percaya `user_metadata.wallet`, request body, atau header `x-wallet`.
- Sign-in chain terikat pada SIWE message dan origin exact allowlist. Demo sign-in default Sepolia. Tidak menyamakan autentikasi dengan izin untuk chain lain/kontrak lain. Quote mainnet boleh tanpa mengganti sign-in chain karena read-only.
- Uji nonce replay, signature salah, waktu kadaluarsa, domain/URI tidak cocok, crossuser IDs, dan switch wallet. Claim EIP-1271 support hanya setelah runtime provider lulus tes; baseline demo EOA. Jangan mengaku seluruh smart wallet sudah kompatibel.
- Browser sign-out/wallet switch menghapus konteks private aktif dan membatalkan preview lama; A tidak boleh mengirim prepared action yang dibuat untuk B. Riwayat chat lama tetap berada di akun aslinya.
- RLS aktif pada setiap tabel exposed; `auth.uid() = user_id` untuk conversation, message, intent; message ownership juga harus cocok parent conversation. Role/tools content server-only. Mutable auth claims tidak menjadi financial authorization.
- Public read-model SELECT boleh publik; INSERT/UPDATE/DELETE hanya worker role. `service_role` server-only dan tidak masuk client bundle/prompt/log. Secrets updater tidak dibagikan ke route AI. Tabel app_private tidak memiliki grants untuk anon/authenticated.
- Same-origin mutating routes memverifikasi Origin dan session; CSRF protection sesuai strategi session-cookie yang dipakai. Cookie options dan refresh mengikuti official SSR integration, jangan mengubah SDK token storage sendiri tanpa tes.

RLS adalah pembatas database; kontrak tetap satu-satunya pemberi hak finansial. [Dokumentasi RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [SIWE EIP-4361](https://eips.ethereum.org/EIPS/eip-4361).

## 7. Batas worker internal

Satu proses worker boleh memiliki modul indexer dan updater, tetapi secret/izin dibedakan: indexer read-only chain + DB writer; updater signer hanya registry metadata role. Browser/AI tidak memiliki endpoint untuk mem-publish metadata, mengganti watermark, memint token demo, atau mengubah safety state. Simulator demo dijalankan operator melalui script yang terpisah saat development.

Tidak membangun API internal HTTP publik hanya untuk memisah tugas. Modul internal memakai command `{jobId, assetKey, eventId, sourceRevision, evidenceHash}`; payload lengkap di database diverifikasi ulang oleh updater. Worker lock per asset, idempotency key `(assetKey,eventId,sourceRevision)`, compare persisted nonce/hash sebelum retry. Timeout submit bukan izin mengirim transaksi kedua dengan nonce baru. Process restart memeriksa chain receipt/registry event sebelum melanjutkan. Koreksi final record ditahan, tidak diperbaiki lewat DB agar seolah chain sudah benar.

## 8. Validasi semantik wajib

JSON Schema memberi bentuk, required fields, enum, nullable, dan pola. Runtime validator tambahan MUST memeriksa:

1. Integer decimal berada dalam uint256/ABI bound; timestamp+duration tidak overflow; onchain IDs yang merujuk entity harus >0.
2. Key sesuai chain/contract/ID; chain token sama dengan object induk; native `address=null`, ERC20 nonzero address; allowlist entry cocok.
3. Null start/end/rightsOwner sesuai lifecycle; `endAt=startAt+durationSeconds` immutable setelah aktivasi; eventCursor >= activation cursor; tidak melewati asset eventCount pada snapshot sama.
4. Primary/secondary seller sesuai owner dari chain; `priceAtomic>0`; nonzero backing; `expiresAt` future saat create dan secondary tidak melewati endAt.
5. Token amount derived tepat menggunakan shares/multiplier adapter; external USD harga tidak menjadi payout.
6. Snapshot consistency antar DTO; source latest/finalized tidak dicampur tanpa label.
7. Quote AVAILABLE exact-input memiliki sell/buy positive amount; exact-output memiliki buy positive dan salah satu expected sell atau max sell positive. Ceiling-only quote tidak memakai max sell sebagai expected/ranking amount. Pair/chain sesuai manifest, timestamp ordered, tidak memiliki calldata/approval/swap URL executable; error row tidak punya ranking amount.
8. Prepared transaction signer, to, selector, args, spender approval, amount, native value, chain, expiry sesuai expected allowlisted action; tidak menerima calldata buatan model.

`examples/manifest.json` menunjuk valid dan invalid cases dengan lapisan rejection (`cases` untuk schema; `semanticCases` untuk relasi yang memerlukan validator runtime). Keberhasilan schema/fixture test **bukan** bukti accounting Solidity, RPC live, auth provider, atau wallet journey telah diuji.


### Pending event count pada intent tanpa posisi

`PreparedIntent.pendingEventCount` adalah backlog posisi untuk aksi yang menarget posisi/listing. Untuk CREATE_PRIMARY_LISTING dan CLAIM_INCOME, wire memakai `"0"` sebagai tidak ada checkpoint posisi yang diperlukan oleh aksi tersebut; UI tidak menafsirkannya sebagai tidak ada pendapatan/aset lain yang tertunda. Pembacaan backlog global berbeda dan tidak disimpulkan dari field ini.
