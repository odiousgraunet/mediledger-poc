// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AccessControlManager
 * @dev Manages role-based access control (RBAC) and entity registrations for MediLedger
 * Roles:
 * 1: PATIENT
 * 2: HOSPITAL
 * 3: DIAGNOSTIC_LAB
 * 4: INSURANCE_COMPANY
 */
contract AccessControlManager {
    address public admin;

    enum RoleType {
        NONE,
        PATIENT,
        HOSPITAL,
        DIAGNOSTIC_LAB,
        INSURANCE_COMPANY
    }

    struct Entity {
        address wallet;
        RoleType roleType;
        string name;
        string registrationIdentifier; // License / NABL / Ayushman ID / UHID
        bool isActive;
        uint256 registeredAt;
    }

    mapping(address => Entity) private _entities;
    address[] private _registeredAddresses;

    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event EntityRegistered(
        address indexed wallet,
        RoleType indexed roleType,
        string name,
        string registrationIdentifier,
        uint256 timestamp
    );
    event EntityStatusUpdated(address indexed wallet, bool isActive);

    modifier onlyAdmin() {
        require(msg.sender == admin, "MediLedger: caller is not the admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "MediLedger: invalid new admin");
        address old = admin;
        admin = newAdmin;
        emit AdminTransferred(old, newAdmin);
    }

    function registerEntity(
        address wallet,
        uint8 roleNumber,
        string calldata name,
        string calldata identifier
    ) external onlyAdmin {
        require(wallet != address(0), "MediLedger: invalid wallet address");
        require(roleNumber >= 1 && roleNumber <= 4, "MediLedger: invalid role type");
        require(bytes(name).length > 0, "MediLedger: name cannot be empty");

        RoleType role = RoleType(roleNumber);

        if (_entities[wallet].wallet == address(0)) {
            _registeredAddresses.push(wallet);
        }

        _entities[wallet] = Entity({
            wallet: wallet,
            roleType: role,
            name: name,
            registrationIdentifier: identifier,
            isActive: true,
            registeredAt: block.timestamp
        });

        emit EntityRegistered(wallet, role, name, identifier, block.timestamp);
    }

    function setEntityStatus(address wallet, bool isActive) external onlyAdmin {
        require(_entities[wallet].wallet != address(0), "MediLedger: entity not found");
        _entities[wallet].isActive = isActive;
        emit EntityStatusUpdated(wallet, isActive);
    }

    function getEntity(address wallet)
        external
        view
        returns (
            RoleType roleType,
            string memory name,
            string memory registrationIdentifier,
            bool isActive,
            uint256 registeredAt
        )
    {
        Entity memory e = _entities[wallet];
        return (e.roleType, e.name, e.registrationIdentifier, e.isActive, e.registeredAt);
    }

    function hasRole(address wallet, uint8 roleNumber) external view returns (bool) {
        Entity memory e = _entities[wallet];
        return (e.isActive && uint8(e.roleType) == roleNumber);
    }

    function isHospital(address wallet) external view returns (bool) {
        Entity memory e = _entities[wallet];
        return (e.isActive && e.roleType == RoleType.HOSPITAL);
    }

    function isLab(address wallet) external view returns (bool) {
        Entity memory e = _entities[wallet];
        return (e.isActive && e.roleType == RoleType.DIAGNOSTIC_LAB);
    }

    function isInsurance(address wallet) external view returns (bool) {
        Entity memory e = _entities[wallet];
        return (e.isActive && e.roleType == RoleType.INSURANCE_COMPANY);
    }

    function isPatient(address wallet) external view returns (bool) {
        Entity memory e = _entities[wallet];
        return (e.isActive && e.roleType == RoleType.PATIENT);
    }

    function getRegisteredAddresses() external view returns (address[] memory) {
        return _registeredAddresses;
    }
}
