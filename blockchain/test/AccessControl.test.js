const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AccessControlManager Contract Tests", function () {
  let accessControl;
  let admin, hospital, lab, insurance, patient, unauthorized;

  const ROLE_PATIENT = 1;
  const ROLE_HOSPITAL = 2;
  const ROLE_LAB = 3;
  const ROLE_INSURANCE = 4;

  beforeEach(async function () {
    [admin, hospital, lab, insurance, patient, unauthorized] = await ethers.getSigners();

    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    accessControl = await AccessControlManager.deploy();
    await accessControl.waitForDeployment();
  });

  it("Should set the deployer as initial admin", async function () {
    expect(await accessControl.admin()).to.equal(admin.address);
  });

  it("Should allow admin to register all 4 stakeholder roles", async function () {
    // Register Patient
    await accessControl.registerEntity(patient.address, ROLE_PATIENT, "Jane Doe", "UHID-882194");
    expect(await accessControl.isPatient(patient.address)).to.be.true;

    // Register Hospital
    await accessControl.registerEntity(hospital.address, ROLE_HOSPITAL, "Apollo Super Specialty", "HOSP-094");
    expect(await accessControl.isHospital(hospital.address)).to.be.true;

    // Register Diagnostic Lab
    await accessControl.registerEntity(lab.address, ROLE_LAB, "Metro PathLabs", "NABL-5421");
    expect(await accessControl.isLab(lab.address)).to.be.true;

    // Register Insurance Company
    await accessControl.registerEntity(insurance.address, ROLE_INSURANCE, "Star Health Insurance", "IRDAI-881");
    expect(await accessControl.isInsurance(insurance.address)).to.be.true;
  });

  it("Should prevent non-admin from registering entities", async function () {
    await expect(
      accessControl.connect(unauthorized).registerEntity(
        unauthorized.address,
        ROLE_PATIENT,
        "Malicious User",
        "FAKE-001"
      )
    ).to.be.revertedWith("MediLedger: caller is not the admin");
  });

  it("Should allow admin to deactivate and reactivate an entity", async function () {
    await accessControl.registerEntity(hospital.address, ROLE_HOSPITAL, "City Clinic", "HOSP-999");
    expect(await accessControl.isHospital(hospital.address)).to.be.true;

    // Deactivate
    await accessControl.setEntityStatus(hospital.address, false);
    expect(await accessControl.isHospital(hospital.address)).to.be.false;

    // Reactivate
    await accessControl.setEntityStatus(hospital.address, true);
    expect(await accessControl.isHospital(hospital.address)).to.be.true;
  });

  it("Should allow admin transfer", async function () {
    await accessControl.transferAdmin(unauthorized.address);
    expect(await accessControl.admin()).to.equal(unauthorized.address);
  });
});
