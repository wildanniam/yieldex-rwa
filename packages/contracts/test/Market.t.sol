// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {MarketFixture} from "./helpers/MarketFixture.sol";
import {IProtocolErrors} from "../src/interfaces/IProtocolErrors.sol";
import "../src/interfaces/ProtocolTypes.sol";

contract MarketTest is MarketFixture {
    function testCompleteLifecycleResaleGrowthSplitExpiryAndOldClaims() public {
        uint256 id = active_();
        eq(usd.balanceOf(alice), 1090e6);
        eq(usd.balanceOf(bob), 910e6);
        recognize_(AssetEventKind.DIVIDEND, 102e16);
        market.checkpointPosition(id, 32);
        eq(market.getPosition(id).principalShares, 98039215686274509804);
        eq(market.claimShares(asset, bob), 980392156862745098);
        vm.prank(bob);
        uint256 secondary = market.createSecondaryListing(id, 50e6, 1300);
        buy_(secondary, carol);
        eq(market.getPosition(id).endAt, 1600);
        eq(market.getPosition(id).rightsOwner, carol);
        recognize_(AssetEventKind.DIVIDEND, 10404e14);
        market.checkpointPosition(id, 32);
        eq(market.getPosition(id).principalShares, 96116878123798539024);
        eq(market.claimShares(asset, alice), 1941560938100730488);
        eq(market.claimShares(asset, carol), 961168781237985390);
        uint256 bobTokens = token.getUnderlyingAmountByShares(market.claimShares(asset, bob));
        eq(bobTokens, 1019999999999999999);
        recognize_(AssetEventKind.SPLIT, 20808e14);
        market.checkpointPosition(id, 32);
        eq(market.claimShares(asset, bob), 980392156862745098);
        cover_(1600);
        market.settlePosition(id, 32);
        uint256 reserve = market.totalClaimShares(asset);
        vm.prank(alice);
        market.releasePrincipal(id, 32);
        eq(token.sharesOf(address(market)), reserve);
        address[3] memory owners = [alice, bob, carol];
        for (uint256 i; i < 3; i++) {
            uint256 shares = market.claimShares(asset, owners[i]);
            vm.prank(owners[i]);
            market.claimIncome(asset, shares);
        }
        eq(token.sharesOf(address(market)), 0);
        eq(market.totalClaimShares(asset), 0);
        eq(uint256(market.getPosition(id).state), uint256(PositionState.RELEASED));
        conserve_();
    }

    function testPaymentFailureRollsBackRightsAndIncomeCheckpoint() public {
        (uint256 id, uint256 listing) = offer_();
        recognize_(AssetEventKind.DIVIDEND, 102e16);
        vm.prank(bob);
        usd.approve(address(market), 0);
        BuyListingParams memory intent = intent_(listing);
        vm.prank(bob);
        vm.expectRevert();
        market.buyListing(intent);
        Position memory p = market.getPosition(id);
        eq(p.rightsOwner, address(0));
        eq(p.eventCursor, 0);
        eq(market.totalClaimShares(asset), 0);
        eq(usd.balanceOf(alice), 1000e6);
        vm.prank(bob);
        usd.approve(address(market), 90e6);
        buy_(listing, bob);
        eq(market.claimShares(asset, bob), 0);
        require(market.claimShares(asset, alice) > 0);
        conserve_();
    }

    function testTwoBuyersAndCancelRaceOnlyOneOutcome() public {
        (, uint256 listing) = offer_();
        BuyListingParams memory intent = intent_(listing);
        buy_(listing, bob);
        vm.prank(carol);
        vm.expectRevert();
        market.buyListing(intent);
        eq(usd.balanceOf(carol), 1000e6);
        vm.prank(alice);
        vm.expectRevert();
        market.cancelListing(listing);
        (, uint256 another) = offer_();
        intent = intent_(another);
        vm.prank(alice);
        market.cancelListing(another);
        vm.prank(bob);
        vm.expectRevert();
        market.buyListing(intent);
        conserve_();
    }

    function testCancelStaleThenCoverageRelease() public {
        (uint256 id, uint256 listing) = offer_();
        FinalizedAssetEvent memory e = event_(AssetEventKind.DIVIDEND, 102e16, 1010);
        vm.prank(alice);
        market.cancelListing(listing);
        eq(market.getPosition(id).cancelledAt, 1010);
        eq(token.sharesOf(address(market)), 100e18);
        vm.prank(alice);
        vm.expectRevert();
        market.releasePrincipal(id, 32);
        append_(e);
        registry.acknowledgeAssetSnapshot(asset, adapter.readSnapshot(address(token)), EVIDENCE);
        cover_(1010);
        vm.prank(alice);
        market.releasePrincipal(id, 32);
        eq(market.claimShares(asset, bob), 0);
        require(market.claimShares(asset, alice) > 0);
        conserve_();
    }

    function testExpiredListingRelistsWithoutNewDepositAndOldListingFails() public {
        (uint256 id, uint256 listing) = offer_();
        vm.warp(1300);
        vm.prank(alice);
        uint256 newListing = market.relistPrimaryPosition(id, 100e6, 1400);
        eq(token.sharesOf(address(market)), 100e18);
        require(newListing != listing);
        BuyListingParams memory stale = intent_(listing);
        vm.prank(bob);
        vm.expectRevert();
        market.buyListing(stale);
        buy_(newListing, bob);
        eq(market.getPosition(id).startAt, 1300);
        eq(market.getPosition(id).endAt, 1900);
    }

    function testSameSecondBeforeAndAfterActivationUsesCursor() public {
        (uint256 id, uint256 listing) = offer_();
        recognize_(AssetEventKind.DIVIDEND, 102e16);
        buy_(listing, bob);
        eq(market.claimShares(asset, bob), 0);
        eq(market.getPosition(id).activationEventCursor, 1);
        recognize_(AssetEventKind.DIVIDEND, 10404e14);
        market.checkpointPosition(id, 32);
        require(market.claimShares(asset, bob) > 0);
        conserve_();
    }

    function testLatePreExpiryEventAndExactEndAllocation() public {
        uint256 id = active_();
        FinalizedAssetEvent memory e = event_(AssetEventKind.DIVIDEND, 102e16, 1599);
        vm.warp(1600);
        vm.expectRevert();
        market.settlePosition(id, 32);
        append_(e);
        registry.acknowledgeAssetSnapshot(asset, adapter.readSnapshot(address(token)), EVIDENCE);
        recognize_(AssetEventKind.DIVIDEND, 10404e14);
        market.checkpointPosition(id, 32);
        eq(market.claimShares(asset, bob), 980392156862745098);
        cover_(1600);
        market.settlePosition(id, 32);
        conserve_();
    }

    function testClaimsRemainAvailableWhenStaleOrAccountingQuarantined() public {
        uint256 id = active_();
        recognize_(AssetEventKind.DIVIDEND, 102e16);
        market.checkpointPosition(id, 32);
        uint256 shares = market.claimShares(asset, bob);
        token.schedule(10404e14, 2, 1000);
        registry.setAssetSafetyState(asset, AssetSafetyState.ACCOUNTING_QUARANTINED, EVIDENCE);
        vm.prank(bob);
        market.claimIncome(asset, shares);
        eq(token.sharesOf(bob), shares);
        vm.expectRevert();
        market.checkpointPosition(id, 32);
        conserve_();
    }

    function testPauseFailurePreservesClaimAndRetryDoubleClaimFails() public {
        uint256 id = active_();
        recognize_(AssetEventKind.DIVIDEND, 102e16);
        market.checkpointPosition(id, 32);
        uint256 shares = market.claimShares(asset, bob);
        token.setPaused(true);
        vm.prank(bob);
        vm.expectRevert();
        market.claimIncome(asset, shares);
        eq(market.claimShares(asset, bob), shares);
        token.setPaused(false);
        vm.prank(bob);
        market.claimIncome(asset, shares);
        vm.prank(bob);
        vm.expectRevert();
        market.claimIncome(asset, shares);
        conserve_();
    }

    function testTransferQuarantineBlocksClaimsButCancelStillWorks() public {
        uint256 id = active_();
        recognize_(AssetEventKind.DIVIDEND, 102e16);
        market.checkpointPosition(id, 32);
        vm.prank(bob);
        uint256 secondary = market.createSecondaryListing(id, 50e6, 1300);
        registry.setAssetSafetyState(asset, AssetSafetyState.TRANSFER_QUARANTINED, EVIDENCE);
        vm.prank(bob);
        vm.expectRevert();
        market.claimIncome(asset, 1);
        vm.prank(bob);
        market.cancelListing(secondary);
        eq(uint256(market.getListing(secondary).state), uint256(ListingState.CANCELLED));
    }

    function testUnrecognizedEventBlocksDirectResaleThenPaysOldOwner() public {
        uint256 id = active_();
        vm.prank(bob);
        uint256 listing = market.createSecondaryListing(id, 50e6, 1300);
        FinalizedAssetEvent memory e = event_(AssetEventKind.DIVIDEND, 102e16, 1010);
        BuyListingParams memory old = intent_(listing);
        vm.prank(carol);
        vm.expectRevert();
        market.buyListing(old);
        append_(e);
        registry.acknowledgeAssetSnapshot(asset, adapter.readSnapshot(address(token)), EVIDENCE);
        buy_(listing, carol);
        eq(market.claimShares(asset, bob), 980392156862745098);
        eq(market.claimShares(asset, carol), 0);
        conserve_();
    }

    function testBacklogInternalRollbackAndSeparateCheckpointRecovery() public {
        (uint256 id, uint256 listing) = offer_();
        for (uint256 i; i < 33; i++) {
            recognize_(AssetEventKind.DIVIDEND, 1e18 + (i + 1) * 1e15);
        }
        BuyListingParams memory intent = intent_(listing);
        vm.prank(bob);
        vm.expectRevert();
        market.buyListing(intent);
        eq(market.getPosition(id).eventCursor, 0);
        eq(market.totalClaimShares(asset), 0);
        (, bool complete) = market.checkpointPosition(id, 32);
        require(!complete);
        eq(market.getPosition(id).eventCursor, 32);
        buy_(listing, bob);
        eq(market.getPosition(id).eventCursor, 33);
        eq(market.claimShares(asset, bob), 0);
        conserve_();
    }

    function testDonationNotIncomeAndReverseSplitNotDividend() public {
        uint256 id = active_();
        vm.prank(alice);
        token.transferShares(address(market), 10e18);
        recognize_(AssetEventKind.REVERSE_SPLIT, 5e17);
        market.checkpointPosition(id, 32);
        eq(market.totalClaimShares(asset), 0);
        eq(market.getPosition(id).principalShares, 100e18);
        eq(token.sharesOf(address(market)), 110e18);
        conserve_();
    }

    function testPrincipalOwnerBuysResaleAndCombinedClaimsNotDuplicated() public {
        uint256 id = active_();
        vm.prank(bob);
        uint256 listing = market.createSecondaryListing(id, 50e6, 1300);
        buy_(listing, alice);
        recognize_(AssetEventKind.DIVIDEND, 102e16);
        market.checkpointPosition(id, 32);
        eq(market.claimShares(asset, alice), 1960784313725490196);
        eq(market.totalClaimShares(asset), 1960784313725490196);
        conserve_();
    }

    function testInvalidIntentAndSelfPurchase() public {
        (, uint256 listing) = offer_();
        BuyListingParams memory p = intent_(listing);
        vm.prank(alice);
        vm.expectRevert(IProtocolErrors.SelfPurchase.selector);
        market.buyListing(p);
        p.expectedTermsHash = bytes32(0);
        vm.prank(bob);
        vm.expectRevert(IProtocolErrors.TermsChanged.selector);
        market.buyListing(p);
        p = intent_(listing);
        p.maxPriceAtomic = 0;
        vm.prank(bob);
        vm.expectRevert();
        market.buyListing(p);
        p = intent_(listing);
        p.deadline = 0;
        vm.prank(bob);
        vm.expectRevert(IProtocolErrors.IntentExpired.selector);
        market.buyListing(p);
        p = intent_(listing);
        p.maxEvents = 0;
        vm.prank(bob);
        vm.expectRevert(IProtocolErrors.InvalidBatchSize.selector);
        market.buyListing(p);
        p = intent_(listing);
        p.expectedAssetHeadHash = bytes32(0);
        vm.prank(bob);
        vm.expectRevert(IProtocolErrors.AssetHeadChanged.selector);
        market.buyListing(p);
    }

    function testCannotReleaseActiveOrRelistCancelledOrListUnder60Seconds() public {
        uint256 id = active_();
        vm.prank(alice);
        vm.expectRevert();
        market.releasePrincipal(id, 32);
        vm.warp(1550);
        vm.prank(bob);
        vm.expectRevert();
        market.createSecondaryListing(id, 1, 1600);
        (uint256 other, uint256 listing) = offer_();
        vm.prank(alice);
        market.cancelListing(listing);
        vm.prank(alice);
        vm.expectRevert();
        market.relistPrimaryPosition(other, 1, 1800);
    }
}
