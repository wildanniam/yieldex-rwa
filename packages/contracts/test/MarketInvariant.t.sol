// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {MarketFixture} from "./helpers/MarketFixture.sol";
import "../src/interfaces/ProtocolTypes.sol";

contract MarketHandler is MarketFixture {
    uint256 public id;
    uint256 public dividendCalls;
    uint256 public resaleCalls;
    uint256 public claimCalls;

    constructor() {
        setUp();
        id = active_();
    }

    function actionDividend(uint16 raw) external {
        Position memory p = market.getPosition(id);
        if (p.state == PositionState.RELEASED) return;
        uint256 m = registry.getAssetHead(asset).multiplier;
        recognize_(AssetEventKind.DIVIDEND, m + uint256(raw % 1000 + 1) * 1e12);
        dividendCalls++;
    }

    function actionCheckpoint() external {
        market.checkpointPosition(id, 32);
    }

    function actionClaim(uint8 who, uint256 fraction) external {
        address owner = who % 3 == 0 ? alice : who % 3 == 1 ? bob : carol;
        uint256 shares = market.claimShares(asset, owner);
        if (shares == 0) return;
        uint256 amount = shares / (fraction % 10 + 1);
        if (amount == 0) return;
        vm.prank(owner);
        market.claimIncome(asset, amount);
        claimCalls++;
    }

    function actionResale() external {
        Position memory p = market.getPosition(id);
        if (p.state != PositionState.ACTIVE || block.timestamp + 60 >= p.endAt) return;
        market.checkpointPosition(id, 32); // bounded independent keeper call, never hidden inside a reverted purchase.
        address buyer = p.rightsOwner == bob ? carol : bob;
        if (usd.balanceOf(buyer) < 1e6) return;
        vm.prank(p.rightsOwner);
        uint256 listing = market.createSecondaryListing(id, 1e6, uint64(block.timestamp + 60));
        buy_(listing, buyer);
        resaleCalls++;
    }

    function actionAdvance(uint16 delta) external {
        vm.warp(block.timestamp + uint256(delta % 100));
    }

    function actionSettleAndRelease() external {
        Position memory p = market.getPosition(id);
        if (p.state != PositionState.ACTIVE || block.timestamp < p.endAt) return;
        market.checkpointPosition(id, 32);
        cover_(uint64(block.timestamp));
        market.settlePosition(id, 32);
        vm.prank(alice);
        market.releasePrincipal(id, 32);
    }

    function assertConservation() external view {
        conserve_();
        eq(market.totalPrincipalShares(asset), market.getPosition(id).principalShares);
        eq(
            token.sharesOf(address(market)) + token.sharesOf(alice) + token.sharesOf(bob)
                + token.sharesOf(carol),
            1000e18
        );
        eq(market.getPosition(id).endAt, 1600);
        eq(market.getPosition(id).principalOwner, alice);
        eq(usd.balanceOf(alice) + usd.balanceOf(bob) + usd.balanceOf(carol), 3000e6);
    }
}

contract MarketInvariantTest {
    MarketHandler private handler;

    struct FuzzSelector {
        address addr;
        bytes4[] selectors;
    }

    function setUp() public {
        handler = new MarketHandler();
    }

    function targetContracts() external view returns (address[] memory targets) {
        targets = new address[](1);
        targets[0] = address(handler);
    }

    function targetSelectors() external view returns (FuzzSelector[] memory targets) {
        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = handler.actionDividend.selector;
        selectors[1] = handler.actionCheckpoint.selector;
        selectors[2] = handler.actionClaim.selector;
        selectors[3] = handler.actionResale.selector;
        selectors[4] = handler.actionAdvance.selector;
        selectors[5] = handler.actionSettleAndRelease.selector;
        targets = new FuzzSelector[](1);
        targets[0] = FuzzSelector(address(handler), selectors);
    }

    function invariantConservesSharesPaymentsAndImmutableTerms() public view {
        handler.assertConservation();
    }
}
