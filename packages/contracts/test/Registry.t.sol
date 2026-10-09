// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {RegistryFixture} from "./helpers/RegistryFixture.sol";
import {CorporateActionRegistry} from "../src/CorporateActionRegistry.sol";
import {IProtocolErrors} from "../src/interfaces/IProtocolErrors.sol";
import "../src/interfaces/ProtocolTypes.sol";

contract RegistryTest is RegistryFixture {
    function testIdentityBaselineAndDuplicate() public {
        require(asset == keccak256(abi.encode(block.chainid, address(token))));
        eq(registry.getAsset(asset).baselineMultiplier, 1e18);
        vm.expectRevert();
        registry.registerAsset(address(token), address(adapter), true, EVIDENCE);
    }

    function testUnauthorizedAndFinalizerCannotLowerOrEnable() public {
        vm.prank(bob);
        vm.expectRevert(IProtocolErrors.Unauthorized.selector);
        registry.setNewPositionsEnabled(asset, false);
        registry.grantRole(registry.EVENT_FINALIZER_ROLE(), bob);
        vm.prank(bob);
        registry.setAssetSafetyState(asset, AssetSafetyState.ACCOUNTING_QUARANTINED, EVIDENCE);
        vm.prank(bob);
        vm.expectRevert(IProtocolErrors.Unauthorized.selector);
        registry.setAssetSafetyState(asset, AssetSafetyState.NORMAL, EVIDENCE);
        vm.prank(bob);
        vm.expectRevert(IProtocolErrors.Unauthorized.selector);
        registry.setNewPositionsEnabled(asset, true);
        registry.setAssetSafetyState(asset, AssetSafetyState.NORMAL, EVIDENCE);
    }

    function testEventAppendAckAndDuplicate() public {
        FinalizedAssetEvent memory e = event_(AssetEventKind.DIVIDEND, 102e16, 1010);
        TokenSnapshot memory current = adapter.readSnapshot(address(token));
        vm.expectRevert();
        registry.acknowledgeAssetSnapshot(asset, current, EVIDENCE);
        append_(e);
        eq(registry.getAssetHead(asset).eventCount, 1);
        registry.acknowledgeAssetSnapshot(asset, adapter.readSnapshot(address(token)), EVIDENCE);
        vm.expectRevert();
        append_(e);
        eq(registry.getAssetEvent(asset, 1).multiplierAfter, 102e16);
    }

    function testBadSequenceKindEvidenceAndHistoryDoNotConsume() public {
        FinalizedAssetEvent memory e = event_(AssetEventKind.DIVIDEND, 102e16, 1010);
        e.sequence = 2;
        vm.expectRevert();
        append_(e);
        e.sequence = 1;
        e.kind = AssetEventKind.REVERSE_SPLIT;
        vm.expectRevert();
        append_(e);
        e.kind = AssetEventKind.DIVIDEND;
        e.historyIndex = 2;
        vm.expectRevert();
        append_(e);
        e.historyIndex = 1;
        e.sourceRevision = 0;
        vm.expectRevert();
        append_(e);
        e.sourceRevision = 1;
        e.effectiveAt = 1011;
        vm.expectRevert();
        append_(e);
        e.effectiveAt = 1010;
        eq(registry.getAssetHead(asset).eventCount, 0);
        append_(e);
        eq(registry.getAssetHead(asset).eventCount, 1);
    }

    function testNonceGapAllowedHistoryGapRejected() public {
        token.schedule(102e16, 7, 1000);
        bytes32 occurrence = keccak256("nonce gap");
        FinalizedAssetEvent memory e = FinalizedAssetEvent(
            keccak256(abi.encode(block.chainid, address(token), occurrence)),
            1,
            AssetEventKind.DIVIDEND,
            1000,
            1e18,
            102e16,
            7,
            1,
            1,
            occurrence,
            EVIDENCE
        );
        append_(e);
        registry.acknowledgeAssetSnapshot(asset, adapter.readSnapshot(address(token)), EVIDENCE);
        eq(registry.getAssetHead(asset).issuerNonce, 7);
    }

    function testPendingAcknowledgedButActivationNeedsEvent() public {
        token.schedule(102e16, 1, 1100);
        registry.acknowledgeAssetSnapshot(asset, adapter.readSnapshot(address(token)), EVIDENCE);
        vm.warp(1100);
        TokenSnapshot memory current = adapter.readSnapshot(address(token));
        vm.expectRevert();
        registry.acknowledgeAssetSnapshot(asset, current, EVIDENCE);
        vm.warp(1101);
        vm.expectRevert();
        registry.advanceFinalityCoverage(asset, CoverageInput(1100, 1100, 99, EVIDENCE, EVIDENCE));
    }

    function testCoverageNoFutureNoRegressionAndNoLateInsertion() public {
        cover_(1010);
        bytes32 head = registry.getAssetHead(asset).assetHeadHash;
        vm.expectRevert();
        registry.advanceFinalityCoverage(asset, CoverageInput(1009, 1010, 100, EVIDENCE, EVIDENCE));
        vm.expectRevert();
        registry.advanceFinalityCoverage(asset, CoverageInput(1011, 1011, 100, EVIDENCE, EVIDENCE));
        require(head == registry.getAssetHead(asset).assetHeadHash);
        // Synthetic clock rewind only to prove the direct closed-coverage guard.
        vm.warp(1010);
        FinalizedAssetEvent memory e = event_(AssetEventKind.DIVIDEND, 102e16, 1010);
        vm.expectRevert(IProtocolErrors.RetroactiveEvent.selector);
        append_(e);
    }

    function testFinalConflictCannotBeClearedByAdmin() public {
        registry.reportFinalityConflict(asset, EVIDENCE);
        require(registry.finalityConflict(asset));
        vm.expectRevert(IProtocolErrors.UnresolvedFinalityConflict.selector);
        registry.setAssetSafetyState(asset, AssetSafetyState.NORMAL, EVIDENCE);
        TokenSnapshot memory snap = adapter.readSnapshot(address(token));
        vm.expectRevert(IProtocolErrors.UnresolvedFinalityConflict.selector);
        registry.acknowledgeAssetSnapshot(asset, snap, EVIDENCE);
    }

    function testBatchBoundsAndAtomicFailure() public {
        FinalizedAssetEvent memory e = event_(AssetEventKind.DIVIDEND, 102e16, 1010);
        FinalizedAssetEvent[] memory items = new FinalizedAssetEvent[](33);
        vm.expectRevert(IProtocolErrors.InvalidBatchSize.selector);
        registry.appendFinalizedEvents(asset, items);
        items = new FinalizedAssetEvent[](2);
        items[0] = e;
        items[1] = e;
        vm.expectRevert();
        registry.appendFinalizedEvents(asset, items);
        eq(registry.getAssetHead(asset).eventCount, 0);
        append_(e);
        eq(registry.getAssetHead(asset).eventCount, 1);
    }
}
