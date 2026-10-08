// SPDX-License-Identifier: MIT
// GENERATED from docs/spec/contract-interface.md; run pnpm generate.
// Interface-only: no deployed implementation or economic guarantees.
pragma solidity 0.8.34;

uint256 constant MULTIPLIER_SCALE = 1e18;
uint16 constant BPS_SCALE = 10_000;
uint32 constant MAX_EVENTS_PER_CALL = 32;
uint64 constant MIN_DURATION_SECONDS = 60;
uint64 constant MAX_DURATION_SECONDS = 365 days;
uint64 constant MIN_LISTING_LIFETIME = 60;
uint64 constant MAX_LISTING_LIFETIME = 30 days;

enum PositionState {
    OFFERED,
    ACTIVE,
    SETTLED,
    CANCELLED,
    RELEASED
}
enum ListingKind {
    PRIMARY,
    SECONDARY
}
enum ListingState {
    OPEN,
    FILLED,
    CANCELLED
}
enum AssetEventKind {
    DIVIDEND,
    SPLIT,
    REVERSE_SPLIT,
    NO_INCOME
}
enum AssetSafetyState {
    NORMAL,
    ACCOUNTING_QUARANTINED,
    TRANSFER_QUARANTINED
}

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
    uint256 multiplier; // resolved at the read timestamp
    uint256 issuerNonce;
    uint256 pendingMultiplier;
    uint256 pendingIssuerNonce;
    uint64 pendingActivationAt; // 0 if no unresolved future schedule
    uint256 historyLength;
    bytes32 latestHistoryEntryHash;
    uint256 feePerPeriod;
    uint256 periodLength;
    bytes32 tokenRuntimeCodeHash; // proxy code only, not implementation proof
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
    address rightsOwner; // zero until activated; retained for history
    uint256 principalShares;
    uint16 incomeBps;
    uint64 durationSeconds;
    uint64 createdAt;
    uint64 startAt; // zero until bought
    uint64 endAt; // zero until bought
    uint64 cancelledAt; // only primary cancellation
    uint64 activationEventCursor;
    uint64 eventCursor;
    uint256 currentListingId; // latest listing, consult state/expiry
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
    uint64 sourceBlockTimestamp; // not server retrieval time
    uint256 sourceBlockNumber;
    bytes32 sourceBlockHash;
    bytes32 evidenceHash;
}
