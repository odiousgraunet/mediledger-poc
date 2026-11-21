// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControlManager.sol";
import "./AuditLogger.sol";

/**
 * @title RecordRegistry
 * @dev On-chain registry for cryptographic SHA-256 fingerprints of medical records
 * Off-chain records remain in secure storage while on-chain hashes guarantee integrity and non-repudiation.
 */
contract RecordRegistry {
    AccessControlManager public accessControl;
    AuditLogger public auditLogger;

    struct MedicalRecord {
        string recordId;
        address patient;
        address issuer;
        bytes32 documentHash;     // SHA-256 cryptographic digest
        string docType;           // DISCHARGE_SUMMARY, LAB_REPORT, MRI_SCAN, etc.
        string offchainURI;       // Secure storage reference
        uint256 createdAt;
        bool isActive;
    }

    // recordId => MedicalRecord
    mapping(string => MedicalRecord) private _records;
    // patient address => list of recordIds
    mapping(address => string[]) private _patientRecords;
    // issuer address => list of recordIds
    mapping(address => string[]) private _issuerRecords;
    // documentHash => recordId (ensures uniqueness and reverse lookup)
    mapping(bytes32 => string) private _hashToRecordId;

    string[] private _allRecordIds;

    event RecordRegistered(
        string indexed recordId,
        address indexed patient,
        address indexed issuer,
        bytes32 documentHash,
        string docType,
        string offchainURI,
        uint256 timestamp
    );

    event RecordVerified(
        string indexed recordId,
        address indexed verifier,
        bool isAuthentic,
        bytes32 expectedHash,
        bytes32 providedHash,
        uint256 timestamp
    );

    event RecordRevoked(
        string indexed recordId,
        address indexed revokedBy,
        uint256 timestamp
    );

    modifier onlyAuthorizedIssuer() {
        require(
            accessControl.isHospital(msg.sender) ||
            accessControl.isLab(msg.sender) ||
            msg.sender == accessControl.admin(),
            "MediLedger: caller is not an authorized healthcare provider or lab"
        );
        _;
    }

    constructor(address _accessControlAddress, address _auditLoggerAddress) {
        require(_accessControlAddress != address(0), "Invalid access control address");
        require(_auditLoggerAddress != address(0), "Invalid audit logger address");
        accessControl = AccessControlManager(_accessControlAddress);
        auditLogger = AuditLogger(_auditLoggerAddress);
    }

    function registerRecord(
        string calldata recordId,
        address patient,
        bytes32 documentHash,
        string calldata docType,
        string calldata offchainURI
    ) external onlyAuthorizedIssuer {
        require(bytes(recordId).length > 0, "MediLedger: recordId cannot be empty");
        require(patient != address(0), "MediLedger: invalid patient address");
        require(documentHash != bytes32(0), "MediLedger: documentHash cannot be zero");
        require(_records[recordId].createdAt == 0, "MediLedger: recordId already exists");
        require(bytes(_hashToRecordId[documentHash]).length == 0, "MediLedger: document hash already registered");

        _records[recordId] = MedicalRecord({
            recordId: recordId,
            patient: patient,
            issuer: msg.sender,
            documentHash: documentHash,
            docType: docType,
            offchainURI: offchainURI,
            createdAt: block.timestamp,
            isActive: true
        });

        _patientRecords[patient].push(recordId);
        _issuerRecords[msg.sender].push(recordId);
        _hashToRecordId[documentHash] = recordId;
        _allRecordIds.push(recordId);

        emit RecordRegistered(
            recordId,
            patient,
            msg.sender,
            documentHash,
            docType,
            offchainURI,
            block.timestamp
        );

        auditLogger.logEvent(
            recordId,
            msg.sender,
            AuditLogger.ActionType.RECORD_REGISTERED,
            string(abi.encodePacked("Registered docType: ", docType)),
            true
        );
    }

    function verifyRecord(string calldata recordId, bytes32 computedHash)
        external
        returns (
            bool isAuthentic,
            uint256 createdAt,
            address issuer,
            address patient,
            string memory docType
        )
    {
        MedicalRecord memory rec = _records[recordId];
        require(rec.createdAt > 0, "MediLedger: record not found");

        bool authentic = (rec.documentHash == computedHash && rec.isActive);

        emit RecordVerified(
            recordId,
            msg.sender,
            authentic,
            rec.documentHash,
            computedHash,
            block.timestamp
        );

        auditLogger.logEvent(
            recordId,
            msg.sender,
            AuditLogger.ActionType.RECORD_VERIFIED,
            authentic ? "Integrity Verified: Hash Match" : "Integrity Failure: Hash Mismatch",
            authentic
        );

        return (authentic, rec.createdAt, rec.issuer, rec.patient, rec.docType);
    }

    function getRecord(string calldata recordId)
        external
        view
        returns (
            string memory recordIdOut,
            address patient,
            address issuer,
            bytes32 documentHash,
            string memory docType,
            string memory offchainURI,
            uint256 createdAt,
            bool isActive
        )
    {
        MedicalRecord memory rec = _records[recordId];
        require(rec.createdAt > 0, "MediLedger: record does not exist");
        return (
            rec.recordId,
            rec.patient,
            rec.issuer,
            rec.documentHash,
            rec.docType,
            rec.offchainURI,
            rec.createdAt,
            rec.isActive
        );
    }

    function revokeRecord(string calldata recordId) external {
        MedicalRecord storage rec = _records[recordId];
        require(rec.createdAt > 0, "MediLedger: record does not exist");
        require(
            msg.sender == rec.patient ||
            msg.sender == rec.issuer ||
            msg.sender == accessControl.admin(),
            "MediLedger: unauthorized to revoke record"
        );
        require(rec.isActive, "MediLedger: record already revoked");

        rec.isActive = false;

        emit RecordRevoked(recordId, msg.sender, block.timestamp);

        auditLogger.logEvent(
            recordId,
            msg.sender,
            AuditLogger.ActionType.RECORD_REVOKED,
            "Record deactivated by authorized entity",
            true
        );
    }

    function getPatientRecords(address patient) external view returns (string[] memory) {
        return _patientRecords[patient];
    }

    function getIssuerRecords(address issuer) external view returns (string[] memory) {
        return _issuerRecords[issuer];
    }

    function getRecordByHash(bytes32 hash) external view returns (string memory) {
        return _hashToRecordId[hash];
    }

    function getTotalRecordCount() external view returns (uint256) {
        return _allRecordIds.length;
    }

    function getAllRecordIds() external view returns (string[] memory) {
        return _allRecordIds;
    }
}
