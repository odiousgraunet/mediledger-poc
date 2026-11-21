const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ConsentManager Contract Tests", function () {
  let accessControl, auditLogger, recordRegistry, consentManager;
  let admin, hospital, lab, insurance, patient, unauthorized;

  const recordId = "REC-2026-001";
  const docHash = ethers.keccak256(ethers.toUtf8Bytes("Patient 1 Medical Record"));

  beforeEach(async function () {
    [admin, hospital, lab, insurance, patient, unauthorized] = await ethers.getSigners();

    // Deploy contracts
    const AccessControl = await ethers.getContractFactory("AccessControlManager");
    accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();

    const AuditLogger = await ethers.getContractFactory("AuditLogger");
    auditLogger = await AuditLogger.deploy(await accessControl.getAddress());
    await auditLogger.waitForDeployment();

    const RecordRegistry = await ethers.getContractFactory("RecordRegistry");
    recordRegistry = await RecordRegistry.deploy(
      await accessControl.getAddress(),
      await auditLogger.getAddress()
    );
    await recordRegistry.waitForDeployment();

    const ConsentManager = await ethers.getContractFactory("ConsentManager");
    consentManager = await ConsentManager.deploy(
      await accessControl.getAddress(),
      await recordRegistry.getAddress(),
      await auditLogger.getAddress()
    );
    await consentManager.waitForDeployment();

    // Authorize in AuditLogger
    await auditLogger.setAuthorizedContracts(
      await recordRegistry.getAddress(),
      await consentManager.getAddress()
    );

    // Register entities
    await accessControl.registerEntity(patient.address, 1, "Jane Doe", "UHID-882194");
    await accessControl.registerEntity(hospital.address, 2, "Apollo Super Specialty", "HOSP-094");
    await accessControl.registerEntity(lab.address, 3, "Metro PathLabs", "NABL-5421");
    await accessControl.registerEntity(insurance.address, 4, "Star Health", "IRDAI-881");

    // Register record
    await recordRegistry.connect(hospital).registerRecord(
      recordId,
      patient.address,
      docHash,
      "DISCHARGE_SUMMARY",
      "storage/p1.json"
    );
  });

  it("Should allow insurance company to submit consent request", async function () {
    const tx = await consentManager.connect(insurance).requestAccess(
      recordId,
      "Insurance Claim Audit - Policy #POL-9921"
    );

    await expect(tx).to.emit(consentManager, "AccessRequested");

    const req = await consentManager.getConsentRequest(1);
    expect(req.recordId).to.equal(recordId);
    expect(req.patient).to.equal(patient.address);
    expect(req.requester).to.equal(insurance.address);
    expect(req.status).to.equal(1); // PENDING
  });

  it("Should allow patient to approve consent for 24 hours", async function () {
    await consentManager.connect(insurance).requestAccess(recordId, "Claim Verification");

    // 24 hours = 86400 seconds
    const duration = 86400;
    await consentManager.connect(patient).grantConsent(1, duration);

    const req = await consentManager.getConsentRequest(1);
    expect(req.status).to.equal(2); // APPROVED

    const isValid = await consentManager.hasValidConsent(insurance.address, recordId);
    expect(isValid).to.be.true;
  });

  it("Should expire consent automatically after duration passes", async function () {
    await consentManager.connect(insurance).requestAccess(recordId, "Short Consultation");

    // Valid for 1 hour (3600 seconds)
    await consentManager.connect(patient).grantConsent(1, 3600);
    expect(await consentManager.hasValidConsent(insurance.address, recordId)).to.be.true;

    // Fast forward blockchain time by 3601 seconds
    await time.increase(3601);

    expect(await consentManager.hasValidConsent(insurance.address, recordId)).to.be.false;
  });

  it("Should allow patient to immediately revoke active consent", async function () {
    await consentManager.connect(insurance).requestAccess(recordId, "Claim Verification");
    await consentManager.connect(patient).grantConsent(1, 86400);

    expect(await consentManager.hasValidConsent(insurance.address, recordId)).to.be.true;

    // Revoke
    await consentManager.connect(patient).revokeConsent(1);

    const req = await consentManager.getConsentRequest(1);
    expect(req.status).to.equal(4); // REVOKED
    expect(await consentManager.hasValidConsent(insurance.address, recordId)).to.be.false;
  });

  it("Should allow patient to reject a pending request", async function () {
    await consentManager.connect(insurance).requestAccess(recordId, "Claim Verification");
    await consentManager.connect(patient).rejectConsent(1);

    const req = await consentManager.getConsentRequest(1);
    expect(req.status).to.equal(3); // REJECTED
    expect(await consentManager.hasValidConsent(insurance.address, recordId)).to.be.false;
  });

  it("Should prevent non-owners from granting or revoking consent", async function () {
    await consentManager.connect(insurance).requestAccess(recordId, "Claim Verification");

    await expect(
      consentManager.connect(unauthorized).grantConsent(1, 3600)
    ).to.be.revertedWith("MediLedger: caller is not the record owner");
  });
});
