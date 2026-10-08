# Contract interface v1

Status: normative interface specification untuk pengembangan. Starter kini menghasilkan source interface Solidity dan ABI **INTERFACE_ONLY** dari build Foundry; belum ada implementasi atau kontrak siap deploy. ABI implementasi/deployment kelak wajib dihasilkan dari kontrak produk dan diverifikasi terhadap dokumen ini serta lifecycle tests. Lihat [contract workspace](../../packages/contracts/README.md).

## 1. Deployment dan tanggung jawab

`IncomeRightsMarket` menyimpan seluruh backing, principal, claim, position, listing, dan mengeksekusi pembayaran. `CorporateActionRegistry` menyimpan asset configuration, final events, snapshot acknowledgement, dan finality coverage. Adapter stateless/view menginterpretasikan token; market sendiri melakukan `transferFrom`/`transferShares` ke token yang sudah diizinkan. Tidak memakai `delegatecall` adapter.

- Kedua kontrak produk non-upgradeable. Market reference ke registry dan `paymentToken` immutable.
- Settlement token v1 hanya **DemoUSD**, ERC-20 standar nonrebasing, 6 decimals, tanpa transfer fee. Tidak menerima native ETH sebagai pembayaran harga. Platform fee tetap 0; tidak ada fee setter.
- Asset tuple chain/token/adapter, decimals, dan initial implementation evidence immutable setelah registration. Menambah aset baru perlu ID baru; satu underlying address tidak boleh didaftarkan dua kali di registry yang sama. Tidak ada migrasi adapter posisi aktif diam-diam.
- `assetId = keccak256(abi.encode(block.chainid, token))`. Position/listing IDs mulai dari 1; 0 berarti tidak ada. Event sequence mulai 1, baseline 0.
- No NFT, owner approval/operator, direct gift, generic execute, arbitrary call, delegated purchase, admin sweep, atau setter saldo/owner. Buyer dan penerima hak adalah `msg.sender`. Claim/release selalu kepada pemilik yang memanggil.

## 2. Constants dan enums

```solidity
uint256 constant MULTIPLIER_SCALE = 1e18;
uint16 constant BPS_SCALE = 10_000;
uint32 constant MAX_EVENTS_PER_CALL = 32;
uint64 constant MIN_DURATION_SECONDS = 60;
uint64 constant MAX_DURATION_SECONDS = 365 days;
uint64 constant MIN_LISTING_LIFETIME = 60;
uint64 constant MAX_LISTING_LIFETIME = 30 days;

enum PositionState { OFFERED, ACTIVE, SETTLED, CANCELLED, RELEASED }
enum ListingKind { PRIMARY, SECONDARY }
enum ListingState { OPEN, FILLED, CANCELLED }
enum AssetEventKind { DIVIDEND, SPLIT, REVERSE_SPLIT, NO_INCOME }
enum AssetSafetyState { NORMAL, ACCOUNTING_QUARANTINED, TRANSFER_QUARANTINED }
```

Stored enum order di atas adalah encoding ABI v1. `SETTLING`, `EXPIRED`, `INVALID`, dan `DATA_STALE` adalah **derived view states**, bukan enum storage tambahan. Position ACTIVE dan `now >= endAt` ditampilkan SETTLING. Listing OPEN dengan `now >= expiresAt` ditampilkan EXPIRED; listing secondary yang owner/position-nya tidak valid ditampilkan INVALID (EXPIRED menang bila keduanya). Quarantined dan stale adalah availability flags, tidak mengubah historical lifecycle.

Default UI primary: duration 180 hari, listing lifetime 7 hari. Demo preset dapat memakai durasi 600 detik. Deadline selalu absolut, `now < expiresAt`; secondary deadline harus `<= endAt`, termasuk saat remaining lifetime kurang dari 60 detik: minimum lifetime tetap 60 sehingga listing baru ditolak, posisi tetap claimable. Kontrak tidak memakai kalender bulan.

## 3. Structs publik

