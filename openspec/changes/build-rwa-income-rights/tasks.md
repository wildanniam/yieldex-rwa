## 0. Cara memakai checklist

Checklist membedakan foundation yang sudah tersedia dan fitur produk yang belum dikerjakan. Dependency memakai ID task; assignee ditentukan saat meet. Tulis issue terkait untuk pekerjaan tim di wildanniam/eth-jkt. Tiap task selesai mempunyai evidence; keberadaan interface/fixture bukan bukti fitur ekonomi berjalan. Wildan mengotorisasi starter sebelum meet, sehingga task 1.2 dapat dikerjakan terpisah dari review bersama 1.1; review itu tetap gate sebelum coding paralel tim.

## 1. Foundation dan kontrak bersama

- [ ] 1.1 Review baseline spec/schema dengan tim; selesaikan konflik nyata tanpa membuka ulang keputusan diterima. Depends: none. Scope: docs/spec + schema. Acceptance: interface version dan semantics dibaca semua workstream; matriks requirement-to-task lengkap.
- [x] 1.2 Scaffold repo aplikasi/worker/contracts/shared sesuai desain starter yang disetujui. Depends: none. Acceptance: satu install/setup path terdokumentasi, lint/type/build commands berjalan tanpa secrets production. Evidence: docs/starter-verification.md.
- [x] 1.3 Pin base toolchain/dependencies serta generated shared types dan schema validation. Depends: 1.2. Scope: packages/shared + CI. Acceptance: consumers memakai satu source, contoh valid/invalid diperiksa, incompatible update gagal check. Provider/runtime dependencies dipin pada task integrasinya. Evidence: docs/starter-verification.md.
- [ ] 1.4 Implement environment/chain/asset registry config dan seed manifest terpisah. Depends: 1.3. Acceptance: Sepolia demo, Anvil/fork dan mainnet quote tidak tercampur; address checksum/chain mismatch ditolak.
- [x] 1.5 Siapkan minimum CI: specs/schema, format/lint/types/build, Foundry interface tests dan secret exclusions. Depends: 1.2. Acceptance: check dapat direproduksi pada checkout bersih; tanpa remote credential tidak dilaporkan passed live. Protocol tests ditambahkan saat implementasi tersedia. Evidence: docs/starter-verification.md.

## 2. Adapter, event registry dan mock aset

- [ ] 2.1 Implement tiga mock konfigurasi token shares/rebase/split dan DemoUSD non-rebasing. Depends: 1.4. Scope: packages/contracts. Acceptance: deterministic fixtures menguji shares, rounding, split/reverse dan pause; label simulasi eksplisit. Refs: asset-events, income-accounting.
- [ ] 2.2 Implement interface adapter xStocks EVM dan pinned-fork read/transfer proof. Depends: 1.4. Acceptance: actual shares deltas, transferShares, decimal/multiplier/history fingerprints diuji pada blok resmi; synthetic event dipisahkan dari snapshot nyata.
- [ ] 2.3 Implement registry baseline/role/event identity/sequence dan event verification. Depends: 2.1, 2.2. Acceptance: unauthorized/duplicate/out-of-order/unsupported/pending event ditolak atau dikarantina sesuai spec; versi revisi bukan income baru.
- [ ] 2.4 Implement trusted coverage watermark dan fingerprint/configuration guards. Depends: 2.3. Acceptance: no future coverage; monotonic records; release memerlukan cakupan boundary; stale fingerprint menahan ownership change lewat direct contract calls.
- [ ] 2.5 Implement worker issuer polling, idempotent report, stored evidence hash dan retry. Depends: 2.3, 2.4. Scope: apps/worker. Acceptance: duplicate retry tidak append event, chain receipt failure direkonsiliasi, private updater key tidak dikirim ke app/model/log.
- [ ] 2.6 Exercise late data/revision/pause/quarantine scenarios. Depends: 2.4, 2.5. Acceptance: raw API revision dideteksi; immutable consumed record tidak ditulis ulang; incident memperjelas operasi yang tetap aman dan tertahan.

## 3. Market dan accounting

