// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ICorporateActionRegistry} from "./interfaces/ICorporateActionRegistry.sol";
import {IAssetAdapter} from "./interfaces/IAssetAdapter.sol";
import {IShareToken} from "./adapters/IShareToken.sol";
import "./interfaces/ProtocolTypes.sol";

contract CorporateActionRegistry is ICorporateActionRegistry, AccessControl {
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");
    bytes32 public constant EVENT_FINALIZER_ROLE = keccak256("EVENT_FINALIZER_ROLE");
    mapping(bytes32 => AssetConfig) private assets;
    mapping(bytes32 => AssetHead) private heads;
    mapping(bytes32 => mapping(uint64 => FinalizedAssetEvent)) private records;
    mapping(bytes32 => bool) private seenEvents;
    mapping(bytes32 => bytes32) private configurations;
    mapping(bytes32 => bool) public finalityConflict;

    constructor(address admin, address finalizer) {
        if (admin == address(0) || finalizer == address(0)) revert Unauthorized();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRY_ADMIN_ROLE, admin);
        _grantRole(EVENT_FINALIZER_ROLE, finalizer);
        _setRoleAdmin(REGISTRY_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(EVENT_FINALIZER_ROLE, REGISTRY_ADMIN_ROLE);
    }
    modifier authorized(bytes32 role) {
        if (!hasRole(role, msg.sender)) revert Unauthorized();
        _;
    }

    function registerAsset(address token, address adapter, bool enabled, bytes32 evidence)
        external
        authorized(REGISTRY_ADMIN_ROLE)
        returns (bytes32 id)
    {
        id = keccak256(abi.encode(block.chainid, token));
        if (
            token.code.length == 0 || adapter.code.length == 0 || assets[id].token != address(0)
                || evidence == bytes32(0)
        ) revert UnsupportedAssetConfiguration(id);
        TokenSnapshot memory s = IAssetAdapter(adapter).readSnapshot(token);
        _validConfiguration(id, s);
        if (IShareToken(token).decimals() != 18 || !IAssetAdapter(adapter).isShareTransferSafe(token)) {
            revert UnsupportedAssetConfiguration(id);
        }
        uint256 effectiveIndex = _effectiveIndex(s);
        assets[id] = AssetConfig(
            id,
            token,
            adapter,
            18,
            enabled,
            AssetSafetyState.NORMAL,
            uint64(block.timestamp),
            s.multiplier,
            s.issuerNonce,
            effectiveIndex,
            evidence
        );
        configurations[id] = _configuration(s);
        AssetHead storage h = heads[id];
        h.multiplier = s.multiplier;
        h.issuerNonce = s.issuerNonce;
        h.consumedHistoryIndex = effectiveIndex;
        h.acknowledgedSnapshotHash = keccak256(abi.encode(s));
        _rehash(id);
        emit AssetRegistered(id, token, adapter);
    }

    function setNewPositionsEnabled(bytes32 id, bool enabled) external authorized(REGISTRY_ADMIN_ROLE) {
        _asset(id).newPositionsEnabled = enabled;
        emit AssetIntakeChanged(id, enabled);
    }

    function setAssetSafetyState(bytes32 id, AssetSafetyState state, bytes32 reason) external {
        AssetConfig storage a = _asset(id);
        bool admin = hasRole(REGISTRY_ADMIN_ROLE, msg.sender);
        if (!admin && (!hasRole(EVENT_FINALIZER_ROLE, msg.sender) || uint8(state) <= uint8(a.safetyState))) {
            revert Unauthorized();
        }
        if (reason == bytes32(0)) revert InvalidEventEvidence();
        if (uint8(state) < uint8(a.safetyState)) {
            if (finalityConflict[id]) revert UnresolvedFinalityConflict();
            _requireSynchronized(id);
            if (!IAssetAdapter(a.adapter).isShareTransferSafe(a.token)) {
                revert UnsupportedAssetConfiguration(id);
            }
        }
        a.safetyState = state;
        emit AssetSafetyStateChanged(id, state, reason);
    }

    /// @notice Irreversible v1 latch for a conflicting finalized record/closed coverage.
    function reportFinalityConflict(bytes32 id, bytes32 evidence) external authorized(EVENT_FINALIZER_ROLE) {
        AssetConfig storage a = _asset(id);
        if (evidence == bytes32(0)) revert InvalidEventEvidence();
        finalityConflict[id] = true;
        if (a.safetyState == AssetSafetyState.NORMAL) {
            a.safetyState = AssetSafetyState.ACCOUNTING_QUARANTINED;
        }
        emit FinalityConflictReported(id, evidence);
        emit AssetSafetyStateChanged(id, a.safetyState, evidence);
    }

    function appendFinalizedEvents(bytes32 id, FinalizedAssetEvent[] calldata events_)
        external
        authorized(EVENT_FINALIZER_ROLE)
    {
        AssetConfig storage a = _asset(id);
        AssetHead storage h = heads[id];
        // Repair verified metadata while temporary quarantine still freezes accounting
        // and ownership changes. Only admin can resume after a complete safe head.
        // A conflicting immutable record is never recoverable through this path.
        if (finalityConflict[id]) revert UnresolvedFinalityConflict();
        if (events_.length == 0 || events_.length > MAX_EVENTS_PER_CALL) revert InvalidBatchSize();
        TokenSnapshot memory current = IAssetAdapter(a.adapter).readSnapshot(a.token);
        _validConfiguration(id, current);
        if (_configuration(current) != configurations[id]) revert UnsupportedAssetConfiguration(id);
        for (uint256 i; i < events_.length; i++) {
            FinalizedAssetEvent calldata e = events_[i];
            if (seenEvents[e.eventId]) revert DuplicateEvent(e.eventId);
            if (
                e.sequence != h.eventCount + 1 || e.historyIndex != h.consumedHistoryIndex + 1
                    || e.multiplierBefore != h.multiplier || e.issuerNonceAfter <= h.issuerNonce
            ) revert InvalidEventSequence();
            uint64 lastAt = h.eventCount == 0 ? a.baselineAt : records[id][h.eventCount].effectiveAt;
            if (e.effectiveAt <= h.finalizedThrough || e.effectiveAt < lastAt) revert RetroactiveEvent();
            if (
                e.effectiveAt > block.timestamp || e.sourceRevision == 0
                    || e.sourceOccurrenceKey == bytes32(0) || e.evidenceHash == bytes32(0)
                    || e.eventId != keccak256(abi.encode(block.chainid, a.token, e.sourceOccurrenceKey))
            ) revert InvalidEventEvidence();
            if (
                e.multiplierAfter == 0
                    || (e.kind == AssetEventKind.REVERSE_SPLIT
                            ? e.multiplierAfter >= e.multiplierBefore
                            : e.kind == AssetEventKind.NO_INCOME
                                ? e.multiplierAfter != e.multiplierBefore
                                : e.multiplierAfter <= e.multiplierBefore)
            ) revert InvalidEventEvidence();
            if (!IAssetAdapter(a.adapter).validateEffectiveEvent(a.token, e)) revert InvalidEventEvidence();
            seenEvents[e.eventId] = true;
            records[id][e.sequence] = e;
            h.eventCount = e.sequence;
            h.multiplier = e.multiplierAfter;
            h.issuerNonce = e.issuerNonceAfter;
            h.consumedHistoryIndex = e.historyIndex;
            emit AssetEventFinalized(
                id,
                e.sequence,
                e.eventId,
                e.kind,
                e.effectiveAt,
                e.multiplierBefore,
                e.multiplierAfter,
                e.issuerNonceAfter,
                e.evidenceHash
            );
        }
        _rehash(id);
    }

    function acknowledgeAssetSnapshot(bytes32 id, TokenSnapshot calldata expected, bytes32 evidence)
        external
        authorized(EVENT_FINALIZER_ROLE)
    {
        AssetConfig storage a = _asset(id);
        AssetHead storage h = heads[id];
        if (evidence == bytes32(0)) revert InvalidEventEvidence();
        if (finalityConflict[id]) revert UnresolvedFinalityConflict();
        TokenSnapshot memory live = IAssetAdapter(a.adapter).readSnapshot(a.token);
        if (keccak256(abi.encode(live)) != keccak256(abi.encode(expected))) revert AssetNotSynchronized(id);
        _validConfiguration(id, live);
        if (_configuration(live) != configurations[id]) revert UnsupportedAssetConfiguration(id);
        if (
            _effectiveIndex(live) != h.consumedHistoryIndex || live.multiplier != h.multiplier
                || live.issuerNonce != h.issuerNonce
        ) revert AssetNotSynchronized(id);
        if (
            h.eventCount > 0
                && !IAssetAdapter(a.adapter).validateEffectiveEvent(a.token, records[id][h.eventCount])
        ) revert UnresolvedFinalityConflict();
        h.acknowledgedSnapshotHash = keccak256(abi.encode(live));
        _rehash(id);
        emit AssetSnapshotAcknowledged(id, h.assetHeadHash, h.acknowledgedSnapshotHash, evidence);
    }

    function advanceFinalityCoverage(bytes32 id, CoverageInput calldata c)
        external
        authorized(EVENT_FINALIZER_ROLE)
    {
        AssetConfig storage a = _asset(id);
        AssetHead storage h = heads[id];
        if (a.safetyState != AssetSafetyState.NORMAL) revert AssetQuarantined(id, a.safetyState);
        _requireSynchronized(id);
        if (
            c.finalizedThrough < h.finalizedThrough || c.sourceBlockNumber < h.coverageSourceBlockNumber
                || c.sourceBlockTimestamp < h.coverageSourceBlockTimestamp
        ) revert CoverageRegression();
        if (
            c.finalizedThrough < a.baselineAt || c.finalizedThrough > c.sourceBlockTimestamp
                || c.sourceBlockTimestamp >= block.timestamp || c.sourceBlockNumber == 0
                || c.sourceBlockNumber >= block.number || c.sourceBlockHash == bytes32(0)
                || c.evidenceHash == bytes32(0)
        ) revert InvalidEventEvidence();
        if (
            c.sourceBlockNumber == h.coverageSourceBlockNumber
                && (c.sourceBlockHash != h.coverageSourceBlockHash
                    || c.sourceBlockTimestamp != h.coverageSourceBlockTimestamp)
        ) revert InvalidEventEvidence();
        if (
            c.finalizedThrough == h.finalizedThrough && c.sourceBlockNumber == h.coverageSourceBlockNumber
                && c.evidenceHash == h.coverageEvidenceHash
        ) return;
        h.finalizedThrough = c.finalizedThrough;
        h.coverageSourceBlockTimestamp = c.sourceBlockTimestamp;
        h.coverageSourceBlockNumber = c.sourceBlockNumber;
        h.coverageSourceBlockHash = c.sourceBlockHash;
        h.coverageEvidenceHash = c.evidenceHash;
        emit FinalityCoverageAdvanced(
            id, c.finalizedThrough, c.sourceBlockNumber, c.sourceBlockHash, c.evidenceHash
        );
    }

    function getAsset(bytes32 id) external view returns (AssetConfig memory) {
        return _asset(id);
    }

    function getAssetHead(bytes32 id) external view returns (AssetHead memory) {
        _asset(id);
        return heads[id];
    }

    function getAssetEvent(bytes32 id, uint64 sequence) external view returns (FinalizedAssetEvent memory) {
        _asset(id);
        if (sequence == 0 || sequence > heads[id].eventCount) revert InvalidEventSequence();
        return records[id][sequence];
    }

    function _asset(bytes32 id) private view returns (AssetConfig storage a) {
        a = assets[id];
        if (a.token == address(0)) revert UnknownAsset(id);
    }

    function _rehash(bytes32 id) private {
        heads[id].assetHeadHash =
            keccak256(abi.encode(id, heads[id].eventCount, heads[id].acknowledgedSnapshotHash));
    }

    function _effectiveIndex(TokenSnapshot memory s) private pure returns (uint256) {
        return s.historyLength - 1 - (s.pendingActivationAt == 0 ? 0 : 1);
    }

    function _configuration(TokenSnapshot memory s) private pure returns (bytes32) {
        return keccak256(abi.encode(s.feePerPeriod, s.periodLength, s.tokenRuntimeCodeHash));
    }

    function _validConfiguration(bytes32 id, TokenSnapshot memory s) private pure {
        if (
            s.multiplier == 0 || s.feePerPeriod != 0 || s.periodLength == 0
                || s.tokenRuntimeCodeHash == bytes32(0) || s.historyLength == 0
                || (s.pendingActivationAt != 0 && s.historyLength < 2)
        ) revert UnsupportedAssetConfiguration(id);
    }

    function _requireSynchronized(bytes32 id) private view {
        AssetConfig storage a = _asset(id);
        TokenSnapshot memory s = IAssetAdapter(a.adapter).readSnapshot(a.token);
        if (
            keccak256(abi.encode(s)) != heads[id].acknowledgedSnapshotHash
                || _effectiveIndex(s) != heads[id].consumedHistoryIndex
                || s.multiplier != heads[id].multiplier || s.issuerNonce != heads[id].issuerNonce
        ) revert AssetNotSynchronized(id);
    }
}
