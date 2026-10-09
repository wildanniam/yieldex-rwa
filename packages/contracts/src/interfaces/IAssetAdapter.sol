// SPDX-License-Identifier: MIT
// GENERATED from docs/spec/contract-interface.md; run pnpm generate.
// Interface-only: no deployed implementation or economic guarantees.
pragma solidity 0.8.34;

import "./ProtocolTypes.sol";
import {IProtocolErrors} from "./IProtocolErrors.sol";

interface IAssetAdapter is IProtocolErrors {
    function readSnapshot(address token) external view returns (TokenSnapshot memory);
    function sharesOf(address token, address account) external view returns (uint256);
    function tokenAmountForShares(address token, uint256 shares) external view returns (uint256);
    function validateEffectiveEvent(address token, FinalizedAssetEvent calldata item)
        external
        view
        returns (bool);
    function isShareTransferSafe(address token) external view returns (bool);
}
