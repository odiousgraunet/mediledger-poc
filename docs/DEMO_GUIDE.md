# MediLedger: Step-by-Step Demonstration & Evaluation Guide

**Project Title:** Blockchain-Based Patient-Controlled Medical Record Authentication and Consent Management Network  
**Degree Program:** MBA in Finance / Technology Management  
**Evaluation Target:** Faculty Review Panel, Academic Evaluators, and Industry Jury  
**Estimated Demo Time:** 8–12 Minutes  

---

## 1. Quick Start & Execution Setup (For Any Computer)

You can demonstrate MediLedger using either:
1. **Zero-Install Portable Method (Recommended for Other Computers/Laptops):**  
   - Double-click `MediLedger_Portable_App.html` or `index.html` on **any computer or Mac**.
   - No Node.js, Git, or Ethereum installation required.
   - Built-in in-browser Web Crypto SHA-256 engine, all 4 stakeholder roles, interactive fraud detection, MBA ROI calculator, and audit logging.
2. **Same Wi-Fi Local Sharing:**
   - If running on your primary laptop, open `http://<YOUR_LOCAL_IP>:3000` (e.g. `http://192.168.0.111:3000`) on any phone, tablet, or examiner laptop on the same Wi-Fi.
3. **Full Developer Setup (Node.js + Hardhat):**  
   - Use `start_quick_demo.bat` or `start_demo.bat` on Windows.
   - Or follow the step-by-step developer instructions below.

### 1.1 Prerequisites (Developer Setup Only)
- **Node.js:** v18.0.0 or higher (v26.x tested & verified)
- **Git:** Installed
- **Web Browser:** Google Chrome / Edge / Firefox

---

### 1.2 Starting the System (Step-by-Step)

#### Step 1: Start the Local Ethereum Blockchain
In **Terminal 1**, run:
```bash
npm run blockchain:node
```
*Expected Output:*
Hardhat starts mining at `http://127.0.0.1:8545` with Chain ID `31337` and 20 funded test accounts (10,000 ETH each).

---

#### Step 2: Deploy & Seed Smart Contracts
In **Terminal 2**, run:
```bash
npm run blockchain:deploy
npm run blockchain:seed
```
*Expected Output:*
- `AccessControlManager.sol` deployed
- `AuditLogger.sol` deployed
- `RecordRegistry.sol` deployed
- `ConsentManager.sol` deployed
- Stakeholder entities registered (Patient Jane Doe, Hospital Apollo, Lab Metro PathLabs, Insurer Star Health)
- Five synthetic medical records anchored with real SHA-256 fingerprints
- Initial consent requests seeded and exported to `backend/src/config/` and `frontend/src/`

---

#### Step 3: Launch the Backend REST Gateway
In **Terminal 3**, run:
```bash
npm run backend:start
```
*Expected Output:*
```
=================================================
 MediLedger API Server running on port 5000 
 Health Check: http://localhost:5000/api/health
=================================================
```

---

#### Step 4: Launch the Frontend Web Application
In **Terminal 4**, run:
```bash
npm run frontend:dev
```
*Expected Output:*
```
  VITE v5.4.21  ready in 320 ms
  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```
Open **`http://localhost:3000`** in your browser.

---

## 2. Interactive 5-Act Demonstration Walkthrough

MediLedger features a **Role Switcher** in the top navigation bar. Evaluators can seamlessly switch between all four ecosystem stakeholders:

```
+-------------------------------------------------------------------------------+
| Active Role Switcher:                                                         |
| [ Patient (Jane Doe) ] [ Hospital (Apollo) ] [ Lab (Metro) ] [ Insurer (Star) ]|
+-------------------------------------------------------------------------------+
```

---

### Act 1: Hospital Record Issuance & Cryptographic Anchoring
**Persona:** Hospital Administrator / Chief Medical Officer (`Apollo Super Specialty Hospital`)

1. In the top-right role dropdown, select **"Hospital (Apollo Hospital)"**.
2. Notice the **Hospital Portal**:
   - Shows existing anchored records (`REC-2026-001`, `REC-2026-004`, `REC-2026-005`).
   - Click the **"View Record"** button on `REC-2026-001` (Acute Myocarditis Discharge Summary) to inspect clinical findings, treating consultant details, and hospital billings (₹84,500).
3. Click the **"+ Register & Anchor New Record"** tab:
   - Form is pre-filled with a new clinical discharge case for patient **Jane Doe**.
   - Click **"Anchor Record to Blockchain"**.
4. **Result:**
   - The file is securely saved off-chain.
   - The SHA-256 cryptographic fingerprint is calculated and permanently anchored to `RecordRegistry.sol` on the Ethereum EVM.
   - A live blockchain transaction receipt is confirmed.

---

