// SPDX-License-Identifier: MIT
// GENERATED from docs/spec/contract-interface.md; run pnpm generate.
// Interface-only: no deployed implementation or economic guarantees.
pragma solidity 0.8.34;

import "./ProtocolTypes.sol";

interface IProtocolErrors {
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
}
