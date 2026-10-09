# Verifikasi, Acceptance dan Batas Bukti

## Pemeriksaan paket spec saat ini

Paket dokumen diperiksa dengan OpenSpec strict validator, JSON Schema Draft 2020-12, fixtures positif/negatif, tautan lokal, uniqueness requirement IDs, keberadaan skenario, completeness artifacts dan review lintas dokumen. Ini membuktikan konsistensi tertentu dalam dokumentasi, bukan ekonomi atau runtime. Hasil foundation dan validasi dokumen dicatat di [starter verification](../starter-verification.md); hasil fitur berikutnya ditautkan dari task terkait.

`python3 scripts/check_specs.py` memerlukan jsonschema. Validator dilarang mengunduh $ref dari jaringan; seluruh schema harus terdefinisi lokal. Kasus yang memerlukan state ownership/arithmetic/auth/history harus tetap menjadi semantic tests di implementation, walaupun bentuk JSON valid.

## Risk matrix implementation

Status pengujian bertahap dan batas bukti terdapat di [core verification](../core-verification.md); matriks berikut adalah acceptance, bukan klaim semua skenario sudah lulus.

| Case | Jenis | Outcome wajib | Evidence/task |
| --- | --- | --- | --- |
| V-01 Primary ordinary | Normal | backing locked at list, buyer activated at buy, price paid once | receipt/state/balance; 3.1,3.3,5.3 |
| V-02 Unsupported/bad parameters | Boundary | zero/overlimit amount,bps,duration/token rejected | direct contract test; 3.1 |
| V-03 Listing cancellation/expiry | Normal/recovery | no buyer after deadline/cancel, reclaim after safe coverage, no terms edit | 3.2 |
| V-04 Two buyers/seller cancel race | Concurrency | one final outcome, losing attempt no net payment/right | 3.3,5.6 |
| V-05 Allowance/balance/transfer failures | Failure | transaction atomic; no orphan right or lost backing | 3.3,3.6 |
| V-06 First dividend | Normal | correct buyer/seller shares conservation | independent arithmetic + 3.4 |
| V-07 Split/reverse/donation | Adjacent | no fictitious dividend; economic units normalized; unassigned donations | 2.1,3.4 |
| V-08 Small amounts/large multipliers | Boundary | exact rounding limits and no overflow/negative liability | fuzz/differential 3.8 |
| V-09 Resale before/after same-second event | Boundary | previous claims stay correct by cursor/time ordering; end unchanged | 3.6,3.8 |
| V-10 Pre-start/at-end events | Boundary | [start,end) plus cursor, pre-start seller, at-end outside buyer | 3.4,3.7 |
| V-11 Late event past expiry | Failure/recovery | safe waiting, eventual correct entitlement, no early principal drain | 2.4,3.7 |
| V-12 Undetected event before resale | Failure | fingerprint mismatch prevents transfer even direct calls | 2.4,3.6 |
| V-13 Duplicate/revised/pending source | Failure | idempotent sequence; pending not income; correction incident no rewrite | 2.3,2.6 |
| V-14 Worker/key unauthorized | Authorization | only bounded finalizer report; caller cannot set arbitrary balances/payees | 2.3,2.5 |
| V-15 Coverage watermark | Boundary | no future/regression; cancellation/end boundary complete before release | 2.4,3.2,3.7 |
| V-16 Accrued old claims growth | Normal | old claims/growth owned recipient through resale/expiry | 3.5,3.8 |
| V-17 Claim retry/double/reentrancy | Security | liabilities/assets conserved; revert restores claims; no double payout | 3.5,3.8 |
| V-18 Multi-asset isolation | Adjacent | one asset failure/config cannot drain or mix another's shares | 3.8 |
| V-19 Issuer pause/upgrade/fee change | External failure | quarantine affected paths; no false principal guarantee | 2.6,7.2 |
| V-20 Index replay/finalized hash conflict | Recovery | dedupe and rebuild/stop policy, no forged chain truth | 4.2 |
| V-21 UI pending/reload/replacement | UI/recovery | receipt tracking survives refresh; no automatic duplicate signing | 5.2,5.6 |
| V-22 Wallet/network switch | UI/auth | old previews invalid; new account not old private history | 4.4,5.2 |
| V-23 Private session/RLS | Security | signed identity/replay/domain checks; two users isolated | 4.1,4.4 |
| V-24 Quote exact-input/output | Normal | correct base units and buy-vs-sell semantics; no approval/signature | 6.3 |
| V-25 Quote amount/depth fees | Boundary | size-aware quote; embedded fees once; missing gas not zero | 6.4 |
| V-26 Cross-chain hypothetical | Product | chain origin/target visible; bridge exclusion prevents false end-to-end ranking | 6.5 |
| V-27 No route/timeout/stale/provider errors | Recovery | unavailable state with source time; never invented quote | 6.4,6.8 |
| V-28 AI factual/injection/replay | Security | no invented yield/listing/payee; tools bounded; replay can't send | 6.2,6.7,6.8 |
| V-29 Manual flow during AI outage | Adjacent | marketplace remains usable; no dependence accounting→LLM | 6.8 |
| V-30 Whole demo/browser/source proof | Integration | real receipt and refreshed balances, mock/fork/live labels, source commit | 7.1–7.6 |

