// MediLedger Hybrid Client Connector
// Automatically connects to Node.js / Hardhat backend if running,
// OR falls back seamlessly to the In-Browser Cryptographic Engine with Web Crypto SHA-256
// allowing zero-setup, one-click demonstration in any browser!

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let isBackendAvailable = null;

// Helper: Check backend availability
async function checkBackend() {
  if (isBackendAvailable !== null) return isBackendAvailable;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(id);
    isBackendAvailable = res.ok;
  } catch (e) {
    isBackendAvailable = false;
  }
  return isBackendAvailable;
}

// Web Crypto SHA-256 Helper (Real Cryptographic Digest in Browser)
async function computeBrowserSHA256(content) {
  let text = typeof content === "object" ? canonicalJsonStringify(content) : String(content);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hashHex;
}

function canonicalJsonStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonicalJsonStringify).join(",") + "]";
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(k => JSON.stringify(k) + ":" + canonicalJsonStringify(obj[k]));
  return "{" + pairs.join(",") + "}";
}

// ---------------------------------------------------------------------------
// IN-BROWSER CRYPTOGRAPHIC LEDGER STATE (Zero-Setup Fallback Engine)
// ---------------------------------------------------------------------------
const MOCK_ACCOUNTS = {
  admin: { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', role: 'ADMIN', name: 'MediLedger Governance' },
  hospital: { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', role: 'HOSPITAL', name: 'Apollo Super Specialty Hospital', id: 'HOSP-DEL-2018-094' },
  lab: { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', role: 'DIAGNOSTIC_LAB', name: 'Metro PathLabs Diagnostic Network', id: 'NABL-MC-5421' },
  insurance: { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', role: 'INSURANCE_COMPANY', name: 'Star Health & Allied Insurance', id: 'IRDAI-HL-103' },
  patient1: { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', role: 'PATIENT', name: 'Jane Doe', id: 'MED-PAT-882194' },
  patient2: { address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', role: 'PATIENT', name: 'Rahul Sharma', id: 'MED-PAT-771923' }
};

// Initial synthetic clinical datasets preloaded into memory
const CLINICAL_STORE = {
  "REC-2026-001": {
    recordId: "REC-2026-001",
    documentType: "DISCHARGE_SUMMARY",
    patient: { uhid: "MED-PAT-882194", name: "Jane Doe", age: 34, gender: "Female", bloodGroup: "O-Positive" },
    facility: { name: "Apollo Super Specialty Hospital", registrationNo: "HOSP-DEL-2018-094", treatingConsultant: "Dr. Aris Thorne, MD, DM" },
    clinicalDetails: {
      admissionDate: "2026-10-12T08:30:00Z",
      dischargeDate: "2026-10-16T14:00:00Z",
      primaryDiagnosis: "Acute Uncomplicated Myocarditis (ICD-10 I40.9)",
      courseInHospital: "Patient presented with acute atypical chest pain and mild dyspnea. Troponin-T elevated at 0.18 ng/mL. Echo revealed mild LV dysfunction EF 50%. Managed conservatively with beta-blockers and ACE inhibitors.",
      dischargeMedications: [
        { medication: "Ramipril", dosage: "2.5 mg once daily", duration: "90 days" },
        { medication: "Metoprolol Succinate", dosage: "25 mg once daily", duration: "90 days" }
      ]
    },
    billingSummary: { totalAmountINR: 84500, preAuthClaimId: "CLM-STAR-2026-7731" }
  },
  "REC-2026-002": {
    recordId: "REC-2026-002",
    documentType: "LAB_REPORT",
    patient: { uhid: "MED-PAT-882194", name: "Jane Doe", age: 34, gender: "Female" },
    laboratory: { name: "Metro PathLabs Diagnostic Network", nablAccreditationNo: "NABL-MC-5421", pathologist: "Dr. Sunita Rao, MD" },
    testPanel: "Comprehensive Cardiac Biomarkers & Lipid Profile",
    results: [
      { test: "High Sensitivity Troponin T", value: 0.18, unit: "ng/mL", referenceRange: "< 0.014", flag: "HIGH" },
      { test: "CK-MB", value: 24.5, unit: "U/L", referenceRange: "0 - 25", flag: "NORMAL" },
      { test: "Total Cholesterol", value: 218, unit: "mg/dL", referenceRange: "< 200", flag: "BORDERLINE_HIGH" },
      { test: "hs-CRP", value: 4.8, unit: "mg/L", referenceRange: "< 1.0", flag: "ELEVATED" }
    ],
    interpretation: "Elevated hs-Troponin-T and hs-CRP consistent with acute myocardial inflammation."
  },
  "REC-2026-003": {
    recordId: "REC-2026-003",
    documentType: "MRI_SCAN",
    patient: { uhid: "MED-PAT-882194", name: "Jane Doe", age: 34, gender: "Female" },
    imagingCenter: { name: "National Diagnostic & Imaging Institute", modality: "MRI (3.0 Tesla)", radiologist: "Dr. Kabir Varma, MD" },
    studyDescription: "MRI Lumbo-Sacral Spine with Multiplanar T1, T2, and STIR sequences",
    findings: { lumbarVertebrae: "Mild diffuse disc bulge at L4-L5 without significant neural compromise." },
    impression: "Mild L4-L5 posterior disc protrusion. No severe stenosis."
  },
  "REC-2026-004": {
    recordId: "REC-2026-004",
    documentType: "CARDIOLOGY_ECHO",
    patient: { uhid: "MED-PAT-771923", name: "Rahul Sharma", age: 48, gender: "Male" },
    facility: { name: "Fortis Escorts Heart Institute", treatingConsultant: "Dr. Meenakshi Sundaram, MD" },
    measurements: { leftVentricularEjectionFraction: "58%", lvedd: "46 mm" },
    impression: "Normal LV systolic function with LVEF 58%."
  },
  "REC-2026-005": {
    recordId: "REC-2026-005",
    documentType: "HISTOPATHOLOGY",
    patient: { uhid: "MED-PAT-771923", name: "Rahul Sharma", age: 48, gender: "Male" },
    facility: { name: "Tata Memorial Centre", consultant: "Dr. Devika Sen, MD" },
    pathologicalDiagnosis: "Tubular Adenoma with Low-Grade Dysplasia. Benign Neoplasm."
  }
};

let inMemoryRecords = [
  {
    recordId: "REC-2026-001",
    patient: MOCK_ACCOUNTS.patient1.address,
    issuer: MOCK_ACCOUNTS.hospital.address,
    documentHash: "0x5bb541b28c30798e4dc3a9e1e2cfbd1589a695b12daecbe6fce5230bfdfef38b",
    docType: "DISCHARGE_SUMMARY",
    offchainURI: "patient1_discharge_summary.json",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 2,
    isActive: true
  },
  {
    recordId: "REC-2026-002",
    patient: MOCK_ACCOUNTS.patient1.address,
    issuer: MOCK_ACCOUNTS.lab.address,
    documentHash: "0x89e21727cbb0540d9921bc1a233b8a13a2ec2203fa41fba761e2cb2a014a6012",
    docType: "LAB_REPORT",
    offchainURI: "patient1_blood_panel.json",
    createdAt: Math.floor(Date.now() / 1000) - 86400,
    isActive: true
  },
  {
    recordId: "REC-2026-003",
    patient: MOCK_ACCOUNTS.patient1.address,
    issuer: MOCK_ACCOUNTS.lab.address,
    documentHash: "0x37a6b4c10711ee0d49e77cb891238914ba19ec4b01e389dfae298b11a91cd8e2",
    docType: "MRI_SCAN",
    offchainURI: "patient1_mri_lumbar.json",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 5,
    isActive: true
  },
  {
    recordId: "REC-2026-004",
    patient: MOCK_ACCOUNTS.patient2.address,
    issuer: MOCK_ACCOUNTS.hospital.address,
    documentHash: "0x44a1e9bf8823d014bc910a72e81198f2a10129bc78810237bb92019487bcfe91",
    docType: "CARDIOLOGY_ECHO",
    offchainURI: "patient2_cardiac_echo.json",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 3,
    isActive: true
  },
  {
    recordId: "REC-2026-005",
    patient: MOCK_ACCOUNTS.patient2.address,
    issuer: MOCK_ACCOUNTS.hospital.address,
    documentHash: "0x77c22e891ab01923cf90172e00192a838b001923fae8810231902847aef98201",
    docType: "HISTOPATHOLOGY",
    offchainURI: "patient2_oncology_report.json",
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 4,
    isActive: true
  }
];

let inMemoryRequests = [
  {
    requestId: 1,
    recordId: "REC-2026-001",
    patient: MOCK_ACCOUNTS.patient1.address,
    requester: MOCK_ACCOUNTS.insurance.address,
    purpose: "Cashless Claim Settlement - Claim #CLM-STAR-2026-7731",
    requestedAt: Math.floor(Date.now() / 1000) - 3600,
    approvedAt: Math.floor(Date.now() / 1000) - 1800,
    validUntil: Math.floor(Date.now() / 1000) + 7 * 86400,
    status: "APPROVED"
  },
  {
    requestId: 2,
    recordId: "REC-2026-002",
    patient: MOCK_ACCOUNTS.patient1.address,
    requester: MOCK_ACCOUNTS.hospital.address,
    purpose: "Emergency Consultation & Diagnostic Review",
    requestedAt: Math.floor(Date.now() / 1000) - 900,
    approvedAt: 0,
    validUntil: 0,
    status: "PENDING"
  }
];

let inMemoryLogs = [
  { logId: 1, recordId: "REC-2026-001", actor: MOCK_ACCOUNTS.hospital.address, action: "RECORD_REGISTERED", detail: "Registered docType: DISCHARGE_SUMMARY", timestamp: Math.floor(Date.now() / 1000) - 86400 * 2, status: true },
  { logId: 2, recordId: "REC-2026-002", actor: MOCK_ACCOUNTS.lab.address, action: "RECORD_REGISTERED", detail: "Registered docType: LAB_REPORT", timestamp: Math.floor(Date.now() / 1000) - 86400, status: true },
  { logId: 3, recordId: "REC-2026-001", actor: MOCK_ACCOUNTS.insurance.address, action: "CONSENT_REQUESTED", detail: "Requested for: Claim Settlement #CLM-STAR-7731", timestamp: Math.floor(Date.now() / 1000) - 3600, status: true },
  { logId: 4, recordId: "REC-2026-001", actor: MOCK_ACCOUNTS.patient1.address, action: "CONSENT_GRANTED", detail: "Valid for 604800 seconds (7 Days)", timestamp: Math.floor(Date.now() / 1000) - 1800, status: true },
  { logId: 5, recordId: "REC-2026-001", actor: MOCK_ACCOUNTS.insurance.address, action: "RECORD_ACCESSED", detail: "Authorized retrieval under active consent", timestamp: Math.floor(Date.now() / 1000) - 1200, status: true },
  { logId: 6, recordId: "REC-2026-001", actor: MOCK_ACCOUNTS.insurance.address, action: "RECORD_VERIFIED", detail: "Integrity Verified: Hash Match", timestamp: Math.floor(Date.now() / 1000) - 600, status: true }
];

function getHeaders(activeRole, activeAddress) {
  const headers = { "Content-Type": "application/json" };
  if (activeRole) headers["x-role"] = activeRole;
  if (activeAddress) headers["x-user-address"] = activeAddress;
  return headers;
}

// ---------------------------------------------------------------------------
// PUBLIC API EXPORTS (Auto-Selects Backend or In-Browser Engine)
// ---------------------------------------------------------------------------

export async function fetchRoles() {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/auth/roles`);
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }
  return {
    accounts: MOCK_ACCOUNTS,
    network: { rpc: "In-Browser Simulated Hardhat EVM (Zero Setup Required)", chainId: 31337 },
    contracts: { RecordRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", ConsentManager: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" }
  };
}

export async function fetchAllRecords(role, address) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/records/all`, { headers: getHeaders(role, address) });
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }
  return { total: inMemoryRecords.length, records: [...inMemoryRecords] };
}

export async function fetchPatientRecords(patientAddress, role, address) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/records/patient/${patientAddress}`, { headers: getHeaders(role, address) });
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }
  const filtered = inMemoryRecords.filter(r => r.patient.toLowerCase() === (patientAddress || "").toLowerCase());
  return { patientAddress, records: filtered };
}

export async function fetchIssuerRecords(issuerAddress, role, address) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/records/issuer/${issuerAddress}`, { headers: getHeaders(role, address) });
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }
  const filtered = inMemoryRecords.filter(r => r.issuer.toLowerCase() === (issuerAddress || "").toLowerCase());
  return { issuerAddress, records: filtered };
}

export async function fetchRecordDetail(recordId, role, address) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/records/${recordId}`, { headers: getHeaders(role, address) });
      if (res.ok) return res.json();
      const err = await res.json();
      throw new Error(err.message || err.error || "Access Denied");
    } catch (e) {
      if (e.message && e.message.includes("Access Denied")) throw e;
    }
  }

  const rec = inMemoryRecords.find(r => r.recordId === recordId);
  if (!rec) throw new Error("Record not found");

  const doc = CLINICAL_STORE[recordId] || { recordId, note: "Off-chain clinical summary securely retrieved" };
  const callerAddr = address || (MOCK_ACCOUNTS[role] ? MOCK_ACCOUNTS[role].address : MOCK_ACCOUNTS.patient1.address);

  const isOwner = callerAddr.toLowerCase() === rec.patient.toLowerCase();
  const isIssuer = callerAddr.toLowerCase() === rec.issuer.toLowerCase();

  const activeConsent = inMemoryRequests.find(
    r => r.recordId === recordId &&
         r.requester.toLowerCase() === callerAddr.toLowerCase() &&
         r.status === "APPROVED" &&
         Date.now() <= r.validUntil * 1000
  );

  if (!isOwner && !isIssuer && !activeConsent) {
    throw new Error("Access Denied: Patient consent required on smart contract to access this medical record.");
  }

  return {
    record: rec,
    accessGranted: true,
    accessReason: isOwner ? "DATA_OWNER" : isIssuer ? "RECORD_ISSUER" : "ACTIVE_CONSENT",
    documentContent: doc
  };
}

export async function registerNewRecord(recordData, role, address) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/records/register`, {
        method: "POST",
        headers: getHeaders(role, address),
        body: JSON.stringify(recordData)
      });
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }

  const { recordId, patientAddress, docType, clinicalData } = recordData;
  const hash = await computeBrowserSHA256(clinicalData);
  const callerAddr = address || (MOCK_ACCOUNTS[role] ? MOCK_ACCOUNTS[role].address : MOCK_ACCOUNTS.hospital.address);

  const newRec = {
    recordId,
    patient: patientAddress,
    issuer: callerAddr,
    documentHash: hash,
    docType,
    offchainURI: `${recordId.toLowerCase()}.json`,
    createdAt: Math.floor(Date.now() / 1000),
    isActive: true
  };

  inMemoryRecords.unshift(newRec);
  CLINICAL_STORE[recordId] = clinicalData;

  inMemoryLogs.unshift({
    logId: inMemoryLogs.length + 1,
    recordId,
    actor: callerAddr,
    action: "RECORD_REGISTERED",
    detail: `Registered docType: ${docType}`,
    timestamp: Math.floor(Date.now() / 1000),
    status: true
  });

  return {
    message: "Record anchored successfully",
    recordId,
    documentHash: hash,
    transactionHash: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("")
  };
}