```solidity
struct AssetConfig {
    bytes32 assetId;
    address token;
    address adapter;
    uint8 tokenDecimals;
    bool newPositionsEnabled;
    AssetSafetyState safetyState;
    uint64 baselineAt;
    uint256 baselineMultiplier;
    uint256 baselineIssuerNonce;
    uint256 baselineHistoryIndex;
    bytes32 initialImplementationEvidenceHash;
}

struct TokenSnapshot {
    uint256 multiplier;               // resolved at the read timestamp
    uint256 issuerNonce;
    uint256 pendingMultiplier;
    uint256 pendingIssuerNonce;
    uint64 pendingActivationAt;        // 0 if no unresolved future schedule
    uint256 historyLength;
    bytes32 latestHistoryEntryHash;
    uint256 feePerPeriod;
    uint256 periodLength;
    bytes32 tokenRuntimeCodeHash;      // proxy code only, not implementation proof
}

struct AssetHead {
    uint64 eventCount;
    uint256 multiplier;
    uint256 issuerNonce;
    uint256 consumedHistoryIndex;
    bytes32 acknowledgedSnapshotHash;
    bytes32 assetHeadHash;
    uint64 finalizedThrough;
    uint64 coverageSourceBlockTimestamp;
    uint256 coverageSourceBlockNumber;
    bytes32 coverageSourceBlockHash;
    bytes32 coverageEvidenceHash;
}

struct FinalizedAssetEvent {
    bytes32 eventId;
    uint64 sequence;
    AssetEventKind kind;
    uint64 effectiveAt;
    uint256 multiplierBefore;
    uint256 multiplierAfter;
    uint256 issuerNonceAfter;
    uint256 historyIndex;
    uint32 sourceRevision;
    bytes32 sourceOccurrenceKey;
    bytes32 evidenceHash;
}

struct Position {
    uint256 positionId;
    bytes32 assetId;
    address principalOwner;
    address rightsOwner;               // zero until activated; retained for history
    uint256 principalShares;
    uint16 incomeBps;
    uint64 durationSeconds;
    uint64 createdAt;
    uint64 startAt;                    // zero until bought
    uint64 endAt;                      // zero until bought
    uint64 cancelledAt;                // only primary cancellation
    uint64 activationEventCursor;
    uint64 eventCursor;
    uint256 currentListingId;          // latest listing, consult state/expiry
    PositionState state;
}

struct Listing {
    uint256 listingId;
    uint256 positionId;
    ListingKind kind;
    address seller;
    address paymentToken;
    uint256 priceAtomic;
    uint64 createdAt;
    uint64 expiresAt;
    ListingState state;
    bytes32 termsHash;
}

struct CreatePrimaryListingParams {
    bytes32 assetId;
    uint256 depositTokenAmountAtomic;
    uint256 minReceivedShares;
    uint16 incomeBps;
    uint64 durationSeconds;
    uint256 priceAtomic;
    uint64 listingExpiresAt;
}

struct BuyListingParams {
    uint256 listingId;
    bytes32 expectedTermsHash;
    bytes32 expectedAssetHeadHash;
    uint256 maxPriceAtomic;
    uint64 deadline;
    uint32 maxEvents;
}

struct CoverageInput {
    uint64 finalizedThrough;
    uint64 sourceBlockTimestamp;        // not server retrieval time
    uint256 sourceBlockNumber;
    bytes32 sourceBlockHash;
    bytes32 evidenceHash;
}
```

Zero deadline/maxPrice is not interpreted as unlimited. `now <= deadline` for buyer intent, but listing requires `now < expiresAt`; an intent cannot extend listing lifetime. `maxPriceAtomic >= priceAtomic`, nonzero hashes must match. `maxEvents` always 1–32. No economic terms inferred from metadata strings.

For pending schedule normalization, adapter sets pending fields to zero if no future schedule exists; resolved current multiplier/nonce and history capture completed schedules. This avoids stale storage housekeeping producing a false mismatch after ordinary token transfer.

`snapshotHash = keccak256(abi.encode(TokenSnapshot fields in listed order))`; `assetHeadHash = keccak256(abi.encode(assetId,eventCount,acknowledgedSnapshotHash))`. Coverage-only updates do not invalidate a purchase preview. Snapshot equality does not remove current eventCount/cursor checks.

`termsHash = keccak256(abi.encode(block.chainid,address(market),listingId,positionId,kind,seller,paymentToken,priceAtomic,expiresAt,assetId,principalOwner,incomeBps,durationSeconds,startAt,endAt))`, all integers at the declared ABI widths. Primary stored terms uses startAt/endAt=0; actual dates are set on activation. Do not recompute old listing terms using later position dates. No mutable price/listing version: a replacement gets a new listing ID and hash.

