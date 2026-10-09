// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

library IncomeMath {
    function allocate(uint256 shares, uint256 beforeM, uint256 afterM, uint16 bps, bool eligible)
        internal
        pure
        returns (uint256 principal, uint256 seller, uint256 buyer)
    {
        require(beforeM > 0 && afterM > beforeM && bps > 0 && bps <= 10000, "invalid income input");
        principal = Math.mulDiv(shares, beforeM, afterM, Math.Rounding.Ceil);
        uint256 income = shares - principal;
        buyer = eligible ? Math.mulDiv(income, bps, 10000) : 0;
        seller = income - buyer;
    }
}
