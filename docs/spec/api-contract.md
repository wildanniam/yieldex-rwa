# API, transaksi wallet, dan kontrak integrasi — v1

Status: target implementasi; endpoint belum berjalan. Semua nama DTO merujuk [`schemas/api.schema.json`](../../schemas/api.schema.json), [`schemas/domain.schema.json`](../../schemas/domain.schema.json), dan [`schemas/quote.schema.json`](../../schemas/quote.schema.json). [Data conventions](data-contracts.md) dan [contract-interface](contract-interface.md) wajib dibaca bersama. Tidak ada REST endpoint yang dapat mengubah kepemilikan/klaim onchain dengan menulis database.

## 1. Aturan HTTP bersama

- Base path `/api/v1`; JSON UTF-8. `schemaVersion: "1.0"` berada pada `meta` success atau root error. Unknown body fields ditolak, bukan diabaikan. Seluruh keys camelCase; SQL snake_case tidak bocor sebagai API.
- `chainId` path/query adalah decimal integer aman; local ID adalah uint decimal string. Address dinormalisasi setelah validasi. Tanpa chain/contract yang diizinkan -> `UNSUPPORTED_DEPLOYMENT`; jangan memanggil RPC URL dari input user.
- Response object: `{meta:{schemaVersion,requestId,observedAt},data:DTO}`. Response list: `{meta,items:DTO[],pagination:{nextCursor,hasMore},snapshot}`. `nextCursor=null` iff `hasMore=false`.
- Error: `{schemaVersion,requestId,error:{code,message,retryable,retryAfterSeconds,details:[{field,code}]}}`. `message` aman ditampilkan; tidak mengandung private stack, key, SQL, JWT, atau raw provider request. UI logic memakai `code`, bukan pencocokan bahasa message.
- Public GET dapat di-cache maksimal 10 detik untuk indeks finalized; user/private response dan seluruh intent `Cache-Control: no-store`. API quote POST read-only maksimal 10 detik cache internal, tidak diklaim executable.
- Batas umum: request JSON 64 KiB; maximum search limit 20, asset/event/account list 100; normalized query dibatasi sesuai tabel. Rate limit awal public read 60/min/IP, quote 10/min/IP, private prepare 20/min/user; configurable deployment budget. `429` + `Retry-After` bukan quote fiktif atau silent fallback.
- Semua write data privat yang persisten membutuhkan same-origin check + verified session; guest chat hanya transient read-only sesuai bagian 5. CORS tidak menerima arbitrary origin. API provider keys server-only.

## 2. Endpoint read model

`{chainId}` marketplace awal hanya `11155111`; `{marketAddress}` dan `{registryAddress}` harus cocok deployment manifest. Path memakai ID, query tidak boleh override chain/provider dari path.

| Method dan path | Query / request | Success |
|---|---|---|
| `GET /deployments` | Tidak ada | `DeploymentManifestResponse`; alamat belum deploy tidak dipalsukan. |
| `GET /chains/{chainId}/registries/{registryAddress}/assets` | `limit=100`, `cursor?`, `enabledOnly=false` | `AssetsPage` |
| `GET /chains/{chainId}/registries/{registryAddress}/assets/{assetId}` | Tidak ada | `AssetResponse` |
| `GET /chains/{chainId}/registries/{registryAddress}/assets/{assetId}/events` | `limit=100`, `cursor?` | `AssetEventsPage`, final protocol events only |
| `GET /chains/{chainId}/markets/{marketAddress}/listings` | Search query di bawah | `ListingsPage`, masing-masing `ListingDetail` |
| `GET /chains/{chainId}/markets/{marketAddress}/listings/{listingId}` | Tidak ada | `ListingResponse` |
| `GET /chains/{chainId}/markets/{marketAddress}/positions/{positionId}` | Tidak ada | `PositionResponse` |
| `GET /chains/{chainId}/markets/{marketAddress}/accounts/{account}/positions` | `role=ANY\|PRINCIPAL\|RIGHTS`, `limit=20`, `cursor?` | `PositionsPage`; wallet address publik, bukan login proof |
| `GET /chains/{chainId}/markets/{marketAddress}/accounts/{account}/claims` | `limit=100`, `cursor?` | `ClaimsPage` |
| `GET /chains/{chainId}/transactions/{transactionHash}` | Tidak ada | `TransactionStatusResponse` dari RPC; hanya chain allowlist |

