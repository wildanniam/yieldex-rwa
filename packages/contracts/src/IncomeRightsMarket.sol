// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IIncomeRightsMarket} from "./interfaces/IIncomeRightsMarket.sol";
import {ICorporateActionRegistry} from "./interfaces/ICorporateActionRegistry.sol";
import {IAssetAdapter} from "./interfaces/IAssetAdapter.sol";
import {IShareToken} from "./adapters/IShareToken.sol";
import {IncomeMath} from "./libraries/IncomeMath.sol";
import "./interfaces/ProtocolTypes.sol";

/// @notice Non-upgradeable share custody and whole income-rights marketplace. No admin sweep.
contract IncomeRightsMarket is IIncomeRightsMarket, ReentrancyGuard {
    using SafeERC20 for IERC20;
    ICorporateActionRegistry public immutable registry;
    IERC20 public immutable paymentToken;
    uint256 private nextPosition = 1;
    uint256 private nextListing = 1;
    mapping(uint256 => Position) private positions;
    mapping(uint256 => Listing) private listings;
    mapping(bytes32 => mapping(address => uint256)) public claimShares;
    mapping(bytes32 => uint256) public totalPrincipalShares;
    mapping(bytes32 => uint256) public totalClaimShares;
    mapping(bytes32 => bytes32) private transferConfigurations;

    constructor(address registry_, address payment_) {
        if (
            registry_.code.length == 0 || payment_.code.length == 0
                || IERC20Metadata(payment_).decimals() != 6
        ) {
            revert InvalidAmount();
        }
        registry = ICorporateActionRegistry(registry_);
        paymentToken = IERC20(payment_);
    }

    function createPrimaryListing(CreatePrimaryListingParams calldata p)
        external
        nonReentrant
        returns (uint256 positionId, uint256 listingId)
    {
        if (p.depositTokenAmountAtomic == 0 || p.minReceivedShares == 0) revert InvalidAmount();
        if (p.incomeBps == 0 || p.incomeBps > BPS_SCALE) revert InvalidIncomeBps();
        if (p.durationSeconds < MIN_DURATION_SECONDS || p.durationSeconds > MAX_DURATION_SECONDS) {
            revert InvalidDuration();
        }
        (AssetConfig memory a, AssetHead memory h) = _synchronized(p.assetId);
        if (!a.newPositionsEnabled) revert AssetIntakeDisabled(p.assetId);
        _solvent(a);
        uint256 beforeShares = _shares(a, address(this));
        IERC20(a.token).safeTransferFrom(msg.sender, address(this), p.depositTokenAmountAtomic);
        uint256 received = _shares(a, address(this)) - beforeShares;
        if (received == 0 || received < p.minReceivedShares) {
            revert DepositBelowMinimum(received, p.minReceivedShares);
        }
        _synchronized(p.assetId);
        TokenSnapshot memory snapshot = IAssetAdapter(a.adapter).readSnapshot(a.token);
        bytes32 config = _transferConfiguration(snapshot);
        if (transferConfigurations[p.assetId] != bytes32(0) && transferConfigurations[p.assetId] != config) {
            revert UnsupportedAssetConfiguration(p.assetId);
        }
        transferConfigurations[p.assetId] = config;
        positionId = nextPosition++;
        positions[positionId] = Position(
            positionId,
            p.assetId,
            msg.sender,
            address(0),
            received,
            p.incomeBps,
            p.durationSeconds,
            uint64(block.timestamp),
            0,
            0,
            0,
            0,
            h.eventCount,
            0,
            PositionState.OFFERED
        );
        totalPrincipalShares[p.assetId] += received;
        emit PositionCreated(positionId, p.assetId, msg.sender, received, p.incomeBps, p.durationSeconds);
        listingId =
            _createListing(positions[positionId], ListingKind.PRIMARY, p.priceAtomic, p.listingExpiresAt);
        _solvent(a);
    }

    function cancelListing(uint256 id) external nonReentrant {
        Listing storage l = _listing(id);
        Position storage p = positions[l.positionId];
        if (l.seller != msg.sender) revert Unauthorized();
        if (p.currentListingId != id) revert ListingSuperseded(id, p.currentListingId);
        if (l.state != ListingState.OPEN) revert ListingNotOpen(id);
        if (l.kind == ListingKind.PRIMARY) {
            if (p.state != PositionState.OFFERED) revert InvalidPositionState(p.positionId, p.state);
            p.state = PositionState.CANCELLED;
            p.cancelledAt = uint64(block.timestamp);
        } else if (p.rightsOwner != msg.sender) {
            revert SellerNoLongerOwner(id);
        }
        l.state = ListingState.CANCELLED;
        emit ListingCancelled(id, p.positionId, msg.sender, 0);
    }

    function relistPrimaryPosition(uint256 id, uint256 price, uint64 expiresAt)
        external
        nonReentrant
        returns (uint256 listingId)
    {
        Position storage p = _position(id);
        if (p.principalOwner != msg.sender) revert Unauthorized();
        if (p.state != PositionState.OFFERED) revert InvalidPositionState(id, p.state);
        _noLiveListing(p);
        _synchronized(p.assetId);
        return _createListing(p, ListingKind.PRIMARY, price, expiresAt);
    }

    function createSecondaryListing(uint256 id, uint256 price, uint64 expiresAt)
        external
        nonReentrant
        returns (uint256 listingId)
    {
        Position storage p = _position(id);
        if (p.rightsOwner != msg.sender) revert Unauthorized();
        if (p.state != PositionState.ACTIVE) revert InvalidPositionState(id, p.state);
        if (block.timestamp >= p.endAt) revert PositionExpired(id);
        if (expiresAt > p.endAt) revert InvalidDeadline();
        _noLiveListing(p);
        _synchronized(p.assetId);
        return _createListing(p, ListingKind.SECONDARY, price, expiresAt);
    }

    function buyListing(BuyListingParams calldata input) external nonReentrant {
        _batch(input.maxEvents);
        Listing storage l = _listing(input.listingId);
        Position storage p = positions[l.positionId];
        if (p.currentListingId != input.listingId) {
            revert ListingSuperseded(input.listingId, p.currentListingId);
        }
        if (l.state != ListingState.OPEN) revert ListingNotOpen(l.listingId);
        if (block.timestamp >= l.expiresAt) revert ListingExpired(l.listingId);
        if (input.deadline == 0 || block.timestamp > input.deadline) revert IntentExpired();
        if (input.expectedTermsHash == bytes32(0) || input.expectedTermsHash != l.termsHash) {
            revert TermsChanged();
        }
        if (input.maxPriceAtomic < l.priceAtomic) {
            revert PriceExceedsMaximum(l.priceAtomic, input.maxPriceAtomic);
        }
        if (msg.sender == l.seller) revert SelfPurchase();
        (, AssetHead memory h) = _synchronized(p.assetId);
        if (input.expectedAssetHeadHash == bytes32(0) || input.expectedAssetHeadHash != h.assetHeadHash) {
            revert AssetHeadChanged();
        }
        if (l.kind == ListingKind.PRIMARY) {
            if (p.state != PositionState.OFFERED) revert InvalidPositionState(p.positionId, p.state);
        } else {
            if (p.state != PositionState.ACTIVE) revert InvalidPositionState(p.positionId, p.state);
            if (block.timestamp >= p.endAt) revert PositionExpired(p.positionId);
            if (p.rightsOwner != l.seller) revert SellerNoLongerOwner(l.listingId);
        }
        _complete(p, input.maxEvents);
        address previous = p.rightsOwner;
        if (l.kind == ListingKind.PRIMARY) {
            p.startAt = uint64(block.timestamp);
            p.endAt = p.startAt + p.durationSeconds;
            p.activationEventCursor = p.eventCursor;
            p.state = PositionState.ACTIVE;
        }
        p.rightsOwner = msg.sender;
        l.state = ListingState.FILLED;
        uint256 sellerBefore = paymentToken.balanceOf(l.seller);
        uint256 buyerBefore = paymentToken.balanceOf(msg.sender);
        paymentToken.safeTransferFrom(msg.sender, l.seller, l.priceAtomic);
        if (
            paymentToken.balanceOf(l.seller) != sellerBefore + l.priceAtomic
                || paymentToken.balanceOf(msg.sender) != buyerBefore - l.priceAtomic
        ) revert SettlementTransferMismatch();
        _synchronized(p.assetId);
        emit ListingFilled(l.listingId, p.positionId, msg.sender, l.seller, l.priceAtomic);
        emit RightsOwnerChanged(p.positionId, previous, msg.sender, p.eventCursor, p.startAt, p.endAt);
    }

    function checkpointPosition(uint256 id, uint32 maxEvents)
        external
        nonReentrant
        returns (uint64 cursor, bool complete)
    {
        return _checkpoint(_position(id), maxEvents);
    }

    function settlePosition(uint256 id, uint32 maxEvents) external nonReentrant {
        Position storage p = _position(id);
        _batch(maxEvents);
        if (p.state != PositionState.ACTIVE) revert InvalidPositionState(id, p.state);
        if (block.timestamp < p.endAt) revert InvalidDeadline();
        (, AssetHead memory h) = _synchronized(p.assetId);
        _coverage(p.assetId, h, p.endAt);
        _complete(p, maxEvents);
        p.state = PositionState.SETTLED;
        Listing storage l = listings[p.currentListingId];
        if (l.state == ListingState.OPEN && l.kind == ListingKind.SECONDARY) {
            l.state = ListingState.CANCELLED;
            emit ListingCancelled(l.listingId, id, msg.sender, 1);
        }
        emit PositionSettled(id, p.eventCursor);
    }

    function releasePrincipal(uint256 id, uint32 maxEvents)
        external
        nonReentrant
        returns (uint256 sharesTransferred)
    {
        Position storage p = _position(id);
        _batch(maxEvents);
        if (p.principalOwner != msg.sender) revert Unauthorized();
        if (p.state != PositionState.CANCELLED && p.state != PositionState.SETTLED) {
            revert InvalidPositionState(id, p.state);
        }
        (AssetConfig memory a, AssetHead memory h) = _synchronized(p.assetId);
        _coverage(p.assetId, h, p.state == PositionState.CANCELLED ? p.cancelledAt : p.endAt);
        _complete(p, maxEvents);
        _safeTransferAsset(a);
        _solvent(a);
        sharesTransferred = p.principalShares;
        p.principalShares = 0;
        p.state = PositionState.RELEASED;
        totalPrincipalShares[p.assetId] -= sharesTransferred;
        uint256 amount = _transferShares(a, msg.sender, sharesTransferred);
        _synchronized(p.assetId);
        _solvent(a);
        emit PrincipalReleased(id, p.assetId, msg.sender, sharesTransferred, amount);
    }

    function claimIncome(bytes32 id, uint256 shares) external nonReentrant returns (uint256 amount) {
        AssetConfig memory a = registry.getAsset(id);
        if (shares == 0) revert InvalidAmount();
        if (shares > claimShares[id][msg.sender]) {
            revert InsufficientClaimShares(claimShares[id][msg.sender], shares);
        }
        _safeTransferAsset(a);
        _solvent(a);
        claimShares[id][msg.sender] -= shares;
        totalClaimShares[id] -= shares;
        amount = _transferShares(a, msg.sender, shares);
        _safeTransferAsset(registry.getAsset(id));
        _solvent(a);
        emit IncomeClaimed(id, msg.sender, shares, amount);
    }

    function getPosition(uint256 id) external view returns (Position memory) {
        return _position(id);
    }

    function getListing(uint256 id) external view returns (Listing memory) {
        return _listing(id);
    }

    function _checkpoint(Position storage p, uint32 limit) private returns (uint64 cursor, bool complete) {
        _batch(limit);
        if (p.state == PositionState.RELEASED) return (p.eventCursor, true);
        AssetConfig memory a = registry.getAsset(p.assetId);
        if (a.safetyState != AssetSafetyState.NORMAL) revert AssetQuarantined(p.assetId, a.safetyState);
        // A stale event fingerprint may process a verified prefix, but a changed
        // transfer mechanism must not silently keep allocating that asset.
        if (
            _transferConfiguration(IAssetAdapter(a.adapter).readSnapshot(a.token))
                != transferConfigurations[p.assetId]
        ) revert UnsupportedAssetConfiguration(p.assetId);
        _solvent(a);
        uint64 target = registry.getAssetHead(p.assetId).eventCount;
        uint64 previous = p.eventCursor;
        uint64 stop = uint64(uint256(previous) + limit < target ? uint256(previous) + limit : target);
        while (p.eventCursor < stop) {
            FinalizedAssetEvent memory e = registry.getAssetEvent(p.assetId, p.eventCursor + 1);
            if (e.kind == AssetEventKind.DIVIDEND) {
                bool eligible = p.rightsOwner != address(0) && e.sequence > p.activationEventCursor
                    && e.effectiveAt >= p.startAt && e.effectiveAt < p.endAt;
                (uint256 principal, uint256 sellerIncome, uint256 buyerIncome) = IncomeMath.allocate(
                    p.principalShares, e.multiplierBefore, e.multiplierAfter, p.incomeBps, eligible
                );
                uint256 income = sellerIncome + buyerIncome;
                p.principalShares = principal;
                totalPrincipalShares[p.assetId] -= income;
                totalClaimShares[p.assetId] += income;
                claimShares[p.assetId][p.principalOwner] += sellerIncome;
                if (buyerIncome != 0) claimShares[p.assetId][p.rightsOwner] += buyerIncome;
                emit IncomeAllocated(
                    p.positionId,
                    p.assetId,
                    e.sequence,
                    p.principalOwner,
                    p.rightsOwner,
                    sellerIncome,
                    buyerIncome,
                    principal
                );
            }
            p.eventCursor = e.sequence;
        }
        cursor = p.eventCursor;
        complete = cursor == target;
        emit PositionCheckpointed(p.positionId, previous, cursor, complete);
        _solvent(a);
    }

    function _complete(Position storage p, uint32 limit) private {
        (uint64 cursor, bool complete) = _checkpoint(p, limit);
        if (!complete) {
            revert CheckpointRequired(p.positionId, cursor, registry.getAssetHead(p.assetId).eventCount);
        }
    }

    function _synchronized(bytes32 id) private view returns (AssetConfig memory a, AssetHead memory h) {
        a = registry.getAsset(id);
        h = registry.getAssetHead(id);
        if (a.safetyState != AssetSafetyState.NORMAL) revert AssetQuarantined(id, a.safetyState);
        TokenSnapshot memory current = IAssetAdapter(a.adapter).readSnapshot(a.token);
        if (keccak256(abi.encode(current)) != h.acknowledgedSnapshotHash) revert AssetNotSynchronized(id);
    }

    function _safeTransferAsset(AssetConfig memory a) private view {
        if (a.safetyState == AssetSafetyState.TRANSFER_QUARANTINED) {
            revert AssetQuarantined(a.assetId, a.safetyState);
        }
        if (
            !IAssetAdapter(a.adapter).isShareTransferSafe(a.token)
                || _transferConfiguration(IAssetAdapter(a.adapter).readSnapshot(a.token))
                    != transferConfigurations[a.assetId]
        ) revert UnsupportedAssetConfiguration(a.assetId);
    }

    function _transferShares(AssetConfig memory a, address to, uint256 shares)
        private
        returns (uint256 amount)
    {
        uint256 vaultBefore = _shares(a, address(this));
        uint256 recipientBefore = _shares(a, to);
        uint256 amountBefore = IERC20(a.token).balanceOf(to);
        if (!IShareToken(a.token).transferShares(to, shares)) revert ShareTransferMismatch();
        if (_shares(a, address(this)) + shares != vaultBefore || _shares(a, to) != recipientBefore + shares) {
            revert ShareTransferMismatch();
        }
        return IERC20(a.token).balanceOf(to) - amountBefore;
    }

    function _createListing(Position storage p, ListingKind kind, uint256 price, uint64 expiresAt)
        private
        returns (uint256 id)
    {
        if (price == 0) revert InvalidAmount();
        if (
            expiresAt < block.timestamp + MIN_LISTING_LIFETIME
                || expiresAt > block.timestamp + MAX_LISTING_LIFETIME
        ) {
            revert InvalidDeadline();
        }
        id = nextListing++;
        bytes32 hash = keccak256(
            abi.encode(
                block.chainid,
                address(this),
                id,
                p.positionId,
                kind,
                msg.sender,
                address(paymentToken),
                price,
                expiresAt,
                p.assetId,
                p.principalOwner,
                p.incomeBps,
                p.durationSeconds,
                p.startAt,
                p.endAt
            )
        );
        listings[id] = Listing(
            id,
            p.positionId,
            kind,
            msg.sender,
            address(paymentToken),
            price,
            uint64(block.timestamp),
            expiresAt,
            ListingState.OPEN,
            hash
        );
        p.currentListingId = id;
        emit ListingCreated(id, p.positionId, msg.sender, kind, price, expiresAt, hash);
    }

    function _noLiveListing(Position storage p) private view {
        Listing storage l = listings[p.currentListingId];
        if (l.state == ListingState.OPEN && block.timestamp < l.expiresAt) {
            revert ActiveListingExists(p.positionId, l.listingId);
        }
    }

    function _position(uint256 id) private view returns (Position storage p) {
        p = positions[id];
        if (p.positionId == 0) revert UnknownPosition(id);
    }

    function _listing(uint256 id) private view returns (Listing storage l) {
        l = listings[id];
        if (l.listingId == 0) revert UnknownListing(id);
    }

    function _shares(AssetConfig memory a, address who) private view returns (uint256) {
        return IAssetAdapter(a.adapter).sharesOf(a.token, who);
    }

    function _solvent(AssetConfig memory a) private view {
        if (_shares(a, address(this)) < totalPrincipalShares[a.assetId] + totalClaimShares[a.assetId]) {
            revert InsolventAsset(a.assetId);
        }
    }

    function _transferConfiguration(TokenSnapshot memory s) private pure returns (bytes32) {
        return keccak256(abi.encode(s.feePerPeriod, s.periodLength, s.tokenRuntimeCodeHash));
    }

    function _coverage(bytes32 id, AssetHead memory h, uint64 time) private pure {
        if (h.finalizedThrough < time) revert FinalityCoverageRequired(id, h.finalizedThrough, time);
    }

    function _batch(uint32 n) private pure {
        if (n == 0 || n > MAX_EVENTS_PER_CALL) revert InvalidBatchSize();
    }
}