`eventId = keccak256(abi.encode(block.chainid,asset.token,sourceOccurrenceKey))`. Updater takes a canonical occurrence identifier, hashes its UTF-8 provider-namespaced form; e.g. `xstocks:<raw issuer occurrence id>`, or `demo:<token lowercase address>:<schedule id decimal>`. Correction version changes `sourceRevision`, not occurrence identity. Canonicalization and raw evidence are persisted by worker; a source occurrence mapping is immutable once committed.

## 4. Market write API

```solidity
function createPrimaryListing(CreatePrimaryListingParams calldata p)
    external returns (uint256 positionId, uint256 listingId);
function cancelListing(uint256 listingId) external;
function relistPrimaryPosition(uint256 positionId, uint256 priceAtomic, uint64 listingExpiresAt)
    external returns (uint256 listingId);
function createSecondaryListing(uint256 positionId, uint256 priceAtomic, uint64 listingExpiresAt)
    external returns (uint256 listingId);
function buyListing(BuyListingParams calldata p) external;
function checkpointPosition(uint256 positionId, uint32 maxEvents)
    external returns (uint64 newCursor, bool complete);
function settlePosition(uint256 positionId, uint32 maxEvents) external;
function releasePrincipal(uint256 positionId, uint32 maxEvents)
    external returns (uint256 sharesTransferred);
function claimIncome(bytes32 assetId, uint256 shares)
    external returns (uint256 tokenAmountAtomic);
```

| Function | Caller/conditions | State effect and transfer |
| --- | --- | --- |
| `createPrimaryListing` | Any wallet; known enabled asset; synchronized head; positive deposit/price/min shares; valid bps/duration/deadline | Atomic measured deposit and new OFFERED position + PRIMARY OPEN listing. `principalOwner=msg.sender`; baseline cursor=head; rights owner zero |
| `cancelListing` PRIMARY | Listing seller/principal owner; listingId==position.currentListingId; OPEN, including expired; position still OFFERED | Listing CANCELLED; position CANCELLED; cancelledAt=now; **no transfer** and no checkpoint required |
| `cancelListing` SECONDARY | Listing seller still current rights owner; listingId==position.currentListingId; OPEN, including expired | Listing CANCELLED only; position and claims unchanged; no current-data requirement |
| `relistPrimaryPosition` | Principal owner; OFFERED; previous listing expired; no live listing; synchronized head | New PRIMARY listing ID with new price/deadline; same locked principal/terms; old listing remains historical OPEN but derived EXPIRED. No new deposit |
| `createSecondaryListing` | Current rights owner; ACTIVE and now<endAt; synchronized head; previous listing absent/expired/cancelled; valid deadline | New SECONDARY listing; no token transfer and no rights transfer; full position only |
| `buyListing` PRIMARY | Buyer!=seller; matching hashes; valid listing/intent; normal synchronized asset; all backlog checkpointed | Transfer fixed DemoUSD buyer→seller, then state ACTIVE/rightsOwner/start/end in same transaction; accrued offered income Alice |
| `buyListing` SECONDARY | Same plus seller==rightsOwner and now<endAt | Checkpoint old owner then transfer price buyer→seller and rightsOwner→buyer atomically; start/end/incomeBps/principalOwner unchanged |
| `checkpointPosition` | Anyone; known position, final recognized events; safetyState=NORMAL but current DATA_STALE allowed; no caller-selected beneficiary | Process bounded events; cursor and claims advance; no token transfer; terminal RELEASED is complete no-op; explicit quarantine blocks allocation |
| `settlePosition` | Anyone; ACTIVE with now>=endAt; normal synchronized head; coverage>=endAt; complete checkpoint | Position SETTLED; invalidate any still-OPEN secondary listing by setting CANCELLED and reason SETTLEMENT; no principal transfer |
| `releasePrincipal` | Principal owner; CANCELLED with coverage>=cancelledAt or SETTLED; normal synchronized head; complete checkpoint | Set shares=0 and RELEASED; transfer exact prior principal shares to msg.sender; preserve all claims |
| `claimIncome` | Beneficiary calling; shares>0 <= claimShares(asset,msg.sender); proven safe transfer | Debit exact claim and totalClaim, transferShares to msg.sender, verify exact deltas, return displayed token delta; no event-head/coverage requirement |

