// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {IAssetAdapter} from "../interfaces/IAssetAdapter.sol";
import {TokenSnapshot, FinalizedAssetEvent} from "../interfaces/ProtocolTypes.sol";
import {IShareToken} from "./IShareToken.sol";

/// @notice View-only zero-fee mechanism adapter; corporate classification remains trusted metadata.
contract XStocksAdapter is IAssetAdapter {
    function readSnapshot(address token) public view returns (TokenSnapshot memory s) {
        IShareToken t = IShareToken(token);
        s.feePerPeriod = t.feePerPeriod();
        s.periodLength = t.periodLength();
        if (t.decimals() != 18 || s.feePerPeriod != 0 || s.periodLength == 0) {
            revert UnsupportedAssetConfiguration(bytes32(0));
        }
        (s.multiplier,, s.issuerNonce) = t.getCurrentMultiplier();
        if (s.multiplier == 0) revert UnsupportedAssetConfiguration(bytes32(0));
        uint256 at = t.newMultiplierActivationTime();
        if (at > block.timestamp) {
            if (at > type(uint64).max) revert InvalidEventEvidence();
            s.pendingActivationAt = uint64(at);
            s.pendingMultiplier = t.newMultiplier();
            s.pendingIssuerNonce = t.newMultiplierNonce();
            if (s.pendingMultiplier == 0 || s.pendingIssuerNonce <= s.issuerNonce) {
                revert InvalidEventEvidence();
            }
        }
        s.historyLength = t.multiplierUpdatesLength();
        if (s.historyLength == 0) revert InvalidEventEvidence();
        (uint256 beforeM, uint256 afterM, uint256 time) = t.multiplierUpdates(s.historyLength - 1);
        if (beforeM == 0 || afterM == 0 || time > type(uint64).max) revert InvalidEventEvidence();
        if (s.pendingActivationAt != 0) {
            if (time != at || afterM != s.pendingMultiplier || beforeM != s.multiplier || s.historyLength < 2)
            {
                revert InvalidEventEvidence();
            }
        } else if (time > block.timestamp) {
            revert InvalidEventEvidence();
        }
        s.latestHistoryEntryHash = keccak256(abi.encode(beforeM, afterM, time));
        s.tokenRuntimeCodeHash = token.codehash;
    }

    function sharesOf(address token, address account) external view returns (uint256) {
        return IShareToken(token).sharesOf(account);
    }

    function tokenAmountForShares(address token, uint256 shares) external view returns (uint256) {
        return IShareToken(token).getUnderlyingAmountByShares(shares);
    }

    function validateEffectiveEvent(address token, FinalizedAssetEvent calldata item)
        external
        view
        returns (bool)
    {
        IShareToken t = IShareToken(token);
        if (item.historyIndex == 0 || item.historyIndex >= t.multiplierUpdatesLength()) return false;
        (uint256 beforeM, uint256 afterM, uint256 at) = t.multiplierUpdates(item.historyIndex);
        return at <= block.timestamp && at == item.effectiveAt && beforeM == item.multiplierBefore
            && afterM == item.multiplierAfter;
    }

    function isShareTransferSafe(address token) external view returns (bool) {
        try this.readSnapshot(token) returns (TokenSnapshot memory) {
            try IShareToken(token).isPaused() returns (bool p) {
                return !p;
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    }
}
