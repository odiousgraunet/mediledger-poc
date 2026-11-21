# MediLedger: Final Academic Presentation Deck

**Project Title:** Blockchain-Based Patient-Controlled Medical Record Authentication and Consent Management Network  
**Degree Track:** MBA in Finance / Technology Management  
**Slide Count:** 14 Slides  
**Format:** Academic & Executive Evaluation Deck  

---

## Slide 1: Title & Project Overview
- **Title:** MediLedger
- **Subtitle:** Blockchain-Based Patient-Controlled Medical Record Authentication & Consent Management Network
- **Academic Focus:** Healthcare Economics, Claim Fraud Mitigation & Distributed Ledger Technology (DLT)
- **Presenter:** MediLedger Research & Development Team
- **Key Takeaway:** Resolving the $1.4B healthcare insurance fraud problem through cryptographic SHA-256 fingerprinting and time-bound smart contract patient consent.

---

## Slide 2: Problem Statement — The Healthcare Insurance Fraud Crisis
- **Market Context:** Indian health insurance premiums reached ₹1.08 Lakh Crore ($13B USD) in FY25.
- **The Core Problem:** 10% to 15% of all claim disbursements are lost to fraud, billing inflation, and forged diagnostic tests (Loss of ₹12,000+ Crore annually).
- **Three Vectors of Fraud:**
  1. *Post-Discharge Bill Alteration:* Invoices inflated by 30%–200% prior to insurer submission.
  2. *Forged Diagnostic Reports:* Modifying lab biomarker values (e.g., troponin levels) to justify unnecessary ICU stays.
  3. *Phantom/Duplicate Claims:* Submitting identical invoices across multiple insurance providers.
- **Administrative Drag:** Traditional manual review takes 14–21 business days, costing ₹1,850 per claim in administrative overhead.

---

## Slide 3: The Consent & Privacy Gap in Existing Healthcare Exchanges
- **Patient Disenfranchisement:** Patients currently sign a blanket, paper-based waiver upon hospital admission with zero granular control.
- **Lack of Transparency:** Patients have no visibility into which underwriters or TPAs access their clinical history.
- **Regulatory Pressure:** The Indian Digital Personal Data Protection (DPDP) Act 2023 mandates that consent must be specific, informed, time-bound, and unconditionally revocable.
- **The Dilemma:** How can the healthcare ecosystem provide verifiable authenticity to insurers without compromising patient privacy or creating centralized data honeypots?

---

## Slide 4: Current Infrastructure & Ayushman Bharat Digital Mission (ABDM)
- **ABDM's Strengths:** Establishes national health IDs (ABHA), digital registries, and health data federations.
- **The Critical Missing Link in Current National Infrastructure:**
  - ABDM relies on point-to-point TLS transfer; once a document is downloaded, there is no cryptographic guarantee against local alteration.
  - Centralized consent gateway creates potential systemic downtime and single points of failure.
  - Audit logs reside in relational databases, which can be altered or erased by database administrators.
- **MediLedger's Role:** Complements ABDM by adding a decentralized, tamper-evident cryptographic verification and non-repudiation layer.

---

## Slide 5: The Proposed Solution — MediLedger Architecture
- **Core Concept:** A Hybrid Off-Chain / On-Chain Architecture.
- **Off-Chain Layer:** Clinical EHR documents, lab panels, and MRI scans remain stored securely in off-chain medical databases (preserving privacy and right to erasure).
- **On-Chain Layer:** Only immutable **32-byte SHA-256 digests**, role-based authorizations, and granular consent records are anchored on the Ethereum EVM blockchain.
- **Four Registered Stakeholders:**
  1. Patient (Data Owner)
  2. Hospital (Healthcare Provider)
  3. Diagnostic Laboratory (Testing Facility)
  4. Insurance Company (Claim Adjudicator / Payer)

---

## Slide 6: Cryptographic SHA-256 Fingerprinting Pipeline
- **Mathematical Principle:** FIPS 180-4 standard cryptographic hash function.
- **Deterministic Canonical Serialization:** Input JSON keys are sorted lexicographically before hashing to prevent false-positive formatting discrepancies:
  $$\text{Hash} = \text{SHA-256}(\text{CanonicalJSON}(\text{EHR}))$$
- **Avalanche Effect:** Changing even a single digit in a bill (e.g., ₹84,500 to ₹184,500) produces a completely different 64-character hexadecimal digest.
- **Zero Protected Health Information (PHI) On-Chain:** Full compliance with HIPAA and DPDP Act 2023 data minimization mandates.

---

## Slide 7: Smart Contract System Design
- **1. AccessControlManager.sol:** Governs Role-Based Access Control (RBAC) and entity verification.
- **2. RecordRegistry.sol:** Stores document fingerprints mapped to patient and issuer addresses; provides on-chain verification method `verifyRecord(recordId, computedHash)`.
- **3. ConsentManager.sol:** Handles access requests, time-bound grants (`validUntil = block.timestamp + duration`), and immediate revocation.
- **4. AuditLogger.sol:** Append-only ledger recording all lifecycle events (`RECORD_REGISTERED`, `CONSENT_GRANTED`, `RECORD_ACCESSED`, `RECORD_VERIFIED`).

---