### SearchListing query

Wire query menerima `assetId` berulang (`?assetId=0x...&assetId=0x...`), `market`, `maxPriceAtomic`, `maxRemainingDurationSeconds`, `incomeBpsMin`, `sort`, `limit`, `cursor`. Request tanpa filter dinormalisasi menjadi schema `SearchListingsQuery`:

```json
{
  "assetIds": [],
  "market": "ANY",
  "maxPriceAtomic": null,
  "maxRemainingDurationSeconds": null,
  "incomeBpsMin": null,
  "sort": "NEWEST",
  "limit": 20,
  "cursor": null
}
```

`maxPriceAtomic` selalu dalam payment token manifest (`DemoUSD`, 6 decimals); tidak menerima string `$100` atau symbol arbitrer. Harga berbeda token tidak diurutkan seolah nominal setara. `maxRemainingDurationSeconds` berarti primary `durationSeconds`, secondary `max(0,endAt-snapshot.blockTimestamp)`. `incomeBpsMin` range `1..10000`. `assetIds` maksimal 10 unique assetId dari manifest.

Browse default hanya listing `displayStatus=OPEN` pada snapshot. Detail tetap tersedia untuk listing terminal. Sort deterministic: `NEWEST` memakai `(createdBlockNumber DESC,listingId DESC)`; `PRICE_ASC` memakai `(priceAtomic ASC,listingId ASC)`; `DURATION_ASC` memakai `(comparisonDurationSeconds ASC,listingId ASC)`. ID dibanding numerik, bukan string. `comparisonDurationSeconds` dievaluasi pada snapshot yang tetap sepanjang halaman.

Cursor base64url mengemas payload versi, normalized query hash, snapshot block/hash, sort key, last ID, expiry. Server menandatangani HMAC atau memakai opaque server ID agar input tidak menjadi query injection. Cursor TTL 300 detik; snapshot konsisten selama paging. Filter/sort/chain berubah -> cursor lama ditolak. Blok diorphan-kan -> `CURSOR_INVALIDATED`; cursor kedaluwarsa -> `CURSOR_EXPIRED`; UI mulai ulang, tidak diam-diam append halaman dari snapshot berbeda. Offset pagination tidak dipakai.

## 3. Quote read-only

`POST /quotes/compare` menerima **`QuoteRequest`** dan mengembalikan **`QuoteComparisonResponse`**. Tidak membutuhkan wallet connection, saldo nominal simulasi, login, allowance, atau tanda tangan. Token/chain mapping berasal manifest quote; deploy Sepolia tidak menjadi input 0x mainnet secara otomatis.

| Field | Arti |
|---|---|
| `mode` | `EXACT_INPUT`: jumlah yang dijual diketahui; `EXACT_OUTPUT`: jumlah yang ingin dibeli diketahui. |
| `amountAtomic` | Unit sell token untuk EXACT_INPUT; unit buy token untuk EXACT_OUTPUT. ETH 18 decimals, USDC 6 decimals pada manifest awal. |
| `sellAssetId`, `buyAssetId` | `ETH` atau `USDC`, harus berbeda; tidak sama dengan assetId bytes32 token backing. |
| `originChainId` | Lokasi dana awal yang disebut pengguna; tidak membuktikan kepemilikan saldo. Nullable hanya untuk perbandingan hipotetis tanpa asal. |
| `chainIds` | Subset unique dari `[1,42161,8453]` yang adapter/provider benar-benar mendukung. |
| `comparisonScope` | `ORIGIN_CHAIN`: chainIds hanya origin. `HYPOTHETICAL_CHAINS`: minimal dua chain; estimasi lokal per-chain dengan asumsi aset sudah di sana. |
| `slippageBps` | Input batas estimasi provider, default 50, rentang aplikasi 0..500; tidak menjamin besaran kerugian aktual. Tidak dikirim ke transaksi karena eksekusi tidak disediakan. |

Tidak ada `/swap`, `/bridge`, `/approve-quote`, atau callback backend penandatangan swap. Provider response `transaction`, calldata, allowance target/spender, issue allowance/balance, dan payload execution di-strip sebelum masuk DTO/AI. Wallet tidak diperlukan untuk membaca angka hipotetis. Kalau endpoint provider hanya memberi max input pada exact-output, simpan `sellAmountAtomic:null` dan `maxSellAmountAtomic` sebagai ceiling; jangan menyebut ceiling sebagai expected price. Lengkapnya mengikuti [AI dan quote spec](ai-and-quotes.md).