export async function requestRecordAccess(recordId, purpose, role, address) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/consent/request`, {
        method: "POST",
        headers: getHeaders(role, address),
        body: JSON.stringify({ recordId, purpose })
      });
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }

  const rec = inMemoryRecords.find(r => r.recordId === recordId);
  const callerAddr = address || (MOCK_ACCOUNTS[role] ? MOCK_ACCOUNTS[role].address : MOCK_ACCOUNTS.insurance.address);
  const patientAddr = rec ? rec.patient : MOCK_ACCOUNTS.patient1.address;

  const newReq = {
    requestId: inMemoryRequests.length + 1,
    recordId,
    patient: patientAddr,
    requester: callerAddr,
    purpose,
    requestedAt: Math.floor(Date.now() / 1000),
    approvedAt: 0,
    validUntil: 0,
    status: "PENDING"
  };

  inMemoryRequests.unshift(newReq);
  inMemoryLogs.unshift({
    logId: inMemoryLogs.length + 1,
    recordId,
    actor: callerAddr,
    action: "CONSENT_REQUESTED",
    detail: `Requested for: ${purpose}`,
    timestamp: Math.floor(Date.now() / 1000),
    status: true
  });

  return { message: "Consent request submitted", requestId: newReq.requestId };
}

export async function grantRecordConsent(requestId, durationInSeconds, role, address) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/consent/${requestId}/grant`, {
        method: "POST",
        headers: getHeaders(role, address),
        body: JSON.stringify({ durationInSeconds })
      });
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }

  const req = inMemoryRequests.find(r => r.requestId === Number(requestId));
  if (req) {
    req.status = "APPROVED";
    req.approvedAt = Math.floor(Date.now() / 1000);
    req.validUntil = req.approvedAt + Number(durationInSeconds || 86400);

    inMemoryLogs.unshift({
      logId: inMemoryLogs.length + 1,
      recordId: req.recordId,
      actor: req.patient,
      action: "CONSENT_GRANTED",
      detail: `Valid for ${durationInSeconds} seconds`,
      timestamp: Math.floor(Date.now() / 1000),
      status: true
    });
  }

  return { message: "Consent granted on smart contract", requestId };
}