Every mutating user-market entry point uses a common reentrancy guard; registry views/adapter calls must not create a reentrant mutation route. Checks/effects/interactions plus revert atomicity; balance deltas checked after transfers. Approval is ordinary ERC-20 approval in a prior user transaction, never EIP-2612/Permit2 in v1. Market does not hold payment token as pooled escrow; transfer goes directly seller, requires exact debit/credit for the standard settlement token. Buyer cannot buy their own listing; principal owner may later buy a secondary right from a different seller.

`createSecondaryListing` and `relistPrimaryPosition` require synchronized asset but need not process full position backlog because no ownership/payment changes. Their returned previews must disclose `pendingEventCount`; buy performs checkpoint before owner change. No caller can change principalOwner, gift/transfer rights directly, or cancel an active primary right.

## 5. Registry/admin API

```solidity
function registerAsset(address token, address adapter, bool newPositionsEnabled,
    bytes32 initialImplementationEvidenceHash) external returns (bytes32 assetId);
function setNewPositionsEnabled(bytes32 assetId, bool enabled) external;
function setAssetSafetyState(bytes32 assetId, AssetSafetyState state, bytes32 reasonHash) external;
function appendFinalizedEvents(bytes32 assetId, FinalizedAssetEvent[] calldata events) external;
function acknowledgeAssetSnapshot(bytes32 assetId, TokenSnapshot calldata expectedSnapshot,
    bytes32 reconciliationEvidenceHash) external;
function advanceFinalityCoverage(bytes32 assetId, CoverageInput calldata coverage) external;
```

- `REGISTRY_ADMIN_ROLE`: register asset, enable/disable new deposits, role membership, and audited safety-state transitions. No changes to immutable config/active terms.
- `EVENT_FINALIZER_ROLE`: append events, acknowledge snapshots, advance coverage, and **escalate** to ACCOUNTING_QUARANTINED or TRANSFER_QUARANTINED. It cannot lower quarantine, enable assets, change role membership, or transfer user funds.
- Lowering quarantine requires admin, new reconciliation evidence/reason hash, current config compatibility, complete acknowledged head, and no unresolved final-event conflict. A conflicting immutable finalized event has **no v1 automatic recovery or rewrite**; it stays quarantined pending a separately reviewed migration outside this scope.
- Demo token mint/schedule operator is distinct from production finalizer; backend key is never used by AI/browser. Local demo operator controls artificial events, not real issuer contracts.

`appendFinalizedEvents`: batch size 1–32; caller-provided sequence must equal previous+1; beforeMultiplier must equal prior head multiplier; issuerNonceAfter strictly greater than prior resolved nonce but need not increase by 1; nonzero M; type/direction valid; `effectiveAt <= now`, nondecreasing across records, and greater than closed coverage. Reject duplicate eventId **and** already-consumed historyIndex. SourceRevision >0. Do not allow arbitrary shares/beneficiary input.

The adapter checks each event against its post-baseline immutable effective history entry: history index, before/after multiplier, activation time. Every effective history entry since baseline must be represented exactly once. Increasing historyIndex by one is required for the supported zero-fee v1 mechanism; an overridden future entry does not consume an index/event. A history migration, unexplained gap, backwards timeline, unsupported class, missing evidence, or configuration change causes quarantine/integration failure, not silent skipping. Explicit issuer nonce gaps are allowed separately from history indices.

Historical event batches may be appended incrementally while the live token is ahead. `acknowledgeAssetSnapshot` succeeds only after all **effective** post-baseline history entries are represented and live adapter snapshot exactly matches expected snapshot; last event multiplier/nonce must match current resolved state. A future pending last entry may remain unconsumed. It can acknowledge pending schedule changes with zero new effective events. Late metadata cannot be inserted behind accepted event order/coverage.

`advanceFinalityCoverage` accepts monotonic time only, `finalizedThrough <= sourceBlockTimestamp < block.timestamp`, sourceBlockNumber<block.number, nonzero hashes, synchronized head, and all known events effective <= coverage represented. The finalizer verifies finalized source block and API completeness offchain; arbitrary block hash input does not prove historical state/finality onchain. Registry emits evidence location for audit. Repeated identical coverage is a no-op; any backwards change is rejected. Coverage is not auto-derived from waiting a fixed number of hours. `sourceBlockTimestamp` is not API retrieval time; wire DTO snapshot.observedAt remains server read time.

