// SPDX-License-Identifier: MIT
// GENERATED from docs/spec/contract-interface.md; run pnpm generate.
// Interface-only: no deployed implementation or economic guarantees.
pragma solidity 0.8.34;

import "./ProtocolTypes.sol";
import {IProtocolErrors} from "./IProtocolErrors.sol";

interface IIncomeRightsMarket is IProtocolErrors {
    function createPrimaryListing(CreatePrimaryListingParams calldata p)
        external
        returns (uint256 positionId, uint256 listingId);
    function cancelListing(uint256 listingId) external;
    function relistPrimaryPosition(uint256 positionId, uint256 priceAtomic, uint64 listingExpiresAt)
        external
        returns (uint256 listingId);
    function createSecondaryListing(uint256 positionId, uint256 priceAtomic, uint64 listingExpiresAt)
        external
        returns (uint256 listingId);
    function buyListing(BuyListingParams calldata p) external;
    function checkpointPosition(uint256 positionId, uint32 maxEvents)
        external
        returns (uint64 newCursor, bool complete);
    function settlePosition(uint256 positionId, uint32 maxEvents) external;
    function releasePrincipal(uint256 positionId, uint32 maxEvents)
        external
        returns (uint256 sharesTransferred);
    function claimIncome(bytes32 assetId, uint256 shares) external returns (uint256 tokenAmountAtomic);
    function getPosition(uint256 positionId) external view returns (Position memory);
    function getListing(uint256 listingId) external view returns (Listing memory);
    function claimShares(bytes32 assetId, address account) external view returns (uint256);
    function totalPrincipalShares(bytes32 assetId) external view returns (uint256);
    function totalClaimShares(bytes32 assetId) external view returns (uint256);
    event PositionCreated(
        uint256 indexed positionId,
        bytes32 indexed assetId,
        address indexed principalOwner,
        uint256 principalShares,
        uint16 incomeBps,
        uint64 durationSeconds
    );
    event ListingCreated(
        uint256 indexed listingId,
        uint256 indexed positionId,
        address indexed seller,
        ListingKind kind,
        uint256 priceAtomic,
        uint64 expiresAt,
        bytes32 termsHash
    );
    event ListingCancelled(
        uint256 indexed listingId, uint256 indexed positionId, address actor, uint8 reason
    );
    event ListingFilled(
        uint256 indexed listingId,
        uint256 indexed positionId,
        address indexed buyer,
        address seller,
        uint256 priceAtomic
    );
    event RightsOwnerChanged(
        uint256 indexed positionId,
        address indexed previousOwner,
        address indexed newOwner,
        uint64 eventCursor,
        uint64 startAt,
        uint64 endAt
    );
    event IncomeAllocated(
        uint256 indexed positionId,
        bytes32 indexed assetId,
        uint64 indexed sequence,
        address principalOwner,
        address rightsOwner,
        uint256 principalIncomeShares,
        uint256 rightsIncomeShares,
        uint256 remainingPrincipalShares
    );
    event PositionCheckpointed(
        uint256 indexed positionId, uint64 previousCursor, uint64 newCursor, bool complete
    );
    event PositionSettled(uint256 indexed positionId, uint64 eventCursor);
    event IncomeClaimed(
        bytes32 indexed assetId, address indexed beneficiary, uint256 shares, uint256 tokenAmountAtomic
    );
    event PrincipalReleased(
        uint256 indexed positionId,
        bytes32 indexed assetId,
        address indexed principalOwner,
        uint256 shares,
        uint256 tokenAmountAtomic
    );
}