- [ ] 3.1 Implement asset/position/backing ledger dan create primary listing. Depends: 2.3, 1.3. Scope: packages/contracts. Acceptance: actual received shares digunakan, supported assets only, bounds validated, same backing tidak dijanjikan dua kali. Refs: rights-market.
- [ ] 3.2 Implement primary cancel/relist tanpa transfer backing otomatis. Depends: 3.1, 2.4. Acceptance: cancel sebelum buy, expired listing tidak buyable, cancelledAt/currentListingId benar; release/cadangan diuji melalui 3.7.
- [ ] 3.4 Implement bounded event checkpoint dan principal-to-claim share allocation. Depends: 3.1, 2.3. Acceptance: formula/rounding fixtures matched; before-start/at-start/end boundary/event cursor diuji; permissionless caller tidak bisa memilih beneficiary. Refs: income-accounting.
- [ ] 3.3 Implement atomic primary purchase dan activation cursor/endAt. Depends: 3.1, 2.4, 3.4. Acceptance: fixed price dibayar seller; allowance/balance/transfer failure rollback; dua buyer hanya satu berhasil; approval terpisah tidak dianggap purchase.
- [ ] 3.5 Implement in-kind claim exact shares dan recipient ledger. Depends: 3.4. Acceptance: no double claim, failed transfer restores liabilities, claim growth tetap recipient, claim tidak memerlukan AI/indexer.
- [ ] 3.6 Implement whole-position resale listing/cancel/purchase. Depends: 3.3, 3.4. Acceptance: checkpoint prior owner, payment/owner atomic, expiry unchanged, no outside transfer/partial resale, stale listing and race fail safely.
- [ ] 3.7 Implement maturity/settlement/principal release. Depends: 3.2, 3.4, 3.5, 2.4. Acceptance: pre-end late event retained, post-end income seller, accrued claim reserve maintained, no bounded-delay claim under source ambiguity.
- [ ] 3.8 Add Foundry unit, differential, fuzz and invariant tests for lifecycle. Depends: 3.2–3.7. Acceptance: verification.md normal/boundary/concurrency/fault matrix has evidence, economic conservation checked independently, code revision recorded.
- [ ] 3.9 Export compiled ABI/events/errors and reconcile planned interface + shared types. Depends: 3.8, 1.3. Acceptance: every mismatch fixed in code or approved spec revision; no hand-written consumer ABI drift.

## 4. Read model, API dan identity

- [ ] 4.1 Implement Supabase migrations, unique keys, indexes and RLS from data-contracts. Depends: 1.3. Scope: supabase/migrations. Acceptance: private histories isolated across two users; public reads expose only approved fields; service key server-only. Refs: read-model.
- [ ] 4.2 Implement finalized-log indexer with block/hash checkpoints and replay recovery. Depends: 3.9, 4.1. Acceptance: duplicated logs dedupe, restarts recover, hash inconsistency stops/rebuilds safely, cache balances do not override chain.
- [ ] 4.3 Implement versioned market/assets/positions/claims read API and pagination. Depends: 4.2. Scope: apps/web. Acceptance: responses validate schema; filtering/sorting deterministic; source age and consistency flags visible.
- [ ] 4.4 Implement Supabase Web3 sessions, server identity checks and private history access. Depends: 4.1. Acceptance: wrong domain/expired/replayed auth, forged address, wallet switch and cross-user read fail correctly; legitimate sign-in works.
- [ ] 4.5 Implement deterministic marketplace transaction preview/intent API. Depends: 4.3, 4.4, 3.9. Acceptance: latest contract read+simulation, expected owner/price/terms and account/chain binding; stale intent revalidates; AI cannot set arbitrary calldata.
- [ ] 4.6 Verify read-your-writes/direct-chain overlay alongside finalized index. Depends: 4.3, 4.5. Acceptance: created/bought positions visible immediately with correct finality, stale cached offers cannot masquerade as available at confirmation.

## 5. UI dan wallet berdasarkan desain tim

