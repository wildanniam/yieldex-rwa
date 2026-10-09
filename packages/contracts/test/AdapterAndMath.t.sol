// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {TestBase} from "./helpers/TestBase.sol";
import {DemoShareToken} from "../src/mocks/DemoShareToken.sol";
import {DemoUSD} from "../src/mocks/DemoUSD.sol";
import {XStocksAdapter} from "../src/adapters/XStocksAdapter.sol";
import {TokenSnapshot, FinalizedAssetEvent, AssetEventKind} from "../src/interfaces/ProtocolTypes.sol";
import {IncomeMath} from "../src/libraries/IncomeMath.sol";

contract AdapterAndMathTest is TestBase {
    DemoShareToken t;
    XStocksAdapter adapter;

    function setUp() public {
        vm.warp(1000);
        t = new DemoShareToken("Simulated SPY", "demoSPY", address(this));
        adapter = new XStocksAdapter();
        t.mint(alice, 100e18);
    }

    function testThreeIndependentConfigurationsAndUSD() public {
        DemoShareToken a = new DemoShareToken("Simulated Apple", "demoAAPL", address(this));
        DemoShareToken m = new DemoShareToken("Simulated Microsoft", "demoMSFT", address(this));
        a.mint(bob, 10e18);
        m.mint(carol, 20e18);
        t.schedule(2e18, 1, 1000);
        eq(t.balanceOf(alice), 200e18);
        eq(a.balanceOf(bob), 10e18);
        eq(m.balanceOf(carol), 20e18);
        DemoUSD usd = new DemoUSD(address(this));
        usd.mint(bob, 90e6);
        eq(usd.decimals(), 6);
        eq(usd.balanceOf(bob), 90e6);
        vm.prank(bob);
        vm.expectRevert();
        usd.mint(bob, 1);
    }

    function testDepositMeasuresActualSharesAndExactShareTransfer() public {
        t.schedule(102e16, 1, 1000);
        vm.prank(alice);
        t.approve(address(this), 10e18);
        uint256 expected = uint256(10e18) * 1e18 / 102e16;
        t.transferFrom(alice, address(this), 10e18);
        eq(t.sharesOf(address(this)), expected);
        t.transferShares(bob, expected);
        eq(t.sharesOf(bob), expected);
        eq(t.sharesOf(address(this)), 0);
    }

    function testFutureOverrideAndSnapshotHousekeeping() public {
        t.schedule(102e16, 1, 1100);
        TokenSnapshot memory first = adapter.readSnapshot(address(t));
        eq(first.multiplier, 1e18);
        eq(first.pendingActivationAt, 1100);
        t.schedule(104e16, 3, 1200);
        eq(t.multiplierUpdatesLength(), 2);
        vm.warp(1100);
        eq(t.balanceOf(alice), 100e18);
        vm.warp(1200);
        TokenSnapshot memory beforeTransfer = adapter.readSnapshot(address(t));
        eq(beforeTransfer.pendingActivationAt, 0);
        eq(beforeTransfer.multiplier, 104e16);
        eq(beforeTransfer.issuerNonce, 3);
        vm.prank(alice);
        t.transferShares(bob, 1e18);
        require(
            keccak256(abi.encode(beforeTransfer)) == keccak256(abi.encode(adapter.readSnapshot(address(t)))),
            "housekeeping fingerprint changed"
        );
        require(
            keccak256(abi.encode(first)) != keccak256(abi.encode(beforeTransfer)),
            "pending activation undetected"
        );
    }

    function testSplitReverseAndNoIncomeRetainShares() public {
        t.schedule(2e18, 1, 1000);
        eq(t.sharesOf(alice), 100e18);
        eq(t.balanceOf(alice), 200e18);
        t.schedule(5e17, 2, 1000);
        eq(t.sharesOf(alice), 100e18);
        eq(t.balanceOf(alice), 50e18);
        t.schedule(5e17, 4, 1000);
        eq(adapter.readSnapshot(address(t)).issuerNonce, 4);
    }

    function testHistoryValidationRejectsPendingAndWrongEvidence() public {
        t.schedule(102e16, 1, 1100);
        FinalizedAssetEvent memory e = FinalizedAssetEvent(
            bytes32(0), 1, AssetEventKind.DIVIDEND, 1100, 1e18, 102e16, 1, 1, 1, bytes32(0), bytes32(0)
        );
        require(!adapter.validateEffectiveEvent(address(t), e));
        vm.warp(1100);
        require(adapter.validateEffectiveEvent(address(t), e));
        e.multiplierAfter = 103e16;
        require(!adapter.validateEffectiveEvent(address(t), e));
        e.historyIndex = 0;
        require(!adapter.validateEffectiveEvent(address(t), e));
    }

    function testPauseAndUnauthorizedOperator() public {
        vm.prank(bob);
        vm.expectRevert();
        t.schedule(2e18, 1, 1000);
        vm.prank(bob);
        vm.expectRevert();
        t.mint(bob, 1);
        t.setPaused(true);
        require(!adapter.isShareTransferSafe(address(t)));
        vm.prank(alice);
        vm.expectRevert();
        t.transferShares(bob, 1);
        eq(t.sharesOf(alice), 100e18);
        t.setPaused(false);
        require(adapter.isShareTransferSafe(address(t)));
    }

    function testNormativeTwoDividendAndRoundingFixture() public pure {
        (uint256 p, uint256 a, uint256 b) = IncomeMath.allocate(100e18, 1e18, 102e16, 5000, true);
        eq(p, 98039215686274509804);
        eq(a, 980392156862745098);
        eq(b, a);
        (uint256 p2, uint256 a2, uint256 c) = IncomeMath.allocate(p, 102e16, 10404e14, 5000, true);
        eq(p2, 96116878123798539024);
        eq(a + a2, 1941560938100730488);
        eq(c, 961168781237985390);
        eq(p2 + a + a2 + b + c, 100e18);
        (p, a, b) = IncomeMath.allocate(3, 100, 200, 5000, true);
        eq(p, 2);
        eq(a, 1);
        eq(b, 0);
        (p, a, b) = IncomeMath.allocate(1, 100, 200, 10000, true);
        eq(p, 1);
        eq(a + b, 0);
    }

    function testFuzzIndependentIntegerOracle(
        uint128 shares,
        uint64 oldM,
        uint64 delta,
        uint16 rawBps,
        bool eligible
    ) public pure {
        uint256 beforeM = uint256(oldM) + 1;
        uint256 afterM = beforeM + uint256(delta) + 1;
        uint16 bps = uint16(uint256(rawBps) % 10000 + 1);
        (uint256 p, uint256 seller, uint256 buyer) =
            IncomeMath.allocate(shares, beforeM, afterM, bps, eligible);
        uint256 oracle = (uint256(shares) * beforeM + afterM - 1) / afterM;
        eq(p, oracle);
        eq(p + seller + buyer, shares);
        eq(buyer, eligible ? (uint256(shares) - oracle) * bps / 10000 : 0);
    }

    function testFullWidthMulDivDoesNotOverflowIntermediate() public pure {
        uint256 max = type(uint256).max;
        (uint256 p, uint256 a, uint256 b) = IncomeMath.allocate(max, max - 1, max, 10000, true);
        eq(p, max - 1);
        eq(a, 0);
        eq(b, 1);
    }
}