Registration records current synchronized baseline, not reconstructing events before custody. Registration is rejected for nonzero fee, missing share transfer/history interface, token decimals other than 18 for this v1 mechanism, adapter/token mismatch, unresolved future-baseline ambiguity, or existing token registration. baselineHistoryIndex is the last already-effective entry; a future pending last entry is excluded and separately represented in snapshot. All configured real assets require fork qualification before real-token use; demo registration can use deterministic full-history mocks. The incomplete pre-baseline arrays observed in research are not proof of forward-history compatibility. Any unexpected pruning/rewrite of an effective post-baseline entry fails qualification/quarantines the asset.

## 6. Adapter/read API

```solidity
function readSnapshot(address token) external view returns (TokenSnapshot memory);
function sharesOf(address token, address account) external view returns (uint256);
function tokenAmountForShares(address token, uint256 shares) external view returns (uint256);
function validateEffectiveEvent(address token, FinalizedAssetEvent calldata item) external view returns (bool);
function isShareTransferSafe(address token) external view returns (bool);

function getAsset(bytes32 assetId) external view returns (AssetConfig memory);
function getAssetHead(bytes32 assetId) external view returns (AssetHead memory);
function getAssetEvent(bytes32 assetId, uint64 sequence) external view returns (FinalizedAssetEvent memory);
function getPosition(uint256 positionId) external view returns (Position memory);
function getListing(uint256 listingId) external view returns (Listing memory);
function claimShares(bytes32 assetId, address account) external view returns (uint256);
function totalPrincipalShares(bytes32 assetId) external view returns (uint256);
function totalClaimShares(bytes32 assetId) external view returns (uint256);
```

First five methods are adapter interface; registry owns asset/head/event reads; market owns position/listing/claims/totals. Read functions are O(1), no enumerate-all array. Search/pagination is indexer responsibility. `getPosition` returns stored state; server computes time-derived status at a specified block/time. `getAssetEvent` rejects sequence=0/out-of-range; baseline comes from AssetConfig. Stateless adapter `isShareTransferSafe` tests supported observable configuration; the **market separately checks registry transfer quarantine**. Underlying pause/sanctions may still cause token revert for a specific account. Neither check independently detects a malicious proxy implementation change before offchain monitoring; this remains disclosed issuer/finalizer trust, not a guarantee.

Adapter cannot cryptographically prove proxy implementation via another contract's storage without an exposed getter/proof. Offchain monitoring is mandatory. No adapter key/signature is accepted as a substitute for exact share-transfer deltas.

## 7. Events for indexer and audit

Indexer can fetch getter state at the event block; it must not infer missing terms from AI messages. Event signatures are part of v1 integration contract; three indexed fields maximum:

```solidity
event AssetRegistered(bytes32 indexed assetId, address indexed token, address adapter);
event AssetIntakeChanged(bytes32 indexed assetId, bool enabled);
event AssetSafetyStateChanged(bytes32 indexed assetId, AssetSafetyState state, bytes32 reasonHash);
event AssetEventFinalized(bytes32 indexed assetId, uint64 indexed sequence,
    bytes32 indexed eventId, AssetEventKind kind, uint64 effectiveAt,
    uint256 multiplierBefore, uint256 multiplierAfter, uint256 issuerNonceAfter, bytes32 evidenceHash);
event AssetSnapshotAcknowledged(bytes32 indexed assetId, bytes32 assetHeadHash,
    bytes32 snapshotHash, bytes32 reconciliationEvidenceHash);
event FinalityCoverageAdvanced(bytes32 indexed assetId, uint64 finalizedThrough,
    uint256 sourceBlockNumber, bytes32 sourceBlockHash, bytes32 evidenceHash);
event PositionCreated(uint256 indexed positionId, bytes32 indexed assetId,
    address indexed principalOwner, uint256 principalShares, uint16 incomeBps, uint64 durationSeconds);
event ListingCreated(uint256 indexed listingId, uint256 indexed positionId,
    address indexed seller, ListingKind kind, uint256 priceAtomic, uint64 expiresAt, bytes32 termsHash);
event ListingCancelled(uint256 indexed listingId, uint256 indexed positionId,
    address actor, uint8 reason); // 0 OWNER_CANCEL, 1 SETTLEMENT
event ListingFilled(uint256 indexed listingId, uint256 indexed positionId,
    address indexed buyer, address seller, uint256 priceAtomic);
event RightsOwnerChanged(uint256 indexed positionId, address indexed previousOwner,
    address indexed newOwner, uint64 eventCursor, uint64 startAt, uint64 endAt);
event IncomeAllocated(uint256 indexed positionId, bytes32 indexed assetId,
    uint64 indexed sequence, address principalOwner, address rightsOwner,
    uint256 principalIncomeShares, uint256 rightsIncomeShares, uint256 remainingPrincipalShares);
event PositionCheckpointed(uint256 indexed positionId, uint64 previousCursor, uint64 newCursor, bool complete);
event PositionSettled(uint256 indexed positionId, uint64 eventCursor);
event IncomeClaimed(bytes32 indexed assetId, address indexed beneficiary,
    uint256 shares, uint256 tokenAmountAtomic);
event PrincipalReleased(uint256 indexed positionId, bytes32 indexed assetId,
    address indexed principalOwner, uint256 shares, uint256 tokenAmountAtomic);
```

