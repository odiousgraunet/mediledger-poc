const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RecordRegistry Contract Tests", function () {
  let accessControl, auditLogger, recordRegistry;
  let admin, hospital, lab, insurance, patient, attacker;

  const sampleRecordId1 = "REC-2026-001";
  const sampleHash1 = ethers.keccak256(ethers.toUtf8Bytes("Sample Discharge Summary Content Patient 1"));
  const sampleDocType1 = "DISCHARGE_SUMMARY";
  const sampleURI1 = "storage/patient1_discharge.json";

  beforeEach(async function () {
    [admin, hospital, lab, insurance, patient, attacker] = await ethers.getSigners();

    // Deploy AccessControl
    const AccessControl = await ethers.getContractFactory("AccessControlManager");
    accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();

    // Deploy AuditLogger
    const AuditLogger = await ethers.getContractFactory("AuditLogger");
    auditLogger = await AuditLogger.deploy(await accessControl.getAddress());
    await auditLogger.waitForDeployment();

    // Deploy RecordRegistry
    const RecordRegistry = await ethers.getContractFactory("RecordRegistry");
    recordRegistry = await RecordRegistry.deploy(
      await accessControl.getAddress(),
      await auditLogger.getAddress()
    );
    await recordRegistry.waitForDeployment();

    // Authorize in AuditLogger
    await auditLogger.setAuthorizedContracts(
      await recordRegistry.getAddress(),
      ethers.ZeroAddress
    );

    // Register entities
    await accessControl.registerEntity(patient.address, 1, "Jane Doe", "UHID-882194");
    await accessControl.registerEntity(hospital.address, 2, "Apollo Super Specialty", "HOSP-094");
    await accessControl.registerEntity(lab.address, 3, "Metro PathLabs", "NABL-5421");
    await accessControl.registerEntity(insurance.address, 4, "Star Health", "IRDAI-881");
  });

  it("Should allow authorized hospital to register patient record fingerprint", async function () {
    const tx = await recordRegistry.connect(hospital).registerRecord(
      sampleRecordId1,
      patient.address,
      sampleHash1,
      sampleDocType1,
      sampleURI1
    );

    await expect(tx)
      .to.emit(recordRegistry, "RecordRegistered")
      .withArgs(
        sampleRecordId1,
        patient.address,
        hospital.address,
        sampleHash1,
        sampleDocType1,
        sampleURI1,
        await ethers.provider.getBlock("latest").then(b => b.timestamp)
      );

    const record = await recordRegistry.getRecord(sampleRecordId1);
    expect(record[0]).to.equal(sampleRecordId1);
    expect(record.patient).to.equal(patient.address);
    expect(record.issuer).to.equal(hospital.address);
    expect(record.documentHash).to.equal(sampleHash1);
    expect(record.isActive).to.be.true;
  });

  it("Should prevent unauthorized attacker from registering records", async function () {
    await expect(
      recordRegistry.connect(attacker).registerRecord(
        "REC-HACK-001",
        patient.address,
        sampleHash1,
        "FORGED_RECORD",
        "storage/fake.json"
      )
    ).to.be.revertedWith("MediLedger: caller is not an authorized healthcare provider or lab");
  });

  it("Should correctly verify authentic record and detect tampered record", async function () {
    // Register authentic record
    await recordRegistry.connect(hospital).registerRecord(
      sampleRecordId1,
      patient.address,
      sampleHash1,
      sampleDocType1,
      sampleURI1
    );

    // 1. Verify with EXACT authentic hash
    const [isAuthentic] = await recordRegistry.connect(insurance).verifyRecord.staticCall(
      sampleRecordId1,
      sampleHash1
    );
    expect(isAuthentic).to.be.true;

    // 2. Verify with TAMPERED hash
    const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("TAMPERED DATA - BILLING INFLATED BY 500%"));
    const [isTamperedAuthentic] = await recordRegistry.connect(insurance).verifyRecord.staticCall(
      sampleRecordId1,
      tamperedHash
    );
    expect(isTamperedAuthentic).to.be.false;
  });

  it("Should allow patient to revoke their record", async function () {
    await recordRegistry.connect(hospital).registerRecord(
      sampleRecordId1,
      patient.address,
      sampleHash1,
      sampleDocType1,
      sampleURI1
    );

    await recordRegistry.connect(patient).revokeRecord(sampleRecordId1);
    const record = await recordRegistry.getRecord(sampleRecordId1);
    expect(record.isActive).to.be.false;

    // Verification must fail when record is revoked
    const [isAuthentic] = await recordRegistry.connect(insurance).verifyRecord.staticCall(
      sampleRecordId1,
      sampleHash1
    );
    expect(isAuthentic).to.be.false;
  });

  it("Should return list of records by patient and issuer", async function () {
    await recordRegistry.connect(hospital).registerRecord(
      sampleRecordId1,
      patient.address,
      sampleHash1,
      sampleDocType1,
      sampleURI1
    );

    const patientRecords = await recordRegistry.getPatientRecords(patient.address);
    expect(patientRecords.length).to.equal(1);
    expect(patientRecords[0]).to.equal(sampleRecordId1);

    const issuerRecords = await recordRegistry.getIssuerRecords(hospital.address);
    expect(issuerRecords.length).to.equal(1);
    expect(issuerRecords[0]).to.equal(sampleRecordId1);
  });
});
