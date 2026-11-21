// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlManager.sol";
import "./RecordRegistry.sol";
import "./AuditLogger.sol";

/**
 * @title ConsentManager
 * @dev Manages patient-controlled, granular, time-bound consent for medical records
 */
contract ConsentManager {
    AccessControlManager public accessControl;
    RecordRegistry public recordRegistry;
    AuditLogger public auditLogger;

    enum ConsentStatus {
        NONE,
        PENDING,
        APPROVED,
        REJECTED,
        REVOKED,
        EXPIRED
    }

    struct ConsentRequest {
        uint256 requestId;
        string recordId;
        address patient;
        address requester;
        string purpose;
        uint256 requestedAt;
        uint256 approvedAt;
        uint256 validUntil;
        ConsentStatus status;
    }

    // Auto-incrementing requestId counter
    uint256 private _nextRequestId = 1;

    // requestId => ConsentRequest
    mapping(uint256 => ConsentRequest) private _requests;

    // patient => list of requestIds
    mapping(address => uint256[]) private _patientRequests;

    // requester => list of requestIds
    mapping(address => uint256[]) private _requesterRequests;

    // recordId => list of requestIds
    mapping(string => uint256[]) private _recordRequests;

    // keccak256(recordId, requester) => latest requestId
    mapping(bytes32 => uint256) private _latestRequestKey;

    event AccessRequested(
        uint256 indexed requestId,
        string indexed recordId,
        address indexed requester,
        address patient,
        string purpose,
        uint256 requestedAt
    );

    event ConsentGranted(
        uint256 indexed requestId,
        string indexed recordId,
        address indexed patient,
        address requester,
        uint256 validUntil,
        uint256 timestamp
    );

    event ConsentRejected(
        uint256 indexed requestId,
        string indexed recordId,
        address indexed patient,
        address requester,
        uint256 timestamp
    );

    event ConsentRevoked(
        uint256 indexed requestId,
        string indexed recordId,
        address indexed patient,
        address requester,
        uint256 timestamp
    );

    event RecordAccessedWithConsent(
        uint256 indexed requestId,
        string indexed recordId,
        address indexed requester,
        uint256 timestamp
    );

    constructor(
        address _accessControlAddress,
        address _recordRegistryAddress,
        address _auditLoggerAddress
    ) {
        require(_accessControlAddress != address(0), "Invalid access control address");
        require(_recordRegistryAddress != address(0), "Invalid record registry address");
        require(_auditLoggerAddress != address(0), "Invalid audit logger address");

        accessControl = AccessControlManager(_accessControlAddress);
        recordRegistry = RecordRegistry(_recordRegistryAddress);
        auditLogger = AuditLogger(_auditLoggerAddress);
    }

    function requestAccess(
        string calldata recordId,
        string calldata purpose
    ) external returns (uint256) {
        require(bytes(recordId).length > 0, "MediLedger: invalid recordId");
        require(bytes(purpose).length > 0, "MediLedger: access purpose required");

        // Verify caller is an authorized organization
        require(
            accessControl.isHospital(msg.sender) ||
            accessControl.isLab(msg.sender) ||
            accessControl.isInsurance(msg.sender) ||
            msg.sender == accessControl.admin(),
            "MediLedger: caller not authorized to request patient consent"
        );

        // Fetch record details to verify record exists and identify patient
        (
            ,
            address patient,
            ,
            ,
            ,
            ,
            ,
            bool isActive
        ) = recordRegistry.getRecord(recordId);

        require(isActive, "MediLedger: target record is inactive");
        require(patient != address(0), "MediLedger: record has no owner");
        require(patient != msg.sender, "MediLedger: patient cannot request consent from themselves");

        uint256 requestId = _nextRequestId++;

        _requests[requestId] = ConsentRequest({
            requestId: requestId,
            recordId: recordId,
            patient: patient,
            requester: msg.sender,
            purpose: purpose,
            requestedAt: block.timestamp,
            approvedAt: 0,
            validUntil: 0,
            status: ConsentStatus.PENDING
        });

        _patientRequests[patient].push(requestId);
        _requesterRequests[msg.sender].push(requestId);
        _recordRequests[recordId].push(requestId);

        bytes32 key = keccak256(abi.encodePacked(recordId, msg.sender));
        _latestRequestKey[key] = requestId;

        emit AccessRequested(requestId, recordId, msg.sender, patient, purpose, block.timestamp);

        auditLogger.logEvent(
            recordId,
            msg.sender,
            AuditLogger.ActionType.CONSENT_REQUESTED,
            string(abi.encodePacked("Requested for: ", purpose)),
            true
        );

        return requestId;
    }

    function grantConsent(uint256 requestId, uint256 durationInSeconds) external {
        ConsentRequest storage req = _requests[requestId];
        require(req.requestId > 0, "MediLedger: request not found");
        require(msg.sender == req.patient, "MediLedger: caller is not the record owner");
        require(req.status == ConsentStatus.PENDING, "MediLedger: request not in pending state");
        require(durationInSeconds > 0, "MediLedger: validity duration must be > 0");

        uint256 expiration = block.timestamp + durationInSeconds;

        req.status = ConsentStatus.APPROVED;
        req.approvedAt = block.timestamp;
        req.validUntil = expiration;

        emit ConsentGranted(requestId, req.recordId, msg.sender, req.requester, expiration, block.timestamp);

        auditLogger.logEvent(
            req.recordId,
            msg.sender,
            AuditLogger.ActionType.CONSENT_GRANTED,
            string(abi.encodePacked("Valid for seconds: ", _uintToString(durationInSeconds))),
            true
        );
    }

    function rejectConsent(uint256 requestId) external {
        ConsentRequest storage req = _requests[requestId];
        require(req.requestId > 0, "MediLedger: request not found");
        require(msg.sender == req.patient, "MediLedger: caller is not the record owner");
        require(req.status == ConsentStatus.PENDING, "MediLedger: request not in pending state");

        req.status = ConsentStatus.REJECTED;

        emit ConsentRejected(requestId, req.recordId, msg.sender, req.requester, block.timestamp);

        auditLogger.logEvent(
            req.recordId,
            msg.sender,
            AuditLogger.ActionType.CONSENT_REJECTED,
            "Consent request declined by patient",
            true
        );
    }

    function revokeConsent(uint256 requestId) external {
        ConsentRequest storage req = _requests[requestId];
        require(req.requestId > 0, "MediLedger: request not found");
        require(
            msg.sender == req.patient || msg.sender == accessControl.admin(),
            "MediLedger: only patient or admin can revoke active consent"
        );
        require(req.status == ConsentStatus.APPROVED, "MediLedger: request is not in active approved state");

        req.status = ConsentStatus.REVOKED;

        emit ConsentRevoked(requestId, req.recordId, req.patient, req.requester, block.timestamp);

        auditLogger.logEvent(
            req.recordId,
            msg.sender,
            AuditLogger.ActionType.CONSENT_REVOKED,
            "Immediate consent revocation executed by patient",
            true
        );
    }

    function hasValidConsent(address requester, string calldata recordId) public view returns (bool) {
        bytes32 key = keccak256(abi.encodePacked(recordId, requester));
        uint256 reqId = _latestRequestKey[key];
        if (reqId == 0) {
            return false;
        }

        ConsentRequest memory req = _requests[reqId];

        if (req.status == ConsentStatus.APPROVED && block.timestamp <= req.validUntil) {
            return true;
        }

        return false;
    }

    function logAccessIfAuthorized(address requester, string calldata recordId) external returns (bool) {
        bool authorized = hasValidConsent(requester, recordId);
        bytes32 key = keccak256(abi.encodePacked(recordId, requester));
        uint256 reqId = _latestRequestKey[key];

        if (authorized) {
            emit RecordAccessedWithConsent(reqId, recordId, requester, block.timestamp);
            auditLogger.logEvent(
                recordId,
                requester,
                AuditLogger.ActionType.RECORD_ACCESSED,
                "Authorized off-chain record retrieval",
                true
            );
            return true;
        } else {
            auditLogger.logEvent(
                recordId,
                requester,
                AuditLogger.ActionType.SECURITY_ALERT,
                "Unauthorized record access attempt rejected",
                false
            );
            return false;
        }
    }

    function getConsentRequest(uint256 requestId) external view returns (ConsentRequest memory) {
        require(requestId > 0 && requestId < _nextRequestId, "MediLedger: request does not exist");
        ConsentRequest memory req = _requests[requestId];

        // Evaluate dynamic expiration if still marked APPROVED but past timestamp
        if (req.status == ConsentStatus.APPROVED && block.timestamp > req.validUntil) {
            req.status = ConsentStatus.EXPIRED;
        }

        return req;
    }

    function getPatientRequests(address patient) external view returns (uint256[] memory) {
        return _patientRequests[patient];
    }

    function getRequesterRequests(address requester) external view returns (uint256[] memory) {
        return _requesterRequests[requester];
    }

    function getRecordRequests(string calldata recordId) external view returns (uint256[] memory) {
        return _recordRequests[recordId];
    }

    function getTotalRequestCount() external view returns (uint256) {
        return _nextRequestId - 1;
    }

    function _uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 digits;
        uint256 temp = v;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (v != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(v % 10)));
            v /= 10;
        }
        return string(buffer);
    }
}
