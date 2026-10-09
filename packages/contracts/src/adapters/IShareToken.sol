// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

/// @notice Supported observable subset of Backed's zero-fee EVM share token.
interface IShareToken {
    function decimals() external view returns (uint8);
    function isPaused() external view returns (bool);
    function feePerPeriod() external view returns (uint256);
    function periodLength() external view returns (uint256);
    function getCurrentMultiplier() external view returns (uint256, uint256, uint256);
    function newMultiplier() external view returns (uint256);
    function newMultiplierNonce() external view returns (uint256);
    function newMultiplierActivationTime() external view returns (uint256);
    function multiplierUpdatesLength() external view returns (uint256);
    function multiplierUpdates(uint256 index)
        external
        view
        returns (uint256 beforeValue, uint256 afterValue, uint256 at);
    function sharesOf(address account) external view returns (uint256);
    function getUnderlyingAmountByShares(uint256 shares) external view returns (uint256);
    function transferShares(address to, uint256 shares) external returns (bool);
}