For every tested case, record passed/failed/blocked/not-tested, source revision, chain/block, account labels (no private keys), action, expected vs actual state, tx/log evidence and limits. Keep test accounts isolated. Screenshots alone do not prove balances or persistence. Compare normal before/after behavior when fixing regressions; fault injection is labelled and does not replace ordinary UI tests.

## Financial invariants

- Sum principal/backing shares plus allocated claim shares cannot exceed vault shares of that asset; unassigned donations do not become income.
- Checkpoint changes allocation, not physical total shares. Claim removes exactly the transferred liability. Failed transfer reverts the entire accounting update.
- One position has one owner and at most one active resale offer. Marketplace-only whole transfer does not reset expiry or carry old claims.
- Payment/right activation or transfer is atomic. Approve alone does not grant buyer rights. Double submission/racing callers cannot both purchase a single offer.
- No released principal consumes outstanding recipient claims. Coverage/fingerprint guards apply even without UI or worker cooperation.
- Rebase growth on claim shares accrues to their owner; split/fee/action classification follows supported adapter, not balance delta alone.

## Phased gates

| Gate | Ready when | Does not establish |
| --- | --- | --- |
| Spec gate | Syntax, schemas/examples, links and cross-review pass | Running product or audited financial correctness |
| Foundation gate | Generated shared interfaces + build/toolchain + minimum schema CI | Provider integration |
| Accounting gate | Solidity unit/fuzz/invariant/differential/boundary cases pass | Issuer metadata finality guarantee |
| Adapter gate | Pinned official-token fork tests pass | Mainnet deployment or issuer onboarding |
| AI/quote gate | Live source + UI runtime with limits/failure tests | Best price globally or future execution guarantee |
| Demo gate | Full testnet user journey + failure evidence + role/config review | Production readiness or real stock backing |

No fixed pass percentage substitutes for a material correctness defect. An unresolved event/liability defect blocks financial release readiness even when most tests pass. Runtime version/access gates can be reported blocked without fabricating successful integration.

## Demo minimum narrative

Alice lists backed income → Bob asks AI and buys → controlled labelled dividend → Bob resells to Carol while retaining accrued claim → second dividend plus split example → expiry → both claim and Alice releases safe principal. Separate panel asks ETH/USDC exact-input or exact-output from real mainnet source with timestamp; it recommends only. Include one visible rejected stale/double purchase and no effect on funds. Accelerated demo time is explicit, not six months actually elapsed.