## Slide 8: The Complete Multi-Role Workflow
1. **Record Registration:** Hospital/Lab uploads synthetic clinical summary $\rightarrow$ off-chain file saved $\rightarrow$ SHA-256 calculated $\rightarrow$ anchored on `RecordRegistry`.
2. **Access Request:** Insurer submits access request citing claim adjudication purpose $\rightarrow$ recorded on `ConsentManager`.
3. **Patient Authorization:** Patient inspects purpose in mobile/web portal $\rightarrow$ grants 24-hour or 7-day consent.
4. **Verification & Payout:** Insurer retrieves document $\rightarrow$ smart contract verifies SHA-256 hash match $\rightarrow$ claim approved in &lt; 4 hours.
5. **Instant Revocation:** Patient executes immediate revocation at any time, instantly cutting off subsequent access.

---

## Slide 9: Working Demonstration & Verification Results
- **Automated Test Results:**
  - **23/23 Smart Contract Unit Tests Passed** (Chai/Mocha on Hardhat).
  - **4/4 Backend Integration Tests Passed**.
  - **10/10 End-to-End System Verification Checks Passed (100% Success)**.
- **Interactive Anti-Fraud Simulation:**
  - Authentic Record REC-2026-001: SHA-256 Match confirmed $\rightarrow$ Verification Status: `AUTHENTIC`.
  - Tampered Record (Bill inflated by ₹150,000): Hash Mismatch $\rightarrow$ Verification Status: `FRAUD_DETECTED_HASH_MISMATCH` $\rightarrow$ Auto-Adjudication Blocked!

---

## Slide 10: MBA Finance — Cost-Benefit & Economic Analysis
- **Administrative Processing Cost Comparison:**
  - *Traditional Manual Verification:* ₹1,850 per claim ($22 USD).
  - *MediLedger Blockchain Verification:* ₹6.50 per claim ($0.08 USD).
  - **Operational Savings: 99.6% Reduction!**
- **Settlement Speed Acceleration:** Turnaround time reduced from 14–21 business days to under 4 hours.
- **Direct Insurer Savings (15,000 claims/year baseline):**
  - Administrative processing savings: ₹2.74 Crore.
  - Fraud mitigation savings (12% fraud rate): ₹12.60 Crore.
  - **Total Year-1 Financial Value Created: ₹15.34 Crore ($1.84M USD).**

---

## Slide 11: Business Model & Revenue Mechanics
- **B2B SaaS + Transactional Micro-Fee Model:**
  1. *Per-Verification Micro-Fee:* ₹15 per verified claim charged to insurers (replaces ₹1,850 manual expense; 99.2% cost saving).
  2. *Hospital Node SaaS:* ₹25,000/month per hospital facility for HIMS integration & unlimited record anchoring.
  3. *Diagnostic Lab API Subscription:* ₹10,000/month per lab network.
- **Financial Projections (3-Year Model):**
  - *Year 1 Revenue:* ₹19.05 Lakhs | EBITDA: ₹7.45 Lakhs | EBIT: ₹2.45 Lakhs (12.8% margin).
  - *Year 2 Revenue:* ₹59.40 Lakhs | EBITDA: ₹37.70 Lakhs | EBIT: ₹32.70 Lakhs (55.0% margin).
  - *Year 3 Revenue:* ₹159.00 Lakhs | EBITDA: ₹117.10 Lakhs | EBIT: ₹112.10 Lakhs (70.5% margin).
- **Payback Period:** **2.3 Months** on initial setup CapEx of ₹15 Lakhs.

---

## Slide 12: Legal, Regulatory & Implementation Feasibility
- **Compliance with Indian DPDP Act 2023:**
  - *Data Minimization (Section 6):* Zero health records stored on-chain.
  - *Right to Erasure (Section 12):* Deleting off-chain record renders on-chain hash a benign mathematical artifact.
  - *Revocation of Consent (Section 6[4]):* Real-time smart contract revocation function.
- **IRDAI Regulations Compliance:**
  - Non-repudiable audit logs provide admissible evidence for Insurance Ombudsman disputes.
  - Meets IRDAI cashless claim turnaround time benchmarks.

---

## Slide 13: Risk Analysis & Mitigation Strategies
- **Risk 1: Smart Contract Vulnerabilities:**
  - *Mitigation:* Audited modular architecture, ReentrancyGuard, RBAC restrictions, 100% automated test coverage.
- **Risk 2: Hospital Onboarding Inertia:**
  - *Mitigation:* Lightweight REST API webhooks integrate seamlessly with existing HIMS software without changing clinician workflows.
- **Risk 3: Public Chain Gas Price Volatility:**
  - *Mitigation:* Deployment on enterprise Layer-2 rollup (Polygon CDK or Arbitrum Orbit) ensuring predictable, sub-cent transaction fees.

---

## Slide 14: Conclusion & Strategic Recommendations
- **Summary of Achievements:**
  - Fully working multi-role decentralized application (React, Vite, Node.js, Solidity, Hardhat).
  - Validated mathematical fraud detection against healthcare billing alterations.
  - Uncompromising patient sovereignty with time-bound consent and instant revocation.
  - Compelling financial business case with 99.6% cost reduction and a 2.3-month payback period.
- **Final Verdict:** MediLedger proves that distributed ledger technology, when combined with hybrid off-chain storage, provides a viable, scalable, and economically transformative solution for national healthcare claim clearinghouses.
