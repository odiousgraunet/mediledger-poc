const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function computeFileSHA256(filePath) {
  const content = fs.readFileSync(filePath);
  return "0x" + crypto.createHash("sha256").update(content).digest("hex");
}

async function main() {
  console.log("=================================================");
  console.log("      Seeding MediLedger Initial Test Data        ");
  console.log("=================================================");

  const deployedPath = path.join(__dirname, "..", "deployedAddresses.json");
  if (!fs.existsSync(deployedPath)) {
    throw new Error("deployedAddresses.json not found. Run deploy script first!");
  }
  const deployment = JSON.parse(fs.readFileSync(deployedPath, "utf8"));

  const signers = await hre.ethers.getSigners();
  const admin = signers[0];
  const hospital = signers[1];
  const lab = signers[2];
  const insurance = signers[3];
  const patient1 = signers[4];
  const patient2 = signers[5];

  console.log("Signer Accounts mapped:");
  console.log("  Admin:      ", admin.address);
  console.log("  Hospital:   ", hospital.address);
  console.log("  Lab:        ", lab.address);
  console.log("  Insurance:  ", insurance.address);
  console.log("  Patient 1:  ", patient1.address);
  console.log("  Patient 2:  ", patient2.address);

  // Attach contracts
  const AccessControl = await hre.ethers.getContractAt("AccessControlManager", deployment.contracts.AccessControlManager);
  const RecordRegistry = await hre.ethers.getContractAt("RecordRegistry", deployment.contracts.RecordRegistry);
  const ConsentManager = await hre.ethers.getContractAt("ConsentManager", deployment.contracts.ConsentManager);

  // 1. Register Entities
  console.log("\n1. Registering Stakeholder Entities...");
  await AccessControl.connect(admin).registerEntity(patient1.address, 1, "Jane Doe", "MED-PAT-882194");
  await AccessControl.connect(admin).registerEntity(patient2.address, 1, "Rahul Sharma", "MED-PAT-771923");
  await AccessControl.connect(admin).registerEntity(hospital.address, 2, "Apollo Super Specialty Hospital", "HOSP-DEL-2018-094");
  await AccessControl.connect(admin).registerEntity(lab.address, 3, "Metro PathLabs Diagnostic Network", "NABL-MC-5421");
  await AccessControl.connect(admin).registerEntity(insurance.address, 4, "Star Health & Allied Insurance", "IRDAI-HL-103");
  console.log("   Entities registered successfully.");

  // 2. Register Records from synthetic files
  console.log("\n2. Computing SHA-256 hashes and registering synthetic records...");
  const syntheticDir = path.join(__dirname, "..", "..", "data", "synthetic");

  const rec1File = path.join(syntheticDir, "patient1_discharge_summary.json");
  const rec1Hash = computeFileSHA256(rec1File);
  await RecordRegistry.connect(hospital).registerRecord(
    "REC-2026-001",
    patient1.address,
    rec1Hash,
    "DISCHARGE_SUMMARY",
    "patient1_discharge_summary.json"
  );
  console.log("   Registered REC-2026-001 (Discharge Summary) - Hash:", rec1Hash.slice(0, 18) + "...");

  const rec2File = path.join(syntheticDir, "patient1_blood_panel.json");
  const rec2Hash = computeFileSHA256(rec2File);
  await RecordRegistry.connect(lab).registerRecord(
    "REC-2026-002",
    patient1.address,
    rec2Hash,
    "LAB_REPORT",
    "patient1_blood_panel.json"
  );
  console.log("   Registered REC-2026-002 (Blood Panel) - Hash:", rec2Hash.slice(0, 18) + "...");

  const rec3File = path.join(syntheticDir, "patient1_mri_lumbar.json");
  const rec3Hash = computeFileSHA256(rec3File);
  await RecordRegistry.connect(lab).registerRecord(
    "REC-2026-003",
    patient1.address,
    rec3Hash,
    "MRI_SCAN",
    "patient1_mri_lumbar.json"
  );
  console.log("   Registered REC-2026-003 (MRI Lumbar) - Hash:", rec3Hash.slice(0, 18) + "...");

  const rec4File = path.join(syntheticDir, "patient2_cardiac_echo.json");
  const rec4Hash = computeFileSHA256(rec4File);
  await RecordRegistry.connect(hospital).registerRecord(
    "REC-2026-004",
    patient2.address,
    rec4Hash,
    "CARDIOLOGY_ECHO",
    "patient2_cardiac_echo.json"
  );
  console.log("   Registered REC-2026-004 (Cardiac Echo) - Hash:", rec4Hash.slice(0, 18) + "...");

  const rec5File = path.join(syntheticDir, "patient2_oncology_report.json");
  const rec5Hash = computeFileSHA256(rec5File);
  await RecordRegistry.connect(hospital).registerRecord(
    "REC-2026-005",
    patient2.address,
    rec5Hash,
    "HISTOPATHOLOGY",
    "patient2_oncology_report.json"
  );
  console.log("   Registered REC-2026-005 (Histopathology) - Hash:", rec5Hash.slice(0, 18) + "...");

  // 3. Create Sample Consent Requests
  console.log("\n3. Creating initial consent requests...");
  // Request 1: Insurance requests access to REC-2026-001 for claim verification (Patient will grant)
  const tx1 = await ConsentManager.connect(insurance).requestAccess(
    "REC-2026-001",
    "Cashless Claim Settlement - Claim #CLM-STAR-2026-7731"
  );
  await tx1.wait();
  console.log("   Created Request 1: Insurance -> Patient 1 for REC-2026-001");

  // Patient 1 approves Request 1 for 7 days
  await ConsentManager.connect(patient1).grantConsent(1, 7 * 86400);
  console.log("   Patient 1 approved Request 1 (Valid for 7 days)");

  // Request 2: Hospital requests access to REC-2026-002 from Lab (Pending patient approval)
  const tx2 = await ConsentManager.connect(hospital).requestAccess(
    "REC-2026-002",
    "Emergency Consultation & Diagnostic Review"
  );
  await tx2.wait();
  console.log("   Created Request 2: Hospital -> Patient 1 for REC-2026-002 (Status: PENDING)");

  // Export account mapping for backend & frontend
  const accountsInfo = {
    admin: { address: admin.address, role: "ADMIN", name: "MediLedger Governance" },
    hospital: { address: hospital.address, role: "HOSPITAL", name: "Apollo Super Specialty Hospital", id: "HOSP-DEL-2018-094" },
    lab: { address: lab.address, role: "DIAGNOSTIC_LAB", name: "Metro PathLabs", id: "NABL-MC-5421" },
    insurance: { address: insurance.address, role: "INSURANCE_COMPANY", name: "Star Health Insurance", id: "IRDAI-HL-103" },
    patient1: { address: patient1.address, role: "PATIENT", name: "Jane Doe", id: "MED-PAT-882194" },
    patient2: { address: patient2.address, role: "PATIENT", name: "Rahul Sharma", id: "MED-PAT-771923" }
  };

  const accountsJsonPath = path.join(__dirname, "..", "..", "backend", "src", "config", "accountsConfig.json");
  fs.writeFileSync(accountsJsonPath, JSON.stringify(accountsInfo, null, 2));

  const frontendAccountsJsonPath = path.join(__dirname, "..", "..", "frontend", "src", "accountsConfig.json");
  fs.writeFileSync(frontendAccountsJsonPath, JSON.stringify(accountsInfo, null, 2));

  console.log("\nAccounts configuration exported to backend and frontend.");
  console.log("=================================================");
  console.log("       Seed Script Finished Successfully!        ");
  console.log("=================================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
