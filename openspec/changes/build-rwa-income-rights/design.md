## Context

Baseline ini merancang produk pertama dari workspace dokumen. Starter monorepo sekarang menyediakan web/worker shell, shared types/validation, interface Solidity terkompilasi dan tooling. Belum ada kontrak ekonomi, UI produk, indexer/finalizer, database migration atau production deployment. PRD, evidence source/API snapshots, dan eksperimen accounting telah tersedia; batas buktinya tetap berlaku. Metadata finalizer terbatas disetujui eksplisit untuk hackathon. UI/UX desainer menentukan visual, spec menentukan data dan perilaku.

## Goals / Non-Goals

**Goals:** seluruh lifecycle backing → primary purchase → dividend → resale → dividend → expiry → claim/release; tiga fungsi AI; data/interface yang sama untuk empat orang; testnet demo yang jujur dan reproducible; sumber likuiditas mainnet untuk rekomendasi read-only.

**Non-Goals:** NFT, fractional resale, direct transfer, guaranteed yield/redemption price, arbitrary issuer support, swap/bridge execution, training ML, production financial custody, upgrade proxy atau microservices sebanyak anggota. Repo application foundation, deployment account choices dan jobdesk dilakukan pada tahap berikutnya.

## Decisions

### 1. One shared repo, separate logical processes

Struktur foundation berikut sudah dibuat; implementation fitur tetap mengikuti task dan acceptance masing-masing:

```text
apps/web/               Next.js, UI, API routes, CopilotKit runtime
apps/worker/            index finalized chain logs + issuer polling/reporting
packages/contracts/    Foundry, adapters, mock tokens, scripts/tests
packages/shared/       generated ABI + shared validators/types/config
supabase/migrations/   indexed data/private sessions schema & RLS
openspec/              requirements, design and tasks
docs/spec/             normative detailed interface appendices
schemas/ examples/     planned wire contracts & validation fixtures
```

Satu repo membuat perubahan interface dapat direview bersama. Worker proses terpisah karena polling tidak bergantung halaman terbuka atau umur request serverless. Paket bersama tidak boleh mengimpor server secrets. Database tidak membuat transaksi onchain otomatis dari user input. Foundation memakai pnpm workspace 11.3.0, Node 24.18.0 dan root scripts; belum memerlukan build orchestrator tambahan. Detail commands/batas implementation: [development guide](../../../docs/development.md).

### 2. Ownership of truth

| Fakta | Otoritas | Consumer |
| --- | --- | --- |
| Backing, position owner, terms, claims, listing state | Contract state/events | API/cache, UI, AI |
| Event classification and verified coverage | Constrained team finalizer + registry | Accounting and transfer/release guards |
| Actual token multiplier/shares/configuration | Token adapter at a known chain state | Registry validation, checkpoint, UI |
| Search results | Finalized index + as-of marker | UI/AI; revalidated latest before own transaction |
| User's recent receipt | Wallet/public RPC latest, visibly provisional until final | Immediate UX overlay and status |
| Chat/private request history | Supabase with verified session/RLS | Authorized user only |
| Swap estimates | Quote provider at stated time/chain/amount | Read-only comparison cards |

AI prose is never financial state. API cache alone cannot certify a purchase remains possible. Claim accounting remains valid even if chat/indexer is down.

### 3. Minimal onchain separation with precise interfaces

Use market/accounting plus corporate-event registry, with shared adapter logic. Exact structs/function signatures/errors are in [contract-interface](../../../docs/spec/contract-interface.md); financial rules in [accounting-and-finality](../../../docs/spec/accounting-and-finality.md). Starter compiles these signatures as interfaces and generates ABI marked **INTERFACE_ONLY**. It is not implementation/deployment proof. Generate ABI/types from actual implementations later and compare to approved signatures rather than hand-copying.

Position backing is assigned once; resale transfers income rights only. Approvals may be prior wallet transactions; the market payment plus rights activation/transfer is a single atomic contract call. Seller pricing is fixed. No mutable economic terms after activation. Separate listing cancellation from safe custody release.

### 4. Finality and late events

Team finalizer is trusted to classify issuer event data and report completeness; this is not trustless corporate-action proof. Per-asset event order, live token fingerprint, consumed cursor and monotonic verified coverage have distinct roles. Fingerprint mismatch gates ownership-changing operations; coverage through expiry/cancel boundary plus processed liabilities gates release. Do not require a worker to certify future/current-second time for every trade.