Provider errors per-chain tetap menjadi rows status; HTTP 200 valid comparison boleh berisi sebagian/tidak ada route. Invalid input -> 400. Seluruh provider unavailable -> response comparison dengan `NO_AVAILABLE_QUOTES` + row reasons, bukan angka fallback. Infra server rusak sebelum request diproses ->503.

`RANKED` memerlukan minimal dua candidate rankable dan seluruh requested candidates rankable; `PARTIAL` memerlukan minimal dua rankable tetapi ada excluded row; `UNRANKED` berarti AVAILABLE ada tetapi kurang dari dua comparable/rankable candidates; `NO_AVAILABLE_QUOTES` berarti tidak ada AVAILABLE row. `recommendedQuoteId` hanya boleh nonnull untuk RANKED/PARTIAL. Satu hasil aggregator tetap ditampilkan sebagai estimasi rute, tanpa badge terbaik hasil perbandingan yang tidak dilakukan. `observedAt` comparison adalah waktu assembly; `expiresAt` minimum expiry AVAILABLE rows, atau observedAt bila seluruh row unavailable.

## 4. Menyiapkan transaksi marketplace

`POST /transaction-intents` menerima `PrepareIntentRequest`, header `Idempotency-Key: UUID`, session Web3 valid, dan context wallet terverifikasi. Mengembalikan `PreparedIntentResponse`, status 201 baru atau 200 replay. Request body sengaja **tidak** memiliki `walletAddress`, penerima, `to`, calldata, ABI, atau gas override dari AI. Signer/chain berasal session/context yang diverifikasi; mainnet quote tidak pernah mengubah marketplace deployment.

| `action` | Input tambahan | Fungsi Solidity |
|---|---|---|
| `CREATE_PRIMARY_LISTING` | `assetKey,depositTokenAmountAtomic,minReceivedShares,incomeBps,durationSeconds,priceAtomic,listingExpiresAt` | `createPrimaryListing(params)` |
| `BUY_LISTING` | `listingKey` | `buyListing(params)` |
| `CANCEL_LISTING` | `listingKey` | `cancelListing(listingId)` |
| `RELIST_PRIMARY_POSITION` | `positionKey,priceAtomic,listingExpiresAt` | `relistPrimaryPosition(...)` |
| `CREATE_SECONDARY_LISTING` | `positionKey,priceAtomic,listingExpiresAt` | `createSecondaryListing(...)` |
| `CHECKPOINT_POSITION` | `positionKey,maxEvents` | `checkpointPosition(...)` |
| `SETTLE_POSITION` | `positionKey,maxEvents` | `settlePosition(...)` |
| `RELEASE_PRINCIPAL` | `positionKey,maxEvents` | `releasePrincipal(...)` |
| `CLAIM_INCOME` | `assetKey,shares` | `claimIncome(assetId,shares)` |

User wallet tetap menjadi pengirim semua tindakan; preparation tidak mengirim transaksi. Keeper checkpoint boleh memakai jalur langsung kontrak/script terpisah. AI `preparePurchase` hanya mengakses action BUY_LISTING; tindakan lain melalui UI normal sampai perluasan tool disetujui dalam spec change.

### Read, validate, simulate, preview