No automatic Expired event: expiry is timestamp-derived. `IncomeAllocated` occurs for DIVIDEND even if allocation rounded zero, not for split; `PositionCheckpointed` records progress for every successful non-empty checkpoint. RightsOwnerChanged previousOwner=zero on primary. `ListingCancelled` PRIMARY is accompanied by position cancelledAt available from getter; no principal transfer event until release. Getter reads with historical block tag or ordered event processing are needed to avoid indexing future state from latest.

## 8. Stable custom errors

```solidity
error Unauthorized();
error UnknownAsset(bytes32 assetId);
error UnknownPosition(uint256 positionId);
error UnknownListing(uint256 listingId);
error InvalidAmount();
error InvalidIncomeBps();
error InvalidDuration();
error InvalidDeadline();
error InvalidBatchSize();
error AssetIntakeDisabled(bytes32 assetId);
error AssetQuarantined(bytes32 assetId, AssetSafetyState state);
error AssetNotSynchronized(bytes32 assetId);
error UnsupportedAssetConfiguration(bytes32 assetId);
error InvalidPositionState(uint256 positionId, PositionState state);
error ListingNotOpen(uint256 listingId);
error ListingSuperseded(uint256 listingId, uint256 currentListingId);
error ListingExpired(uint256 listingId);
error PositionExpired(uint256 positionId);
error ActiveListingExists(uint256 positionId, uint256 listingId);
error SellerNoLongerOwner(uint256 listingId);
error SelfPurchase();
error TermsChanged();
error AssetHeadChanged();
error PriceExceedsMaximum(uint256 priceAtomic, uint256 maxPriceAtomic);
error IntentExpired();
error CheckpointRequired(uint256 positionId, uint64 cursor, uint64 targetCursor);
error FinalityCoverageRequired(bytes32 assetId, uint64 actual, uint64 required);
error InsufficientClaimShares(uint256 available, uint256 requested);
error DepositBelowMinimum(uint256 receivedShares, uint256 minimumShares);
error ShareTransferMismatch();
error SettlementTransferMismatch();
error InsolventAsset(bytes32 assetId);
error DuplicateEvent(bytes32 eventId);
error InvalidEventSequence();
error InvalidEventEvidence();
error RetroactiveEvent();
error CoverageRegression();
error UnresolvedFinalityConflict();
```

Token/standard library revert reasons may bubble through (allowance, balance, issuer pause/sanctions, ReentrancyGuard). API must map known errors to recovery instructions without fabricating success; unknown revert retains transaction hash/reason metadata and safe generic text. Core error names are stable; adding a new error is a schema/ABI compatibility change reviewed alongside shared types.

## 9. Verification gates

Before any ABI artifact is called ready: build succeeds; signatures/enums matched by compatibility test; no independent handwritten ABI in web; normal full lifecycle and failure matrix pass; asset-by-asset invariant tests and fork boundaries disclosed. MAX_EVENTS_PER_CALL=32 must pass measured Sepolia-representative gas testing; if revised, update this spec, schema limits, worker batching, and tests together before merge. Interface/schema changes are shared changes, not a developer's local workaround.

Accounting rationale and fixtures: [accounting-and-finality.md](accounting-and-finality.md). Normative requirements: [asset-events](../../openspec/changes/build-rwa-income-rights/specs/asset-events/spec.md), [income-accounting](../../openspec/changes/build-rwa-income-rights/specs/income-accounting/spec.md), [rights-market](../../openspec/changes/build-rwa-income-rights/specs/rights-market/spec.md).
