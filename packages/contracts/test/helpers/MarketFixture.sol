// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {RegistryFixture} from "./RegistryFixture.sol";
import {IncomeRightsMarket} from "../../src/IncomeRightsMarket.sol";
import {DemoUSD} from "../../src/mocks/DemoUSD.sol";
import "../../src/interfaces/ProtocolTypes.sol";

abstract contract MarketFixture is RegistryFixture {
    IncomeRightsMarket internal market;
    DemoUSD internal usd;

    function setUp() public virtual override {
        super.setUp();
        usd = new DemoUSD(address(this));
        market = new IncomeRightsMarket(address(registry), address(usd));
        token.mint(alice, 1000e18);
        usd.mint(bob, 1000e6);
        usd.mint(carol, 1000e6);
        usd.mint(alice, 1000e6);
        vm.prank(alice);
        token.approve(address(market), type(uint256).max);
        vm.prank(bob);
        usd.approve(address(market), type(uint256).max);
        vm.prank(carol);
        usd.approve(address(market), type(uint256).max);
        vm.prank(alice);
        usd.approve(address(market), type(uint256).max);
    }

    function offer_() internal returns (uint256 position, uint256 listing) {
        vm.prank(alice);
        return market.createPrimaryListing(
            CreatePrimaryListingParams(asset, 100e18, 100e18, 5000, 600, 90e6, uint64(block.timestamp + 300))
        );
    }

    function intent_(uint256 id) internal view returns (BuyListingParams memory) {
        Listing memory l = market.getListing(id);
        Position memory p = market.getPosition(l.positionId);
        return BuyListingParams(
            id,
            l.termsHash,
            registry.getAssetHead(p.assetId).assetHeadHash,
            l.priceAtomic,
            uint64(block.timestamp + 100),
            32
        );
    }

    function buy_(uint256 id, address buyer) internal {
        BuyListingParams memory intent = intent_(id);
        vm.prank(buyer);
        market.buyListing(intent);
    }

    function active_() internal returns (uint256 id) {
        uint256 listing;
        (id, listing) = offer_();
        buy_(listing, bob);
    }

    function conserve_() internal view {
        uint256 claims = market.claimShares(asset, alice) + market.claimShares(asset, bob)
            + market.claimShares(asset, carol);
        eq(claims, market.totalClaimShares(asset));
        require(market.totalPrincipalShares(asset) + claims <= token.sharesOf(address(market)), "insolvent");
    }
}
