# MediLedger: Blockchain-Based Patient-Controlled Medical Record Authentication and Consent Management Network

[![Ethereum EVM](https://img.shields.io/badge/Blockchain-Ethereum_EVM-3c3c3d?style=flat&logo=ethereum)](https://ethereum.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat&logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Framework-Hardhat_2.22-yellow?style=flat)](https://hardhat.org/)
[![React Vite](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61dafb?style=flat&logo=react)](https://vitejs.dev/)
[![Node Express](https://img.shields.io/badge/Backend-Node.js_%2B_Express-green?style=flat&logo=node.js)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Academic Track](https://img.shields.io/badge/Academic_Track-MBA_Finance_Capstone-purple)](#academic-deliverables)

---

## 1. Executive Summary & Problem Context

Healthcare insurance globally loses **10% to 15% of annual claim disbursements** to billing manipulation, forged diagnostic reports, phantom line items, and duplicate claims. In India alone, this represents an estimated **₹12,000+ Crore (~$1.44 Billion USD)** annual economic loss. Concurrently, manual paper-based claim adjudication imposes **₹1,850 ($22 USD)** in administrative overhead per claim and delays claim settlements by **14 to 21 business days**.

At the same time, patients face disenfranchisement under blanket hospital admission consent waivers, lacking granular, time-bound, or revocable control over their sensitive Protected Health Information (PHI)—in direct violation of the **Indian Digital Personal Data Protection (DPDP) Act 2023** and **HIPAA**.

**MediLedger** solves this problem through a **hybrid off-chain/on-chain architecture**:
- **Off-Chain Storage:** Confidential medical documents (clinical discharge summaries, pathology reports, MRI scans) remain securely stored off-chain, protecting patient privacy and honoring the "Right to be Forgotten".
- **On-Chain Cryptographic Anchor:** High-precision **SHA-256 cryptographic fingerprints** (`bytes32`), role-based authorizations, and granular, time-bound consent lifecycles are anchored on an **Ethereum EVM blockchain** (Hardhat local devnet).
- **Automated Anti-Fraud Clearinghouse:** Insurers verify medical document authenticity mathematically in seconds. Any post-issuance alteration (e.g. inflating hospital billings) causes an immediate cryptographic hash mismatch, automatically blocking fraudulent payouts.

---

## 2. Core Architecture & Hybrid Design

```
+-----------------------------------------------------------------------------+
|                          OFF-CHAIN SECURE STORAGE                           |
|  [Clinical Discharge JSON]  [Biomarker Panels]  [MRI / Imaging Studies]      |
|                                |                                            |
|                                v                                            |
|               [SHA-256 Cryptographic Hashing Engine]                        |
|                                |                                            |
|                                v                                            |
|              32-Byte Document Fingerprint (0x5bb541...)                     |
+--------------------------------|--------------------------------------------+
                                 |  (Anchored to Blockchain)
                                 v
+-----------------------------------------------------------------------------+
|                     ON-CHAIN ETHEREUM SMART CONTRACTS                       |
|                                                                             |
|  +---------------------------+       +-----------------------------------+  |
|  | AccessControlManager.sol  | ----> |         RecordRegistry.sol        |  |
|  | - 4 Stakeholder Roles     |       | - Document Fingerprints           |  |
|  | - Hospital/Lab Validation |       | - verifyRecord(id, hash)          |  |
|  +---------------------------+       +-----------------------------------+  |
|                |                                       |                    |
|                v                                       v                    |
|  +---------------------------+       +-----------------------------------+  |
|  |     ConsentManager.sol    | ----> |          AuditLogger.sol          |  |
|  | - Time-Bound Windows      |       | - Append-Only Immutable Log       |  |
|  | - Instant Revocation      |       | - Forensic Proof for Disputes     |  |
|  +---------------------------+       +-----------------------------------+  |
+-----------------------------------------------------------------------------+
```

---

## 3. Four Ecosystem Stakeholder Roles

| Role | Entity Example | Key Capabilities |
|---|---|---|
| **Patient** | Jane Doe (`MED-PAT-882194`) | Sovereign data owner; reviews incoming requests; grants time-bound consent (1h / 24h / 7d); executes instant next-block revocation; monitors audit logs. |
| **Hospital** | Apollo Super Specialty (`HOSP-DEL-2018-094`) | Issues & anchors clinical discharge summaries; requests record access from other providers; protects institution from malpractice claims. |
| **Diagnostic Lab** | Metro PathLabs (`NABL-MC-5421`) | Anchors pathology & imaging reports with NABL-accredited cryptographic fingerprints; prevents diagnostic report forgery. |
| **Insurance Co.** | Star Health (`IRDAI-HL-103`) | Submits access requests for cashless claim audits; mathematically verifies SHA-256 document authenticity; detects fraudulent bill padding. |

---

## 4. Key Financial & Operational Metrics (MBA Finance Evaluation)

- **Administrative Cost Reduction:** **99.6% savings** (from ₹1,850 manual review down to ₹6.50 per blockchain verification).
- **Settlement Acceleration:** Reduced from **14–21 business days to < 4 hours**.
- **Financial Value Created (Year 1, 15k claims baseline):**
  - Direct administrative savings: **₹2.74 Crore ($328k USD)**.
  - Fraud leakage prevented: **₹12.60 Crore ($1.51M USD)**.
  - Combined Year-1 benefit: **₹15.34 Crore (~$1.84M USD)**.
- **Payback Period:** **2.3 Months** on an initial implementation setup CapEx of ₹15 Lakhs.
- **Projected 1st-Year ROI:** **> 1,800%**.

---

## 5. Technology Stack Specifications

- **Smart Contracts:** Solidity `^0.8.20`, Hardhat `^2.22.18`, OpenZeppelin patterns
- **Blockchain Client:** Ethers.js `^6.11.1`
- **Backend Service:** Node.js `v26.13.1`, Express `^4.19.2`, Node Crypto (FIPS 180-4 SHA-256)
- **Frontend Client:** React `18.2.0`, Vite `5.4.21`, Tailwind CSS `3.4.1`, Lucide Icons `0.363.0`
- **Presentation Deck Generator:** Python `3.10`, `python-pptx`

---

## 6. Installation & Execution Guide

### Prerequisites
- Node.js (v18.0.0 or higher) & npm
- Git
- Python 3.10+ (for `.pptx` presentation generation)

### Step 1: Install All Dependencies
```bash
# Clone the repository
git clone https://github.com/odiousgraunet/mediledger-poc.git
cd mediledger-poc

# Install dependencies across all modules
npm run setup
```

### Step 2: Start the Local Hardhat EVM Blockchain
In **Terminal 1**:
```bash
npm run blockchain:node
```
*Starts local Ethereum node on `http://127.0.0.1:8545` (Chain ID: 31337).*

### Step 3: Deploy & Seed Smart Contracts
In **Terminal 2**:
```bash
npm run blockchain:deploy
npm run blockchain:seed
```
*Deploys all 4 smart contracts, configures authorizations, and seeds synthetic clinical data.*

### Step 4: Start the Backend REST Gateway
In **Terminal 3**:
```bash
npm run backend:start
```
*API Gateway running on `http://localhost:5000` (Health check: `/api/health`).*

### Step 5: Start the Frontend Application
In **Terminal 4**:
```bash
npm run frontend:dev
```
*Frontend running on `http://localhost:3000`.*

---

## 7. Automated Testing & Verification Audit

The system features automated testing across smart contracts, backend APIs, and end-to-end integration:

```bash
# 1. Run Smart Contract Tests (Chai / Mocha on Hardhat)
npm run blockchain:test

# 2. Run Backend Unit Tests
npm run backend:test

# 3. Run 10-Step Multi-Role End-to-End System Audit
cd blockchain
npx hardhat run scripts/run_e2e_audit.js
```

### Test Results Summary:
- **Smart Contract Unit Tests:** **23 / 23 Passing (100% Success)**
- **Backend API & Hashing Tests:** **4 / 4 Passing (100% Success)**
- **End-to-End Multi-Role Audit:** **10 / 10 Checks Passing (100% Success)**
  * AccessControlManager RBAC: PASSED
  * Rogue Attacker Blocked: PASSED
  * Record SHA-256 Fingerprint Anchoring: PASSED
  * Time-Bound Consent Request: PASSED
  * Patient 48h Grant: PASSED
  * Authentic Document Verification: PASSED
  * Inflated Bill Fraud Auto-Rejection: PASSED
  * Instant Patient Revocation: PASSED
  * Append-Only Audit Logging: PASSED

---

## 8. Repository Structure

```
mediledger-poc/
├── .gitignore
├── .env.example
├── README.md                          # Root academic submission README
├── package.json                       # Monorepo execution orchestration
│
├── blockchain/                        # Hardhat Ethereum EVM Project
│   ├── contracts/
│   │   ├── AccessControlManager.sol   # Multi-role RBAC governance
│   │   ├── RecordRegistry.sol         # SHA-256 document fingerprint registry
│   │   ├── ConsentManager.sol         # Granular time-bound patient consent
│   │   └── AuditLogger.sol            # Immutable append-only audit trail
│   ├── scripts/
│   │   ├── deploy.js                  # Deployment script
│   │   ├── seed.js                    # Seeding roles and synthetic data
│   │   └── run_e2e_audit.js           # 10-step automated system verification
│   ├── test/
│   │   ├── AccessControl.test.js      # RBAC test suite
│   │   ├── RecordRegistry.test.js     # Fingerprint & verification test suite
│   │   ├── ConsentManager.test.js     # Consent grant/expiry/revocation tests
│   │   └── EndToEnd.test.js           # Full 4-role integration test
│   ├── hardhat.config.js
│   └── package.json
│
├── backend/                           # Node.js Express REST API Gateway
│   ├── src/
│   │   ├── config/
│   │   │   ├── blockchain.js          # Ethers.js provider and contract instances
│   │   │   └── storage.js             # Off-chain document storage engine
│   │   ├── controllers/
│   │   │   ├── authController.js      # Stakeholder identity management
│   │   │   ├── recordController.js    # Off-chain storage & on-chain anchoring
│   │   │   ├── consentController.js   # Consent request, grant & revocation
│   │   │   ├── verifyController.js    # Cryptographic hash verification & fraud simulation
│   │   │   ├── auditController.js     # Audit trail querying
│   │   │   └── analyticsController.js # MBA finance ROI metrics
│   │   ├── routes/
│   │   ├── utils/
│   │   │   └── cryptoUtils.js         # Canonical JSON & SHA-256 utility
│   │   └── server.js
│   ├── tests/
│   │   └── api.test.js                # Backend automated tests
│   └── package.json
│
├── frontend/                          # React + Vite + Tailwind CSS Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Brand header, active role badge, switcher
│   │   │   ├── RecordCard.jsx         # Card with SHA-256 badge and actions
│   │   │   ├── RecordDetailModal.jsx  # Structured clinical EHR viewer
│   │   │   ├── ConsentModal.jsx       # 1h / 24h / 7d consent authorization
│   │   │   └── VerificationModal.jsx  # Live side-by-side hash comparison
│   │   ├── views/
│   │   │   ├── PatientDashboard.jsx   # Sovereign consent & record portfolio
│   │   │   ├── HospitalDashboard.jsx  # Record registration & anchoring
│   │   │   ├── LabDashboard.jsx       # Diagnostic report issuance
│   │   │   ├── InsuranceDashboard.jsx # Claims adjudication & fraud detection
│   │   │   ├── AnalyticsDashboard.jsx # MBA finance ROI calculator & ABDM matrix
│   │   │   └── AuditExplorer.jsx      # Live ledger event stream
│   │   ├── services/
│   │   │   └── api.js                 # API connector
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── data/
│   └── synthetic/                     # Realistic clinical FHIR-aligned datasets
│       ├── patient1_discharge_summary.json
│       ├── patient1_blood_panel.json
│       ├── patient1_mri_lumbar.json
│       ├── patient2_cardiac_echo.json
│       └── patient2_oncology_report.json
│
├── docs/                              # Academic & Technical Documentation
│   ├── TECHNICAL_DOCUMENTATION.md     # Architecture, APIs, security, testing
│   ├── BUSINESS_CASE_REPORT.md        # MBA health economics, ABDM benchmark, ROI
│   ├── PRESENTATION_DECK.md           # 14 academic presentation slides
│   └── DEMO_GUIDE.md                  # Click-by-click jury demonstration guide
│
└── presentation/                      # Final Presentation Deliverables
    ├── generate_presentation.py       # Python script generating .pptx
    ├── presentation.html              # Standalone interactive browser slide deck
    └── MediLedger_Final_Presentation.pptx # 14-slide Microsoft PowerPoint file
```

---

## 9. Academic Deliverables Index

| Deliverable | File Path | Description |
|---|---|---|
| **Technical Documentation** | [`docs/TECHNICAL_DOCUMENTATION.md`](docs/TECHNICAL_DOCUMENTATION.md) | In-depth architecture, data flow, smart contract ABIs, security analysis, test results |
| **Business Case Report** | [`docs/BUSINESS_CASE_REPORT.md`](docs/BUSINESS_CASE_REPORT.md) | MBA Finance standard: problem statement, ABDM comparison, 3-year financial model, ROI |
| **Presentation Deck (Markdown)** | [`docs/PRESENTATION_DECK.md`](docs/PRESENTATION_DECK.md) | 14 structured presentation slides with speaker notes |
| **Presentation Deck (PowerPoint)**| [`presentation/MediLedger_Final_Presentation.pptx`](presentation/MediLedger_Final_Presentation.pptx) | Professional 14-slide PowerPoint deck ready for academic defense |
| **Interactive Slide Deck (HTML)** | [`presentation/presentation.html`](presentation/presentation.html) | Standalone browser-based presentation deck |
| **Demonstration Guide** | [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md) | 5-Act step-by-step evaluator walkthrough |
| **Smart Contract Test Suite** | [`blockchain/test/`](blockchain/test/) | 23 automated Chai/Mocha tests covering RBAC, registry, consent, E2E |
| **End-to-End System Audit** | [`blockchain/scripts/run_e2e_audit.js`](blockchain/scripts/run_e2e_audit.js) | Automated 10-step verification audit script |

---

## 10. Known Limitations & Production Roadmap

1. **Deployment Network:** Current proof-of-concept executes on an EVM-compatible Hardhat devnet. Production deployment roadmap specifies an enterprise Layer-2 rollup (e.g., Polygon CDK, Arbitrum Orbit) for transaction throughput $> 2,000\text{ TPS}$ with sub-cent gas fees.
2. **Decentralized Storage:** Transitioning local off-chain storage to an encrypted IPFS / Filecoin cluster utilizing Threshold Proxy Re-Encryption (PRE).
3. **Zero-Knowledge Proofs (ZK-SNARKs):** Future scope includes ZK-verifications allowing insurers to verify that an invoice does not exceed approved policy limits without decrypting proprietary clinical notes.

---

## 11. Academic Declaration

This project was developed as an autonomous academic prototype for an MBA in Finance degree track. All clinical data used throughout testing and demonstration is **100% synthetic** (FHIR R4-aligned). No real patient Protected Health Information (PHI) was accessed, stored, or processed. All business case financial projections are labeled with clear hypothetical assumptions.
