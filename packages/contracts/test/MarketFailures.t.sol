// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {MarketFixture} from "./helpers/MarketFixture.sol";
import {DemoShareToken} from "../src/mocks/DemoShareToken.sol";
import {IncomeRightsMarket} from "../src/IncomeRightsMarket.sol";
import {IProtocolErrors} from "../src/interfaces/IProtocolErrors.sol";
import "../src/interfaces/ProtocolTypes.sol";

/// @notice Deliberately malicious transfer behavior, only for fault injection.
contract FaultShareToken is DemoShareToken {
    uint8 public fault;
    address public target;
    bool public callbackBlocked;
    constructor() DemoShareToken("Fault injection only", "demoFault", msg.sender) {}

    function setFault(uint8 mode, address market) external onlyOwner {
        fault = mode;
        target = market;
    }

    function transferShares(address to, uint256 shares) public override returns (bool) {
        if (fault == 1) return true; // lies about successful movement
        if (fault == 2) {
            (bool success, bytes memory result) =
                target.call(abi.encodeCall(IncomeRightsMarket.checkpointPosition, (1, 32)));
            callbackBlocked = !success && result.length >= 4
                && bytes4(result) == bytes4(keccak256("ReentrancyGuardReentrantCall()"));
            require(callbackBlocked, "reentrant mutation succeeded");
        }
        return super.transferShares(to, shares);
    }
}

contract MarketFailuresTest is MarketFixture {
    function testUnsupportedAndInvalidCreateInputsRollbackDeposit() public {
        CreatePrimaryListingParams memory p =
            CreatePrimaryListingParams(asset, 100e18, 100e18, 5000, 600, 90e6, 1300);
        p.incomeBps = 0;
        vm.prank(alice);
        vm.expectRevert(IProtocolErrors.InvalidIncomeBps.selector);
        market.createPrimaryListing(p);
        p.incomeBps = 10001;
        vm.prank(alice);
        vm.expectRevert();
        market.createPrimaryListing(p);
        p.incomeBps = 5000;
        p.durationSeconds = 59;
        vm.prank(alice);
        vm.expectRevert();
        market.createPrimaryListing(p);
        p.durationSeconds = 600;
        p.minReceivedShares = 101e18;
        vm.prank(alice);
        vm.expectRevert();
        market.createPrimaryListing(p);
        p.minReceivedShares = 100e18;
        p.listingExpiresAt = 1059;
        vm.prank(alice);
        vm.expectRevert();
        market.createPrimaryListing(p);
        p.listingExpiresAt = 1300;
        p.assetId = bytes32(uint256(1));
        vm.prank(alice);
        vm.expectRevert();
        market.createPrimaryListing(p);
        eq(token.sharesOf(alice), 1000e18);
        eq(token.sharesOf(address(market)), 0);
        registry.setNewPositionsEnabled(asset, false);
        vm.prank(alice);
        vm.expectRevert();
        p.assetId = asset;
        market.createPrimaryListing(p);
    }

    function testIsolatedAssetsAndReentrantAndLyingTransferRecovery() public {
        uint256 first = active_();
        recognize_(AssetEventKind.DIVIDEND, 102e16);
        market.checkpointPosition(first, 32);
        bytes32 original = asset;
        DemoShareToken originalToken = token;
        FaultShareToken faultToken = new FaultShareToken();
        token = faultToken;
        asset = registry.registerAsset(address(token), address(adapter), true, EVIDENCE);
        token.mint(alice, 100e18);
        vm.prank(alice);
        token.approve(address(market), type(uint256).max);
        uint256 second = active_();
        recognize_(AssetEventKind.DIVIDEND, 102e16);
        market.checkpointPosition(second, 32);
        uint256 shares = market.claimShares(asset, bob);
        faultToken.setFault(1, address(market));
        vm.prank(bob);
        vm.expectRevert(IProtocolErrors.ShareTransferMismatch.selector);
        market.claimIncome(asset, shares);
        eq(market.claimShares(asset, bob), shares);
        eq(token.sharesOf(address(market)), 100e18);
        faultToken.setFault(2, address(market));
        vm.prank(bob);
        market.claimIncome(asset, shares);
        require(faultToken.callbackBlocked());
        registry.setAssetSafetyState(asset, AssetSafetyState.TRANSFER_QUARANTINED, EVIDENCE);
        uint256 oldClaim = market.claimShares(original, bob);
        vm.prank(bob);
        market.claimIncome(original, oldClaim);
        eq(originalToken.sharesOf(bob), oldClaim);
    }

    function testCheckpoint32EventGasAndContractSize() public {
        uint256 id = active_();
        for (uint256 i; i < 32; i++) {
            recognize_(AssetEventKind.DIVIDEND, 1e18 + (i + 1) * 1e15);
        }
        uint256 beforeGas = gasleft();
        (, bool complete) = market.checkpointPosition(id, 32);
        uint256 used = beforeGas - gasleft();
        require(complete && used < 8_000_000, "checkpoint exceeds gas budget");
        require(address(market).code.length < 24576 && address(registry).code.length < 24576, "EIP170 limit");
        conserve_();
    }

    function testUnsupportedFeeAndPeriodChangeBlockClaimsWithoutLosingLiability() public {
        uint256 id = active_();
        recognize_(AssetEventKind.DIVIDEND, 102e16);
        market.checkpointPosition(id, 32);
        uint256 shares = market.claimShares(asset, bob);
        vm.mockCall(address(token), abi.encodeWithSignature("feePerPeriod()"), abi.encode(uint256(1)));
        vm.expectRevert();
        market.checkpointPosition(id, 32);
        vm.prank(bob);
        vm.expectRevert();
        market.claimIncome(asset, shares);
        eq(market.claimShares(asset, bob), shares);
        vm.clearMockedCalls();
        vm.mockCall(address(token), abi.encodeWithSignature("periodLength()"), abi.encode(uint256(42)));
        vm.prank(bob);
        vm.expectRevert();
        market.claimIncome(asset, shares);
        eq(market.claimShares(asset, bob), shares);
        vm.clearMockedCalls();
        vm.prank(bob);
        market.claimIncome(asset, shares);
        eq(market.claimShares(asset, bob), 0);
        conserve_();
    }
}