1. Server membaca kontrak **latest** pada satu pinned block; indeks finalized hanya menemukan ID. Verifikasi account/chain, posisi/listing, immutable terms, deadline, balances/allowance, head asset/fingerprint, serta kontrak deployment.
2. Untuk buy, baca `Listing.termsHash` menjadi `expectedTermsHash`, `assetHeadHash`, harga `maxPriceAtomic=priceAtomic`, dan `maxEvents=32`. `deadline=min(chainTimestamp+120,listing.expiresAt-1,position.endAt-1 untuk secondary)`; bila tidak tersisa waktu aman, BLOCKED. Server wall clock tidak menggantikan chain time.
3. Jika allowance kurang untuk underlying deposit/payment buy, berikan **hanya** step APPROVAL ke token allowlist, spender market, exact nominal. Bukan unlimited approval; bukan approval router quote. State NEEDS_APPROVAL, simulation APPROVAL_REQUIRED. Setelah receipt approval, buat intent baru dan ulangi read/validate/simulate sebelum ACTION. Tidak menyatakan buy telah disimulasikan sukses jika terhalang allowance.
4. Bila allowance cukup, encode fungsi menggunakan ABI shared, simulate dari actual signer, lalu preview satu ACTION step. `valueAtomic:"0"` untuk market ERC20 actions. Tidak ada arbitrary target dari prompt/API input.
5. Simulasi gagal -> BLOCKED, steps kosong, reason typed. Gas estimate bukan guarantee transaksi; state dapat berubah sebelum inclusion. [viem simulateContract](https://raw.githubusercontent.com/wevm/viem/main/site/pages/docs/contract/simulateContract.md).

TTL intent 120 detik maksimum, dipersempit listing/rights deadline. `expiresAt=deadline`; reprepare dengan key baru menghasilkan intent baru, tidak memperpanjang intent lama. Non-buy actions yang ABI tidak memuat deadline tetap ditolak oleh aplikasi bila preview kedaluwarsa; kontrak tetap memvalidasi live authorization/accounting.

Preview MUST menunjukkan chain, account, action, aset backing dan bagian hak, harga/upfront recipient atau jumlah shares claim, periode/remaining, deadline, payout token, gas estimate jika tersedia, token allowance bila relevan, dan sumber snapshot. `PreparedIntent.purchaseSummary` adalah `ListingDetail` pada snapshot latest yang sama, wajib bagi BUY_LISTING READY/NEEDS_APPROVAL/SUBMITTED; jangan membangun ringkasan pembelian dari search card lama. Untuk BLOCKED karena listing tidak ditemukan, summary/hash/harga boleh null; jangan mengarang nol atau owner. `pendingEventCount` menyatakan backlog final events yang belum di-checkpoint, termasuk pada relist/resale preview. Untuk CREATE_PRIMARY_LISTING dan CLAIM_INCOME yang tidak memakai cursor posisi, nilainya 0 berarti aksi ini tidak memerlukan checkpoint posisi, bukan klaim bahwa akun/aset tidak punya event tertunda; UI tidak menampilkan label backlog posisi untuk kedua aksi itu. Konfirmasi chat hanya persetujuan menampilkan/melanjutkan preview, bukan tanda tangan. CopilotKit render ulang/hydration/tool replay tidak boleh memanggil wallet otomatis.

### Idempotency dan state

Key scope `(authenticated userId, Idempotency-Key)` + canonical normalized request hash + verified wallet + deployment version. Key sama/request sama -> stored preview dan intentId yang sama, tanpa mengulang chain mutation (memang tidak ada). Key sama/request berbeda ->409 `IDEMPOTENCY_CONFLICT`. Key sama yang sudah expired -> status turunan EXPIRED dan steps kosong; terms/identitas preview tersimpan tidak berubah dan tidak menghasilkan calldata baru. Simpan key minimum 24 jam; intent tidak mengunci listing atau memesan backing.

Intent bersifat metadata UX. `SUBMITTED` hanya berarti hash berhasil diverifikasi dengan tx dari wallet terkait; tidak membuktikan pembelian. Tidak ada status DB yang dapat memberi hak finansial.

### Pengiriman dan receipt

1. Pengguna menekan tombol eksplisit pada kartu/halaman; wallet account dan chain dibaca ulang. Jika berubah, invalidate preview. UI mensimulasikan lagi/action reprepare jika head/terms/expiry berubah. Wallet meminta konfirmasi.
2. `writeContract`/sendTransaction dikirim browser wallet, bukan server AI. Rejection -> pesan USER_REJECTED, tidak auto retry. Dua klik sementara wallet pending dinonaktifkan; refresh tidak mengirim ulang.
3. Browser melaporkan `POST /transaction-intents/{intentId}/submissions` dengan `SubmissionRequest` (chainId,transactionHash,stepId), header idempotency baru. Server verifikasi tx via RPC: from, to, value, data/selector/args dan chain cocok step. Jika belum ditemukan, return202 pending verification; body tidak membuatnya success. Crossuser/step injection ditolak.
4. `GET /transaction-intents/{intentId}` private mengembalikan preview asli + tracked transaction melalui read endpoint; intent milik orang lain ->404. UI juga bisa mengikuti RPC saat server down.
5. Transaction status SUBMITTED/PENDING -> receipt success `CONFIRMED`, receipt revert `REVERTED`. Explorer link berasal chain manifest + tx hash, bukan URL bebas provider. Hanya blok yang masuk finalized head serta cocok hash diberi `FINALIZED`.
6. Same-nonce repricing/replacement ditangani. Replacement calldata sama yang repriced dilacak sebagai transaksi baru; cancel/berbeda action tidak dianggap buy sukses. Receipt reorg mengembalikan status REORGED/PENDING; UI menghapus kesimpulan sukses yang belum final. Timeout ->UNKNOWN/PENDING, tidak otomatis retry transaksi baru. [viem receipt replacement](https://raw.githubusercontent.com/wevm/viem/main/site/pages/docs/actions/public/waitForTransactionReceipt.md).
7. Sesudah confirmed, direct read kontrak pada blok receipt memberi hasil posisi/listing segera dan diberi label confirmed. Refetch finalized index sampai menyusul; jangan membuat DB listing/payout dari asumsi UI.

Receipt/state langsung tetap bisa dipakai oleh pengguna tanpa Supabase login, misalnya melalui wallet UI lokal. Ketersediaan private intent tracking bukan prasyarat kebenaran kontrak.

## 5. Auth, chat, dan tool transport

Session menggunakan Supabase native Web3/SIWE. Tidak membuat endpoint custom `/siwe/verify` yang mengimplementasikan kriptografi baru. Aktifkan origin/redirect allowlist eksplisit; server mengambil user/identity yang diverifikasi, bukan membaca JWT tidak terverifikasi atau mempercayai address body. [Supabase Web3](https://supabase.com/docs/guides/auth/auth-web3).

`GET /session` private menghasilkan `SessionResponse`; unauthenticated->401. Penyimpanan chat privat melalui endpoint berikut dan RLS sesuai [data-contracts](data-contracts.md):

| Endpoint | Request | Response / aturan |
|---|---|---|
| `POST /conversations` | `CreateConversationRequest`, Idempotency-Key | 201 `ConversationResponse`; owner dari session, bukan body. |
| `GET /conversations` | `limit` 1..20 default20, `cursor?` | `ConversationsPage`, updatedAt DESC + UUID stable tiebreak; private no-store. |
| `GET /conversations/{conversationId}/messages` | `limit` 1..100 default50, `cursor?` | `MessagesPage`, createdAt ASC + UUID; hanya owner. |
| `DELETE /conversations/{conversationId}` | Session + same-origin | 204, hapus pesan/private references; tidak menghapus bukti transaksi publik. |

Pengiriman message memakai CopilotKit transport `/api/copilotkit`; tidak ada POST message paralel yang bisa menggandakan assistant run. Transport tidak dipaksa ke envelope REST karena protocol streaming sendiri. Pada session authenticated, request membawa conversationId dan UUID clientMessageId pada context tervalidasi; server memberi messageId, memverifikasi role input hanya user, dedupe `(conversationId,clientMessageId)`, dan menyimpan tool results hanya dari runtime server. Cursor private memakai opaque/HMAC rules yang sama, tanpa chain snapshot. Connection putus tidak membuat run baru otomatis dengan clientMessageId baru.

Guest boleh chat read-only sementara: server menerbitkan transient opaque run ID dengan quota, hanya lima business read tools, tanpa preparePurchase dan tanpa akses database private conversations. Framework presentation-state helpers bukan business authority dan tidak boleh mengubah wallet/terms/calldata. Client guest tidak boleh memasukkan conversationId arbitrary untuk membuka saved history. Guest transcript berada sementara pada sesi tersebut; login tidak otomatis menyalin transcript ke akun tanpa aksi aplikasi yang jelas. Model/quote outage tidak menghilangkan form normal marketplace dan quote.

Input/result domain tool harus lolos schema yang sama; server membatasi tools yang boleh berjalan. Conversation ID dari client wajib milik session, user messages tidak boleh menyisipkan role system/tool. `AssistantCard` memiliki discriminant `kind`, stable `cardId`, `toolCallId`, dan payload terstruktur. Card kind PURCHASE_PREVIEW hanya boleh memuat BUY_LISTING intent; jangan menerima generic action dari model. `AssetContextResponse` menambahkan penjelasan/risk/source terkurasi pada Asset, tidak mengubah data angka kontrak. Source URL HTTPS allowlist; bukan URL bebas yang di-fetch dari prompt.

Transport/SDK detail chat adalah keputusan implementation dengan persyaratan ini; jangan membuat dua agent loops terpisah hanya karena API mempunyai tools. Versi runtime dan provider diuji pada spike; tidak mengklaim OpenAI Responses API wire-compatible dengan semua runtime tanpa tes.

## 6. Error codes minimum

| HTTP / code | Makna dan UX |
|---|---|
| 400 `VALIDATION_ERROR` | Invalid schema, unit, limit, malformed address/key. Tampilkan field, jangan retry tanpa perubahan. |
| 400 `UNSUPPORTED_DEPLOYMENT` / `UNSUPPORTED_PAIR` | Chain/contract/token tidak ada di allowlist. |
| 401 `AUTH_REQUIRED` / `SESSION_EXPIRED` | Login ulang untuk data privat, bukan menghapus transaksi wallet. |
| 403 `WALLET_MISMATCH` | Wallet aktif berbeda dari identity/intent; invalidate preview. |
| 404 `NOT_FOUND` | Object tidak ada atau private object bukan milik user; tidak membocorkan keberadaan chat orang lain. |
| 409 `LISTING_UNAVAILABLE` / `TERMS_CHANGED` | Listing filled/cancelled/expired/relist, tampilkan state terbaru; tidak otomatis membeli pengganti. |
| 409 `ASSET_HEAD_CHANGED` / `DATA_STALE` | Metadata/fingerprint berubah; baca ulang dan tunggu pemeriksaan, bukan override guard. |
| 409 `ACCOUNTING_QUARANTINED` / `TRANSFER_QUARANTINED` | Aksi ditahan sesuai safety. Klaim final boleh jika hanya accounting hold dan transfer aman. |
| 409 `ACCOUNTING_BACKLOG` | Dibutuhkan checkpoint batch; tampilkan bantuan transaksi checkpoint, tidak loop tak terbatas. |
| 409 `FINALITY_PENDING` | Pokok belum boleh dilepas; event coverage belum cukup. |
| 409 `IDEMPOTENCY_CONFLICT` / `CURSOR_INVALIDATED` | Reused key incompatible atau snapshot reorg; reset secara eksplisit. |
| 410 `PREVIEW_EXPIRED` / `CURSOR_EXPIRED` | Refresh preview/list; tidak mengubah terms secara diam-diam. |
| 422 `INSUFFICIENT_BALANCE` / `SIMULATION_REVERTED` | Persyaratan onchain gagal. Reason data aman dari custom error mapping. |
| 429 `RATE_LIMITED` | Hormati Retry-After, jangan mengganti data dengan tebakan. |
| 503 `RPC_UNAVAILABLE` / `INDEXER_UNAVAILABLE` / `REBUILDING` | Tidak tersedia atau state tidak dapat dipercaya. Read-only quote independen dari hold accounting. |

Revert custom Solidity diterjemahkan melalui tabel adapter; nama ABI tetap di [contract-interface](contract-interface.md). `USER_REJECTED` adalah status client, bukan HTTP server failure. Runtime provider errors berbeda dari produk tidak memiliki likuiditas.

## 7. Kriteria integrasi sebelum parallel implementation dianggap cocok

- Producer dan consumer menjalankan fixture schema yang sama termasuk uint256 overflow, float, leading zero, null native address, forbidden quote calldata, dan crosschain ID mismatch.
- Market/position preview telah diverifikasi langsung pada latest; index finalized boleh tertinggal tetapi tidak menghasilkan buy sukses palsu.
- Wallet rejection, approval-only, changed listing after approval, duplicate click, concurrent buyer, refresh pending, replacement/cancel, revert dan reorg diuji melalui user journey.
- Nonce/login replay/domain expiry, private conversations crossuser, client write ke read model, forged transaction submissions, serta leaked service role diuji/ditolak.
- Public quote tidak memanggil wallet/approval/swap/bridge meskipun provider mengirim transaction payload.
- Ini kontrak integrasi tertulis; kelulusan schema offline tidak menggantikan tes implementasi tersebut.
