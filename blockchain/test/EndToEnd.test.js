const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

describe("MediLedger Multi-Role End-to-End Workflow Test", function () {
  let accessControl, auditLogger, recordRegistry, consentManager;
  let admin, hospital, lab, insurance, patient;

  // Real SHA-256 computation helper
  function computeSHA256(contentString) {
    const hashHex = crypto.createHash("sha256").update(contentString).digest("hex");
    return "0x" + hashHex;
  }

  const dischargeData = JSON.stringify({
    recordId: "REC-E2E-001",
    patientUHID: "UHID-882194",
    hospital: "Apollo Super Specialty",
    diagnosis: "Acute Myocarditis",
    totalBillINR: 84500
  });

  const labData = JSON.stringify({
    recordId: "REC-E2E-002",
    patientUHID: "UHID-882194",
    lab: "Metro PathLabs",
    test: "Troponin T hs",
    value: 0.18
  });

  const dischargeHash = computeSHA256(dischargeData);
  const labHash = computeSHA256(labData);

  before(async function () {
    [admin, hospital, lab, insurance, patient] = await ethers.getSigners();

    // 1. Deploy system contracts
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

    // 2. Authorize contracts
    await auditLogger.setAuthorizedContracts(
      await recordRegistry.getAddress(),
      await consentManager.getAddress()
    );

    // 3. Register Stakeholder Entities
    await accessControl.registerEntity(patient.address, 1, "Jane Doe", "UHID-882194");
    await accessControl.registerEntity(hospital.address, 2, "Apollo Super Specialty", "HOSP-094");
    await accessControl.registerEntity(lab.address, 3, "Metro PathLabs", "NABL-5421");
    await accessControl.registerEntity(insurance.address, 4, "Star Health Insurance", "IRDAI-881");
  });

  it("Step 1: Hospital and Lab register authentic medical records on-chain", async function () {
    // Hospital registers discharge summary
    await recordRegistry.connect(hospital).registerRecord(
      "REC-E2E-001",
      patient.address,
      dischargeHash,
      "DISCHARGE_SUMMARY",
      "storage/patient1_discharge_summary.json"
    );

    // Lab registers blood panel
    await recordRegistry.connect(lab).registerRecord(
      "REC-E2E-002",
      patient.address,
      labHash,
      "LAB_REPORT",
      "storage/patient1_blood_panel.json"
    );

    const patientRecords = await recordRegistry.getPatientRecords(patient.address);
    expect(patientRecords).to.deep.equal(["REC-E2E-001", "REC-E2E-002"]);
  });

  it("Step 2: Insurance requests consent for claim verification", async function () {
    const tx = await consentManager.connect(insurance).requestAccess(
      "REC-E2E-001",
      "Claim Adjudication for Claim ID CLM-7731"
    );
    await expect(tx).to.emit(consentManager, "AccessRequested");

    const requests = await consentManager.getPatientRequests(patient.address);
    expect(requests.length).to.equal(1);
    expect(requests[0]).to.equal(1n);
  });

  it("Step 3: Patient approves consent for 48 hours", async function () {
    const duration48Hours = 48 * 3600;
    await consentManager.connect(patient).grantConsent(1, duration48Hours);

    const hasAccess = await consentManager.hasValidConsent(insurance.address, "REC-E2E-001");
    expect(hasAccess).to.be.true;
  });

  it("Step 4: Insurance retrieves and verifies authentic document", async function () {
    // Check permission via consent contract
    const isAuthorized = await consentManager.logAccessIfAuthorized.staticCall(insurance.address, "REC-E2E-001");
    expect(isAuthorized).to.be.true;
    await consentManager.logAccessIfAuthorized(insurance.address, "REC-E2E-001");

    // Cryptographic verification against smart contract fingerprint
    const computedHash = computeSHA256(dischargeData);
    const [isAuthentic] = await recordRegistry.connect(insurance).verifyRecord.staticCall(
      "REC-E2E-001",
      computedHash
    );
    expect(isAuthentic).to.be.true;
  });

  it("Step 5: Tampered document triggers immediate fraud detection", async function () {
    // Tampered billing data
    const forgedDischargeData = JSON.stringify({
      recordId: "REC-E2E-001",
      patientUHID: "UHID-882194",
      hospital: "Apollo Super Specialty",
      diagnosis: "Acute Myocarditis",
      totalBillINR: 184500 // Inflated bill by 100,000 INR
    });

    const forgedHash = computeSHA256(forgedDischargeData);
    const [isAuthentic] = await recordRegistry.connect(insurance).verifyRecord.staticCall(
      "REC-E2E-001",
      forgedHash
    );
    expect(isAuthentic).to.be.false;
  });

  it("Step 6: Patient revokes consent and subsequent access is blocked", async function () {
    await consentManager.connect(patient).revokeConsent(1);

    const hasAccess = await consentManager.hasValidConsent(insurance.address, "REC-E2E-001");
    expect(hasAccess).to.be.false;

    const accessResult = await consentManager.logAccessIfAuthorized.staticCall(insurance.address, "REC-E2E-001");
    expect(accessResult).to.be.false;
  });

  it("Step 7: Audit trail contains complete immutable historical records", async function () {
    const totalLogs = await auditLogger.getTotalLogCount();
    expect(totalLogs).to.be.greaterThan(5n);

    const recordLogs = await auditLogger.getLogsByRecord("REC-E2E-001");
    expect(recordLogs.length).to.be.greaterThan(3);

    const recentLogs = await auditLogger.getRecentLogs(5);
    expect(recentLogs.length).to.equal(5);
  });
});