Only finalized supported events allocate. Already allocated shares stay with the recipient; records used for allocation cannot be rewritten. Retroactive correction to accepted history causes quarantine and incident handling, not silent redistribution or admin sweep. Claims of already final allocated shares should remain available where adapter safety permits. There is no guarantee of bounded principal withdrawal delay during source ambiguity. Token issuer pause/upgrades remain external risks. See normative accounting/registry specs for exact transitions.

### 5. Read model and identity

Public index consumes finalized logs with block hash/tx/log identity. Fresh direct read and simulation precede wallet actions. Own newly-created positions/listings/receipts are shown through a latest-state overlay so finalized indexing latency does not look like lost funds. Index mismatch/reorg and API failure have explicit states. Data/API contracts specify schema, pagination, reconciliation and source markers.

Public reads and quote requests can be anonymous within server quotas. Supabase Web3 authenticated sessions protect persisted private chat/intents. Wallet connection alone is not authentication. Server verifies identity and wallet match; RLS scoped by auth user. Service-role credentials never enter browser or model context.

### 6. One assistant; tools provide data; wallet provides authorization

CopilotKit v2 built-in agent calls OpenAI through its supported provider runtime. Use one orchestration loop and predefined cards rendering validated tool results. It does not generate arbitrary executable React or calldata. Model/API credentials on server. UI visual designer can change card layout without changing fields, freshness, disclaimer or action semantics.

Tools read canonical DTOs; purchase preparation produces a deterministic intent that the user explicitly reviews. Prompt injection in listing text never changes tool authority. No auto-sign/send, including replay or refresh. Chosen runtime/schema compatibility is tested in a thin integration task before wider UI work. See [AI/quotes](../../../docs/spec/ai-and-quotes.md).

### 7. Live market recommendation without exchange execution

Read-only mainnet quote supports exact-input and exact-output. Chosen provider source scope, ETH/WETH/native USDC mapping, embedded/additional fee treatment, unknown net costs, freshness and hypothetical chain comparison are explicit. Do not build pools or fund liquidity. Multi-chain cards do not imply same-chain wallet funds can move freely; fee/time assumptions accompany results. No bridge calculation is represented as zero when unknown. No global cheapest promise and no ML slippage confidence without validation.

### 8. Common data contract before parallel implementation

Version 1 schemas and examples are shared. Financial integers are decimal strings; units and chain/token identity explicit. Constraints JSON Schema cannot express (ownership, liquidity, cross-field conservation) are enforced in code/contract and semantic tests. Exact definitions are in data-contracts and api-contract; do not create alternate DTO conventions. Local schema-valid data is not proof that blockchain state matches.

## Risks / Trade-offs

- Trusted metadata can be wrong → constrained immutable history, evidence hash, incident quarantine, clear trust notice; no claim of production recovery guarantee.
- Shares/rounding/cursors can break ownership → exact arithmetic fixtures, Solidity invariant/differential tests, boundary event ordering, fork evidence.
- Finalized index lags wallet receipt → latest direct overlay and revalidation, finality labels; no cached permission decision.
- Mainnet quotes differ from Sepolia demo balances → separate environment and token identities; no fake conversion into DemoUSD.
- Quote/runtime external APIs fail → explicit unavailable state, manual marketplace flow unaffected, recorded fixtures labelled.
- Shared interface drifts → schema/examples generation, linked task acceptance and coordinated spec change before consumers update.
- Large spec can hide missing integration → staged vertical journeys, requirement coverage matrix and peer review, not just formatter validation.

## Migration Plan

No existing production state to migrate. Starter foundation and base toolchain are present; product/provider dependencies are pinned and tested with their implementation tasks. Local Anvil precedes Sepolia; fixtures/mock accounts never use production keys. Validate adapters against pinned official-token fork separately. Deploy demo with recorded chain/addresses/source commit and seed manifest. Export deployment ABI/address manifests only after successful deployment; starter interface ABI remains explicitly separate. A faulty non-upgradeable testnet deployment uses a new documented address and demo dataset; no claim of migrating real users/funds automatically.

## Open Questions / Implementation Gates

No routine product approval is required for field naming and implementation details within this baseline. Remaining gates are proof/access: actual provider keys/RPC access, pinned dependencies/runtime tool-card test, contract/fork tests, chain read performance and event coverage detection, gas/batch sizing, private auth/replay validation, frontend integration. A failed gate changes design transparently; if solving it changes economics/trust/scope, discuss that specific change. Team assignments wait for the meeting; repo starter completion is recorded separately from product feature completion.
