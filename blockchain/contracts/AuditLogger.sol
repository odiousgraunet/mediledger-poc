// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlManager.sol";

/**
 * @title AuditLogger
 * @dev Immutable append-only audit trail for medical data interactions in MediLedger
 */
contract AuditLogger {
    AccessControlManager public accessControl;
    address public recordRegistry;
    address public consentManager;

    enum ActionType {
        RECORD_REGISTERED,
        RECORD_ACCESSED,
        RECORD_VERIFIED,
        RECORD_REVOKED,
        CONSENT_REQUESTED,
        CONSENT_GRANTED,
        CONSENT_REJECTED,
        CONSENT_REVOKED,
        SECURITY_ALERT
    }

    struct AuditEntry {
        uint256 logId;
        string recordId;
        address actor;
        ActionType action;
        string detail;
        uint256 timestamp;
        bool status;
    }

    AuditEntry[] private _logs;
    mapping(string => uint256[]) private _recordToLogs;
    mapping(address => uint256[]) private _actorToLogs;

    event AuditLogged(
        uint256 indexed logId,
        string indexed recordId,
        address indexed actor,
        ActionType action,
        uint256 timestamp,
        bool status
    );

    modifier onlyAuthorizedContracts() {
        require(
            msg.sender == accessControl.admin() ||
            msg.sender == recordRegistry ||
            msg.sender == consentManager,
            "MediLedger: caller not authorized to append audit logs"
        );
        _;
    }

    constructor(address _accessControlAddress) {
        require(_accessControlAddress != address(0), "Invalid access control address");
        accessControl = AccessControlManager(_accessControlAddress);
    }

    function setAuthorizedContracts(address _recordRegistry, address _consentManager) external {
        require(msg.sender == accessControl.admin(), "MediLedger: only admin");
        recordRegistry = _recordRegistry;
        consentManager = _consentManager;
    }

    function logEvent(
        string calldata recordId,
        address actor,
        ActionType action,
        string calldata detail,
        bool status
    ) external onlyAuthorizedContracts returns (uint256) {
        uint256 logId = _logs.length;

        _logs.push(AuditEntry({
            logId: logId,
            recordId: recordId,
            actor: actor,
            action: action,
            detail: detail,
            timestamp: block.timestamp,
            status: status
        }));

        if (bytes(recordId).length > 0) {
            _recordToLogs[recordId].push(logId);
        }
        _actorToLogs[actor].push(logId);

        emit AuditLogged(logId, recordId, actor, action, block.timestamp, status);
        return logId;
    }

    function getAuditEntry(uint256 logId) external view returns (AuditEntry memory) {
        require(logId < _logs.length, "MediLedger: logId out of bounds");
        return _logs[logId];
    }

    function getLogsByRecord(string calldata recordId) external view returns (uint256[] memory) {
        return _recordToLogs[recordId];
    }

    function getLogsByActor(address actor) external view returns (uint256[] memory) {
        return _actorToLogs[actor];
    }

    function getTotalLogCount() external view returns (uint256) {
        return _logs.length;
    }

    function getRecentLogs(uint256 limit) external view returns (AuditEntry[] memory) {
        uint256 total = _logs.length;
        if (total == 0) {
            return new AuditEntry[](0);
        }

        uint256 count = limit > total ? total : limit;
        AuditEntry[] memory result = new AuditEntry[](count);

        for (uint256 i = 0; i < count; i++) {
            result[i] = _logs[total - 1 - i];
        }
        return result;
    }
}