export async function rejectRecordConsent(requestId, role, address) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/consent/${requestId}/reject`, {
        method: "POST",
        headers: getHeaders(role, address)
      });
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }

  const req = inMemoryRequests.find(r => r.requestId === Number(requestId));
  if (req) {
    req.status = "REJECTED";
    inMemoryLogs.unshift({
      logId: inMemoryLogs.length + 1,
      recordId: req.recordId,
      actor: req.patient,
      action: "CONSENT_REJECTED",
      detail: "Declined by patient",
      timestamp: Math.floor(Date.now() / 1000),
      status: true
    });
  }
  return { message: "Consent rejected" };
}

export async function revokeActiveConsent(requestId, role, address) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/consent/${requestId}/revoke`, {
        method: "POST",
        headers: getHeaders(role, address)
      });
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }

  const req = inMemoryRequests.find(r => r.requestId === Number(requestId));
  if (req) {
    req.status = "REVOKED";
    inMemoryLogs.unshift({
      logId: inMemoryLogs.length + 1,
      recordId: req.recordId,
      actor: req.patient,
      action: "CONSENT_REVOKED",
      detail: "Instant smart contract revocation executed",
      timestamp: Math.floor(Date.now() / 1000),
      status: true
    });
  }
  return { message: "Consent revoked immediately" };
}

