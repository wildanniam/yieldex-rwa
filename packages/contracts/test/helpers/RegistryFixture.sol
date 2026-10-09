// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {TestBase} from "./TestBase.sol";
import {DemoShareToken} from "../../src/mocks/DemoShareToken.sol";
import {XStocksAdapter} from "../../src/adapters/XStocksAdapter.sol";
import {CorporateActionRegistry} from "../../src/CorporateActionRegistry.sol";
import "../../src/interfaces/ProtocolTypes.sol";

abstract contract RegistryFixture is TestBase {
    DemoShareToken internal token;
    XStocksAdapter internal adapter;
    CorporateActionRegistry internal registry;
    bytes32 internal asset;
    bytes32 internal constant EVIDENCE = keccak256("demo evidence");

    function setUp() public virtual {
        vm.warp(1000);
        vm.roll(100);
        token = new DemoShareToken("Simulated SPY", "demoSPY", address(this));
        adapter = new XStocksAdapter();
        registry = new CorporateActionRegistry(address(this), address(this));
        asset = registry.registerAsset(address(token), address(adapter), true, EVIDENCE);
    }

    function event_(AssetEventKind kind, uint256 multiplier, uint64 effectiveAt)
        internal
        returns (FinalizedAssetEvent memory e)
    {
        AssetHead memory h = registry.getAssetHead(asset);
        token.schedule(multiplier, h.issuerNonce + 1, effectiveAt);
        vm.warp(effectiveAt);
        bytes32 occurrence = keccak256(abi.encode("demo", h.eventCount + 1));
        e = FinalizedAssetEvent(
            keccak256(abi.encode(block.chainid, address(token), occurrence)),
            h.eventCount + 1,
            kind,
            effectiveAt,
            h.multiplier,
            multiplier,
            h.issuerNonce + 1,
            h.consumedHistoryIndex + 1,
            1,
            occurrence,
            EVIDENCE
        );
    }

    function append_(FinalizedAssetEvent memory e) internal {
        FinalizedAssetEvent[] memory items = new FinalizedAssetEvent[](1);
        items[0] = e;
        registry.appendFinalizedEvents(asset, items);
    }

    function recognize_(AssetEventKind kind, uint256 multiplier) internal {
        append_(event_(kind, multiplier, uint64(block.timestamp)));
        registry.acknowledgeAssetSnapshot(asset, adapter.readSnapshot(address(token)), EVIDENCE);
    }

    function cover_(uint64 time) internal {
        vm.warp(uint256(time) + 1);
        vm.roll(block.number + 1);
        registry.advanceFinalityCoverage(
            asset, CoverageInput(time, time, block.number - 1, keccak256(abi.encode(time)), EVIDENCE)
        );
    }
}
