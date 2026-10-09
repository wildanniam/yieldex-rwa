// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {MarketFixture} from "./helpers/MarketFixture.sol";
import {IProtocolErrors} from "../src/interfaces/IProtocolErrors.sol";
import "../src/interfaces/ProtocolTypes.sol";

contract QuarantineRecoveryTest is MarketFixture {
    function testTemporaryAccountingRecoveryThenSettlementPreservesClaims() public {
        _recover(AssetSafetyState.ACCOUNTING_QUARANTINED);
    }

    function testTemporaryTransferRecoveryThenSettlementPreservesClaims() public {
        _recover(AssetSafetyState.TRANSFER_QUARANTINED);
    }

    function _recover(AssetSafetyState state) private {
        uint256 id = active_();
        FinalizedAssetEvent memory e = event_(AssetEventKind.DIVIDEND, 102e16, 1010);
        registry.setAssetSafetyState(asset, state, EVIDENCE);
        vm.expectRevert();
        registry.setAssetSafetyState(asset, AssetSafetyState.NORMAL, EVIDENCE);
        append_(e);
        vm.expectRevert();
        market.checkpointPosition(id, 32);
        eq(market.totalClaimShares(asset), 0);
        registry.acknowledgeAssetSnapshot(asset, adapter.readSnapshot(address(token)), EVIDENCE);
        registry.grantRole(registry.EVENT_FINALIZER_ROLE(), bob);
        vm.prank(bob);
        vm.expectRevert(IProtocolErrors.Unauthorized.selector);
        registry.setAssetSafetyState(asset, AssetSafetyState.NORMAL, EVIDENCE);
        vm.warp(1601);
        vm.expectRevert();
        registry.advanceFinalityCoverage(asset, CoverageInput(1600, 1600, 99, EVIDENCE, EVIDENCE));
        vm.expectRevert();
        market.settlePosition(id, 32);
        token.setPaused(true);
        vm.expectRevert();
        registry.setAssetSafetyState(asset, AssetSafetyState.NORMAL, EVIDENCE);
        token.setPaused(false);
        registry.setAssetSafetyState(asset, AssetSafetyState.NORMAL, EVIDENCE);
        cover_(1601);
        market.settlePosition(id, 32);
        uint256 reserve = market.totalClaimShares(asset);
        vm.prank(alice);
        market.releasePrincipal(id, 32);
        eq(token.sharesOf(address(market)), reserve);
        eq(market.claimShares(asset, bob), 980392156862745098);
        vm.prank(bob);
        market.claimIncome(asset, 980392156862745098);
        conserve_();
    }

    function testRecoveryKeepsConfigHistoryAuthorizationAndConflictGuards() public {
        active_();
        FinalizedAssetEvent memory e = event_(AssetEventKind.DIVIDEND, 102e16, 1010);
        registry.setAssetSafetyState(asset, AssetSafetyState.ACCOUNTING_QUARANTINED, EVIDENCE);
        vm.prank(carol);
        vm.expectRevert(IProtocolErrors.Unauthorized.selector);
        append_(e);
        vm.mockCall(address(token), abi.encodeWithSignature("periodLength()"), abi.encode(uint256(42)));
        vm.expectRevert();
        append_(e);
        vm.clearMockedCalls();
        e.sequence = 2;
        vm.expectRevert(IProtocolErrors.InvalidEventSequence.selector);
        append_(e);
        e.sequence = 1;
        registry.reportFinalityConflict(asset, EVIDENCE);
        vm.expectRevert(IProtocolErrors.UnresolvedFinalityConflict.selector);
        append_(e);
        eq(registry.getAssetHead(asset).eventCount, 0);
    }

    function testQuarantinedBacklogCanBeReconciledInBoundedBatches() public {
        uint256 id = active_();
        registry.setAssetSafetyState(asset, AssetSafetyState.ACCOUNTING_QUARANTINED, EVIDENCE);
        for (uint256 i; i < 33; i++) {
            append_(event_(AssetEventKind.DIVIDEND, 1e18 + (i + 1) * 1e15, uint64(block.timestamp)));
        }
        eq(market.getPosition(id).eventCursor, 0);
        eq(market.totalClaimShares(asset), 0);
        registry.acknowledgeAssetSnapshot(asset, adapter.readSnapshot(address(token)), EVIDENCE);
        registry.setAssetSafetyState(asset, AssetSafetyState.NORMAL, EVIDENCE);
        (, bool complete) = market.checkpointPosition(id, 32);
        require(!complete);
        (, complete) = market.checkpointPosition(id, 32);
        require(complete);
        conserve_();
    }
}