export async function fetchPatientConsentRequests(patientAddress) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/consent/patient/${patientAddress}`);
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }
  const filtered = inMemoryRequests.filter(r => r.patient.toLowerCase() === (patientAddress || "").toLowerCase());
  return { patientAddress, requests: filtered };
}

export async function fetchRequesterConsentRequests(requesterAddress) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/consent/requester/${requesterAddress}`);
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }
  const filtered = inMemoryRequests.filter(r => r.requester.toLowerCase() === (requesterAddress || "").toLowerCase());
  return { requesterAddress, requests: filtered };
}

export async function verifyRecordHash(recordId, customContent = null, role, address) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/verify/record`, {
        method: "POST",
        headers: getHeaders(role, address),
        body: JSON.stringify({ recordId, customContent })
      });
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }

  const rec = inMemoryRecords.find(r => r.recordId === recordId);
  if (!rec) throw new Error("Record not found");

  const doc = customContent || CLINICAL_STORE[recordId];
  const computed = await computeBrowserSHA256(doc);
  const isMatch = rec.documentHash.toLowerCase() === computed.toLowerCase();

  inMemoryLogs.unshift({
    logId: inMemoryLogs.length + 1,
    recordId,
    actor: address || MOCK_ACCOUNTS.insurance.address,
    action: "RECORD_VERIFIED",
    detail: isMatch ? "Integrity Verified: Hash Match" : "Integrity Failure: Hash Mismatch",
    timestamp: Math.floor(Date.now() / 1000),
    status: isMatch
  });

  return {
    verificationResult: {
      isAuthentic: isMatch,
      status: isMatch ? "MATCH_AUTHENTIC" : "INTEGRITY_COMPROMISED",
      recordId,
      onChainHash: rec.documentHash,
      computedHash: computed,
      hashMatch: isMatch,
      recordIsActive: rec.isActive,
      docType: rec.docType,
      issuer: rec.issuer,
      patient: rec.patient,
      contentSource: "BROWSER_CRYPTOGRAPHIC_VERIFIER",
      verifiedAt: new Date().toISOString(),
      transactionHash: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("")
    }
  };
}

export async function simulateTamperAttempt(recordId = "REC-2026-001") {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/verify/simulate-tamper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId })
      });
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }

  const rec = inMemoryRecords.find(r => r.recordId === recordId);
  const doc = CLINICAL_STORE[recordId] ? JSON.parse(JSON.stringify(CLINICAL_STORE[recordId])) : { recordId, billingSummary: { totalAmountINR: 84500 } };

  const originalBill = doc.billingSummary ? doc.billingSummary.totalAmountINR : 84500;
  doc.billingSummary.totalAmountINR = originalBill + 150000; // Inflate by 1.5 Lakhs
  doc.billingSummary.tamperedNote = "UNAUTHORIZED ALTERATION: Inflated by 150,000 INR for insurance claim padding";

  const tamperedHash = await computeBrowserSHA256(doc);

  inMemoryLogs.unshift({
    logId: inMemoryLogs.length + 1,
    recordId,
    actor: MOCK_ACCOUNTS.insurance.address,
    action: "SECURITY_ALERT",
    detail: "FRAUD DETECTED: Tampered document hash mismatch",
    timestamp: Math.floor(Date.now() / 1000),
    status: false
  });

  return {
    simulation: "HEALTHCARE_INSURANCE_FRAUD_TAMPERING_TEST",
    recordId,
    originalOnChainHash: rec ? rec.documentHash : "0x5bb541b28c30798e4dc3a9e1e2cfbd1589a695b12daecbe6fce5230bfdfef38b",
    authenticCalculatedHash: rec ? rec.documentHash : "0x5bb541b28c30798e4dc3a9e1e2cfbd1589a695b12daecbe6fce5230bfdfef38b",
    tamperedHash,
    tamperedModifications: {
      fieldChanged: "billingSummary.totalAmountINR",
      originalValue: originalBill,
      tamperedValue: doc.billingSummary.totalAmountINR,
      differenceINR: 150000
    },
    blockchainDecision: {
      isAuthentic: false,
      verificationStatus: "FRAUD_DETECTED_HASH_MISMATCH",
      actionTaken: "Claim Flagged For Fraud Investigation - Auto-Adjudication Blocked",
      auditTransactionHash: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("")
    }
  };
}

export async function fetchAuditLogs(limit = 50) {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/audit/logs?limit=${limit}`);
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }
  return { total: inMemoryLogs.length, logs: inMemoryLogs.slice(0, limit) };
}

