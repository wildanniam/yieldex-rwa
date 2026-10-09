// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {TestBase} from "../helpers/TestBase.sol";
import {XStocksAdapter} from "../../src/adapters/XStocksAdapter.sol";
import {IShareToken} from "../../src/adapters/IShareToken.sol";
import {TokenSnapshot} from "../../src/interfaces/ProtocolTypes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IssuerControls {
    function pauser() external view returns (address);
    function setPause(bool value) external;
    function multiplierUpdater() external view returns (address);
    function updateMultiplierWithNonce(uint256 value, uint256 oldValue, uint256 nonce, uint256 at) external;
}

contract OfficialTokenForkTest is TestBase {
    address constant SPY = address(bytes20(hex"90a2a4c76b5d8c0bc892a69ea28aa775a8f2dd48"));
    address constant HOLDER = address(bytes20(hex"e7e553cd128f0011777323a0b44a7b96ea1cb540"));
    XStocksAdapter adapter;

    function setUp() public {
        vm.createSelectFork(vm.envString("ETHEREUM_RPC_URL"), 26145883);
        adapter = new XStocksAdapter();
    }

    function testRealSnapshotAndMeasuredDepositAndTransferShares() public {
        TokenSnapshot memory snap = adapter.readSnapshot(SPY);
        eq(snap.multiplier, 1005714560286254000);
        eq(snap.issuerNonce, 4);
        eq(snap.feePerPeriod, 0);
        require(adapter.isShareTransferSafe(SPY));
        uint256 balanceBefore = IShareToken(SPY).sharesOf(HOLDER);
        vm.prank(HOLDER);
        IERC20(SPY).approve(address(this), 1e18);
        IERC20(SPY).transferFrom(HOLDER, address(this), 1e18);
        uint256 received = IShareToken(SPY).sharesOf(address(this));
        eq(received, 1e36 / snap.multiplier);
        eq(balanceBefore - IShareToken(SPY).sharesOf(HOLDER), received);
        IShareToken(SPY).transferShares(bob, received);
        eq(IShareToken(SPY).sharesOf(bob), received);
        eq(IShareToken(SPY).sharesOf(address(this)), 0);
        require(
            keccak256(abi.encode(snap)) == keccak256(abi.encode(adapter.readSnapshot(SPY))),
            "real housekeeping normalization"
        );
    }

    /// @notice Synthetic issuer event on an isolated official-token fork; NOT a real corporate action.
    function testSyntheticForwardHistoryAndNormalizationOnRealImplementation() public {
        TokenSnapshot memory before = adapter.readSnapshot(SPY);
        address operator = IssuerControls(SPY).multiplierUpdater();
        vm.prank(operator);
        IssuerControls(SPY)
            .updateMultiplierWithNonce(before.multiplier + 1e16, before.multiplier, before.issuerNonce + 2, 0);
        TokenSnapshot memory afterEvent = adapter.readSnapshot(SPY);
        eq(afterEvent.historyLength, before.historyLength + 1);
        eq(afterEvent.issuerNonce, before.issuerNonce + 2);
        (uint256 oldValue, uint256 value, uint256 at) =
            IShareToken(SPY).multiplierUpdates(afterEvent.historyLength - 1);
        eq(oldValue, before.multiplier);
        eq(value, afterEvent.multiplier);
        eq(at, block.timestamp);
        vm.prank(HOLDER);
        IShareToken(SPY).transferShares(bob, 1e15);
        require(
            keccak256(abi.encode(afterEvent)) == keccak256(abi.encode(adapter.readSnapshot(SPY))),
            "synthetic housekeeping normalization"
        );
    }

    function testOtherQualifiedSnapshotsAndTransfers() public {
        address[2] memory tokens = [
            address(bytes20(hex"9d275685dc284c8eb1c79f6aba7a63dc75ec890a")),
            address(bytes20(hex"5621737f42dae558b81269fcb9e9e70c19aa6b35"))
        ];
        address[2] memory holders = [
            address(bytes20(hex"943bf64d566c32a2bcd41ac92fb63c111cc9de8f")),
            address(bytes20(hex"166fbe68274b6a47e025f4ba17388c539f1fa1d0"))
        ];
        for (uint256 i; i < 2; i++) {
            TokenSnapshot memory snap = adapter.readSnapshot(tokens[i]);
            require(adapter.isShareTransferSafe(tokens[i]));
            eq(snap.issuerNonce, 5);
            vm.prank(holders[i]);
            IERC20(tokens[i]).approve(address(this), 1e18);
            IERC20(tokens[i]).transferFrom(holders[i], address(this), 1e18);
            uint256 shares = IShareToken(tokens[i]).sharesOf(address(this));
            eq(shares, 1e36 / snap.multiplier);
            IShareToken(tokens[i]).transferShares(bob, shares);
            eq(IShareToken(tokens[i]).sharesOf(bob), shares);
        }
    }

    /// @notice Synthetic local pause and recovery, not a real issuer pause.
    function testSyntheticIssuerPauseRejectsTransferAndRecovers() public {
        address pauser = IssuerControls(SPY).pauser();
        vm.prank(pauser);
        IssuerControls(SPY).setPause(true);
        require(!adapter.isShareTransferSafe(SPY));
        vm.prank(HOLDER);
        vm.expectRevert();
        IShareToken(SPY).transferShares(bob, 1e15);
        vm.prank(pauser);
        IssuerControls(SPY).setPause(false);
        require(adapter.isShareTransferSafe(SPY));
        vm.prank(HOLDER);
        IShareToken(SPY).transferShares(bob, 1e15);
        eq(IShareToken(SPY).sharesOf(bob), 1e15);
    }
}
