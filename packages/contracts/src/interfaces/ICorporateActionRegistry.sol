// SPDX-License-Identifier: MIT
// GENERATED from docs/spec/contract-interface.md; run pnpm generate.
// Interface-only: no deployed implementation or economic guarantees.
pragma solidity 0.8.34;

import "./ProtocolTypes.sol";
import {IProtocolErrors} from "./IProtocolErrors.sol";

interface ICorporateActionRegistry is IProtocolErrors {
    function registerAsset(
        address token,
        address adapter,
        bool newPositionsEnabled,
        bytes32 initialImplementationEvidenceHash
    ) external returns (bytes32 assetId);
    function setNewPositionsEnabled(bytes32 assetId, bool enabled) external;
    function setAssetSafetyState(bytes32 assetId, AssetSafetyState state, bytes32 reasonHash) external;
    function appendFinalizedEvents(bytes32 assetId, FinalizedAssetEvent[] calldata events) external;
    function acknowledgeAssetSnapshot(
        bytes32 assetId,
        TokenSnapshot calldata expectedSnapshot,
        bytes32 reconciliationEvidenceHash
    ) external;
    function advanceFinalityCoverage(bytes32 assetId, CoverageInput calldata coverage) external;
    function getAsset(bytes32 assetId) external view returns (AssetConfig memory);
    function getAssetHead(bytes32 assetId) external view returns (AssetHead memory);
    function getAssetEvent(bytes32 assetId, uint64 sequence)
        external
        view
        returns (FinalizedAssetEvent memory);
    event AssetRegistered(bytes32 indexed assetId, address indexed token, address adapter);
    event AssetIntakeChanged(bytes32 indexed assetId, bool enabled);
    event AssetSafetyStateChanged(bytes32 indexed assetId, AssetSafetyState state, bytes32 reasonHash);
    event AssetEventFinalized(
        bytes32 indexed assetId,
        uint64 indexed sequence,
        bytes32 indexed eventId,
        AssetEventKind kind,
        uint64 effectiveAt,
        uint256 multiplierBefore,
        uint256 multiplierAfter,
        uint256 issuerNonceAfter,
        bytes32 evidenceHash
    );
    event AssetSnapshotAcknowledged(
        bytes32 indexed assetId,
        bytes32 assetHeadHash,
        bytes32 snapshotHash,
        bytes32 reconciliationEvidenceHash
    );
    event FinalityCoverageAdvanced(
        bytes32 indexed assetId,
        uint64 finalizedThrough,
        uint256 sourceBlockNumber,
        bytes32 sourceBlockHash,
        bytes32 evidenceHash
    );
}