export async function fetchAnalytics() {
  if (await checkBackend()) {
    try {
      const res = await fetch(`${API_BASE}/analytics/dashboard`);
      if (res.ok) return res.json();
    } catch (e) { /* fallback */ }
  }
  return {
    ledgerMetrics: {
      totalRecordsAnchored: inMemoryRecords.length,
      totalConsentRequests: inMemoryRequests.length,
      totalAuditEvents: inMemoryLogs.length,
      currentBlockHeight: 184,
      consensusMechanism: "Ethereum EVM / Hardhat Local Devnet",
      dataIntegrityHashAlgorithm: "SHA-256 (FIPS 180-4)",
      architecture: "Hybrid Off-Chain Storage + On-Chain Cryptographic Anchor"
    },
    healthEconomics: {
      claimsProcessedBaseline: 15000,
      traditionalTurnaroundTime: "14 - 21 Days",
      mediledgerTurnaroundTime: "< 4 Hours (Immediate on Patient Approval)",
      administrativeCostPerClaim: {
        traditionalManualINR: 1850,
        mediledgerBlockchainINR: 6.5,
        savingsPercentage: "99.6%"
      },
      financialProjections: {
        annualAdminSavingsINR: 27652500,
        projectedFraudLossMitigationINR: 126000000,
        totalFinancialBenefitINR: 153652500,
        estimatedImplementationCapExINR: 1500000,
        projectedFirstYearROI: "1824%",
        breakEvenPeriodMonths: 2.3
      }
    }
  };
}