### Act 2: Diagnostic Laboratory Report Issuance
**Persona:** Senior Pathologist (`Metro PathLabs Diagnostic Network`)

1. In the role switcher, select **"Diagnostic Lab (Metro Path)"**.
2. Observe the **NABL Accreditation Badge** and existing lab reports (`REC-2026-002` Cardiac Panel, `REC-2026-003` MRI Scan).
3. Click **"+ Create & Anchor Report"**:
   - Notice the structured biomarker panel (Troponin-T, CK-MB, hs-CRP, Lipid Profile).
   - Click **"Anchor Lab Fingerprint to Ledger"**.
4. **Result:**
   - Diagnostic report fingerprint is mined on the smart contract.
   - Proves to insurers that lab values cannot be forged or tampered with during insurance audits.

---

### Act 3: Sovereign Patient Consent Authorization & Revocation
**Persona:** Patient / Data Owner (`Jane Doe`)

1. In the role switcher, select **"Patient (Jane Doe)"**.
2. Notice the yellow **"Action Required: Incoming Access Request(s)"** banner:
   - Insurer *Star Health* has submitted Request `#2` seeking access to record `REC-2026-002` for cashless claim verification.
3. Click **"Review & Authorize"**:
   - An authorization modal appears detailing the target record and the stated clinical purpose.
   - Select the access window: **"24 Hours (Standard OPD / Lab)"** or **"7 Days"**.
   - Click **"Grant Patient Consent"**.
4. **Result:**
   - Smart contract updates consent state to `APPROVED` with an on-chain expiration timestamp (`validUntil = block.timestamp + duration`).
   - Notice the request moves instantly into the **"Active Access Permissions"** table.
5. **Instant Revocation Test:**
   - Click the red **"Revoke Now"** button next to any active permission.
   - Confirm the prompt.
   - **Result:** The smart contract marks the consent as `REVOKED` in the next block. Any subsequent retrieval attempt by the insurer is blocked with `403 Forbidden`.

---

### Act 4: Insurance Claim Adjudication & Fraud Detection (MBA Core)
**Persona:** Chief Claims Officer / Medical Underwriter (`Star Health Insurance`)

1. In the role switcher, select **"Insurance (Star Health)"**.
2. Review the **Cashless Claims Adjudication Desk**:
   - Records with active patient consent display a green **"View Record"** button.
   - Records without patient consent display **"Request Consent"** (demonstrating patient-gated access control).
3. **Test 1: Verify Authentic Claim (The Legitimate Case)**:
   - In the red interactive banner at the top, click **"1. Verify Authentic (Match)"**.
   - The modal calculates the SHA-256 digest of `REC-2026-001` off-chain and compares it to the smart contract:
     * *Smart Contract Hash:* `0x5bb541b28c30798e4d...`
     * *Computed File Hash:* `0x5bb541b28c30798e4d...`
     * **Status: 100% CRYPTOGRAPHIC INTEGRITY CONFIRMED (MATCH)**.
4. **Test 2: Simulate Healthcare Billing Fraud (The Fraud Case)**:
   - Click the red button: **"2. Simulate Fraud Tamper (Mismatch)"**.
   - The simulation artificially inflates the hospital bill by **+₹150,000** (tampering with line items).
   - Re-computed hash: `0x1aace764a1d1a2cc8f...`
   - **Status: FRAUD ALERT: RECORD TAMPERING DETECTED!**
   - The smart contract verification fails and auto-blocks claim payout!

---

### Act 5: Immutable Audit Explorer & MBA Economics
**Persona:** Healthcare Economist / Auditor

1. Click the **"MBA Economics"** tab in the top navigation bar:
   - Interactive ROI Calculator: adjust the slider from 5,000 to 50,000 annual claims.
   - Displays real-time financial savings in Lakhs:
     * Administrative processing cost: **₹1,850 $\rightarrow$ ₹6.50 (99.6% reduction)**.
     * Payback period: **2.3 Months**.
     * Year-1 Net Benefit: **₹15.34 Crore ($1.84M USD)**.
   - Inspect the **ABDM Comparative Matrix**.
2. Click the **"Audit Trail"** tab:
   - Displays live chronological event stream directly from `AuditLogger.sol`.
   - Every registration, consent grant, document retrieval, and security alert is permanently stamped with block height, transaction hash, and actor address.

---

## 3. Running Automated Test Suites

To verify that all claims are supported by code:

```bash
# 1. Run all 23 Smart Contract tests (Chai / Mocha)
cd blockchain
npx hardhat test

# 2. Run Backend Unit tests
cd ../backend
npm test

# 3. Run the comprehensive 10-step End-to-End System Audit
cd ../blockchain
npx hardhat run scripts/run_e2e_audit.js
```

All tests pass with **100% success** on the local EVM environment.
