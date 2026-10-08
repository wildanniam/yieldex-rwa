// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {IIncomeRightsMarket} from "../src/interfaces/IIncomeRightsMarket.sol";
import {
    PositionState,
    ListingKind,
    ListingState,
    AssetEventKind,
    AssetSafetyState,
    BuyListingParams
} from "../src/interfaces/ProtocolTypes.sol";

/// @notice Wire compatibility tests only. No market implementation or economic safety is tested here.
contract InterfaceCompatibilityTest {
    function testPurchaseTupleSelectorMatchesSpec() public pure {
        bytes4 expected = bytes4(keccak256("buyListing((uint256,bytes32,bytes32,uint256,uint64,uint32))"));
        require(IIncomeRightsMarket.buyListing.selector == expected, "purchase tuple ABI drift");
    }

    function testStoredEnumOrdinalsMatchSpec() public pure {
        require(uint8(PositionState.OFFERED) == 0 && uint8(PositionState.RELEASED) == 4, "position ABI drift");
        require(uint8(ListingKind.PRIMARY) == 0 && uint8(ListingKind.SECONDARY) == 1, "kind ABI drift");
        require(uint8(ListingState.CANCELLED) == 2, "listing ABI drift");
        require(uint8(AssetEventKind.NO_INCOME) == 3, "event ABI drift");
        require(uint8(AssetSafetyState.TRANSFER_QUARANTINED) == 2, "safety ABI drift");
    }

    function testBuyListingTupleEncodingMatchesSpec() public pure {
        BuyListingParams memory p =
            BuyListingParams(7, bytes32(uint256(11)), bytes32(uint256(13)), 90e6, 1000, 32);
        require(
            keccak256(abi.encode(p))
                == keccak256(
                    abi.encode(
                        uint256(7),
                        bytes32(uint256(11)),
                        bytes32(uint256(13)),
                        uint256(90e6),
                        uint64(1000),
                        uint32(32)
                    )
                ),
            "purchase tuple field order drift"
        );
    }
}