- [ ] 5.1 Translate designer's screens into data/state/action map using shared DTOs. Depends: 1.3. Scope: apps/web. Acceptance: market, listing detail, portfolio/claim, seller flow, assistant and pending/error states covered; no styling decisions change economics.
- [ ] 5.2 Implement wallet connect/network/account state and receipt/replacement tracking. Depends: 3.9, 5.1. Acceptance: reject/sign/error/retry/refresh/account-switch handled without duplicate send; chain explorer links match environment. Refs: wallet-transactions.
- [ ] 5.3 Implement primary create/cancel/purchase flows with review screen. Depends: 4.5, 5.2. Acceptance: backing lock shown at listing, duration starts purchase, atomic receipt/state verified, review data matches signed call.
- [ ] 5.4 Implement resale flows and old/new claims views. Depends: 5.3, 3.6. Acceptance: whole position only, expiry fixed, old claims remain visible after resale and refresh.
- [ ] 5.5 Implement expiry/claim/release and source-status UX. Depends: 5.4, 3.7, 4.6. Acceptance: expired ≠ withdrawn, waiting reason explicit, accrued claims survive expiry, unsafe release disabled in UI and contract.
- [ ] 5.6 Test real UI with request/console and persisted state evidence. Depends: 5.3–5.5. Acceptance: normal/race/two-tabs/reload/cancel/failure matrix recorded with source commit and isolated accounts.

## 6. AI dan quote recommendations

- [ ] 6.1 Pin CopilotKit v2/OpenAI runtime and demonstrate one server tool → validated card. Depends: 1.3. Scope: apps/web. Acceptance: one orchestration loop, server keys private, loading/failure/completion states work; version compatibility tested. Refs: ai-assistant.
- [ ] 6.2 Implement listing search, position context and explanation tools over canonical APIs. Depends: 4.3, 6.1. Acceptance: no invented listings/dividends/guaranteed return; prompt injection payload cannot expand authority.
- [ ] 6.3 Implement read-only quote provider adapter for curated chains/tokens and exact-in/out. Depends: 1.4, 1.3. Acceptance: official live amount quote or explicit blocked/unavailable; captured provider schema maps fixtures; zero wallet signing/approval/send path. Refs: quote-recommendations.
- [ ] 6.4 Implement fee/freshness/route normalization and comparable ranking. Depends: 6.3. Acceptance: missing fees not zero, embedded fees not double counted, exactout expected vs max separated, stale/no-route fail clear.
- [ ] 6.5 Implement origin-chain recommendation and labelled hypothetical chain comparison. Depends: 6.4. Acceptance: no unpriced bridge presented as free, input/output identity correct; no cross-chain best claim without comparable cost.
- [ ] 6.6 Implement discovery, comparison, quote and purchase-preview cards using designer visuals. Depends: 6.2, 6.5, 5.1. Acceptance: required fields/status/assumptions remain visible, card numbers come from tool results.
- [ ] 6.7 Connect purchase preparation to explicit wallet review, not auto-execution. Depends: 4.5, 5.2, 6.6. Acceptance: duplicate tool/replay/refresh does not send; user approval and wallet signature independent; quote cards never trigger swap.
- [ ] 6.8 Evaluate AI with positive/negative prompts and provider faults. Depends: 6.7. Acceptance: missing constraints clarified, old/cross-chain/large amount requests correctly scoped, injection/no API/stale results handled, manual market flow survives AI outage.

## 7. Integration, demo dan handoff

- [ ] 7.1 Run Anvil full lifecycle with at least Alice/Bob/Carol across supported demo assets. Depends: 3.8, 5.6, 6.8. Acceptance: first/second dividend, resale, split, expiry, old claims and release with state/balance proof. Refs: integration-quality.
- [ ] 7.2 Run official-token fork adapter suite on pinned blocks. Depends: 2.2, 3.8. Acceptance: real source/state assertions separate synthetic event injection; blocked RPC explicitly reported.
- [ ] 7.3 Configure isolated Sepolia deployment and reproducible seed script/manifest. Depends: 7.1. Acceptance: source commit, chain/address, token labels, roles, verified explorer and reproducible setup; no real-money/private raw secrets.
- [ ] 7.4 Test full browser journey on Sepolia and live read-only mainnet quote panel. Depends: 7.3, 6.8. Acceptance: evidence distinguishes testnet economic state from real quotes; all demo accounts/wallet flows correct.
- [ ] 7.5 Review failure/recovery and security matrix plus final interface parity. Depends: 7.2, 7.4. Acceptance: failed cases fixed or material limitations explicitly recorded; no unresolved critical loss/authorization defect labelled ready.
- [ ] 7.6 Produce team/demo runbook and requirement coverage report on tested revision. Depends: 7.5. Acceptance: others can reproduce; source attribution and hackathon-period provenance recorded; no fabricated adoption/integration claim.
- [ ] 7.7 Archive baseline only after accepted implementation and verification. Depends: 7.6. Acceptance: completed change truthfully updates main specs; unfinished tasks stay active rather than marked done for submission.
