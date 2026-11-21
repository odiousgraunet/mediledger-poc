const { getContract, getSignerForRole } = require("../config/blockchain");
const { getDocument } = require("../config/storage");
const { computeSHA256 } = require("../utils/cryptoUtils");

/**
 * Verify document authenticity against blockchain fingerprint
 */
async function verifyRecord(req, res) {
  try {
    const role = req.headers["x-role"] || "insurance";
    const userAddress = req.headers["x-user-address"];
    const { recordId, customContent } = req.body;

    if (!recordId) {
      return res.status(400).json({ error: "recordId is required" });
    }

    const registryContract = await getContract("RecordRegistry");
    const rec = await registryContract.getRecord(recordId);

    const onChainRecord = {
      recordId: rec[0],
      patient: rec[1],
      issuer: rec[2],
      documentHash: rec[3],
      docType: rec[4],
      offchainURI: rec[5],
      createdAt: Number(rec[6]),
      isActive: rec[7]
    };

    let computedHash;
    let contentSource;

    if (customContent) {
      computedHash = computeSHA256(customContent);
      contentSource = "PROVIDED_PAYLOAD";
    } else {
      const fileBuffer = getDocument(onChainRecord.offchainURI);
      if (!fileBuffer) {
        return res.status(404).json({ error: "Off-chain document not found in storage" });
      }
      computedHash = computeSHA256(fileBuffer);
      contentSource = "OFFCHAIN_STORAGE_FILE";
    }

    // Call verifyRecord on smart contract
    const signer = await getSignerForRole(userAddress || role);
    const registryWithSigner = await getContract("RecordRegistry", signer);

    // Static call for return values
    const [isAuthentic, createdAt, issuer, patient, docType] =
      await registryWithSigner.verifyRecord.staticCall(recordId, computedHash);

    // Execute transaction to log on-chain audit event
    const tx = await registryWithSigner.verifyRecord(recordId, computedHash);
    const receipt = await tx.wait();

    res.json({
      verificationResult: {
        isAuthentic,
        status: isAuthentic ? "MATCH_AUTHENTIC" : "INTEGRITY_COMPROMISED",
        recordId,
        onChainHash: onChainRecord.documentHash,
        computedHash,
        hashMatch: onChainRecord.documentHash.toLowerCase() === computedHash.toLowerCase(),
        recordIsActive: onChainRecord.isActive,
        docType,
        issuer,
        patient,
        contentSource,
        verifiedAt: new Date().toISOString(),
        verifier: await signer.getAddress(),
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      }
    });
  } catch (err) {
    console.error("Error in verifyRecord:", err);
    res.status(500).json({ error: "Verification failed", details: err.message });
  }
}

/**
 * Simulate Fraud / Tamper demonstration
 * Takes an authentic record, inflates billing or alters clinical values, computes new SHA-256,
 * and calls blockchain verification to prove fraud detection.
 */
async function simulateTampering(req, res) {
  try {
    const { recordId } = req.body;
    const targetRecordId = recordId || "REC-2026-001";

    const registryContract = await getContract("RecordRegistry");
    const rec = await registryContract.getRecord(targetRecordId);
    const offchainURI = rec[5];
    const originalOnChainHash = rec[3];

    const fileBuffer = getDocument(offchainURI);
    if (!fileBuffer) {
      return res.status(404).json({ error: "Original off-chain file not found" });
    }

    let parsed = JSON.parse(fileBuffer.toString("utf8"));
    const originalData = JSON.parse(JSON.stringify(parsed));

    // Tamper with data: inflate bill or alter diagnosis
    if (parsed.billingSummary) {
      parsed.billingSummary.totalAmountINR = (parsed.billingSummary.totalAmountINR || 50000) + 150000;
      parsed.billingSummary.tamperedNote = "UNAUTHORIZED ALTERATION: Billing inflated by 150,000 INR for illicit claim extraction";
    } else {
      parsed.clinicalDetails = parsed.clinicalDetails || {};
      parsed.clinicalDetails.tamperedPrimaryDiagnosis = "UNAUTHORIZED CLINICAL ALTERATION";
    }

    const authenticHash = computeSHA256(fileBuffer);
    const tamperedHash = computeSHA256(Buffer.from(JSON.stringify(parsed), "utf8"));

    const signer = await getSignerForRole("insurance");
    const registryWithSigner = await getContract("RecordRegistry", signer);

    const [isAuthentic] = await registryWithSigner.verifyRecord.staticCall(targetRecordId, tamperedHash);
    const tx = await registryWithSigner.verifyRecord(targetRecordId, tamperedHash);
    const receipt = await tx.wait();

    res.json({
      simulation: "HEALTHCARE_INSURANCE_FRAUD_TAMPERING_TEST",
      recordId: targetRecordId,
      originalOnChainHash,
      authenticCalculatedHash: authenticHash,
      tamperedHash,
      tamperedModifications: {
        fieldChanged: "billingSummary.totalAmountINR",
        originalValue: originalData.billingSummary ? originalData.billingSummary.totalAmountINR : null,
        tamperedValue: parsed.billingSummary ? parsed.billingSummary.totalAmountINR : null,
        differenceINR: 150000
      },
      blockchainDecision: {
        isAuthentic,
        verificationStatus: isAuthentic ? "PASSED" : "FRAUD_DETECTED_HASH_MISMATCH",
        actionTaken: "Claim Flagged For Fraud Investigation - Auto-Adjudication Blocked",
        auditTransactionHash: receipt.hash
      }
    });
  } catch (err) {
    console.error("Error in simulateTampering:", err);
    res.status(500).json({ error: "Tamper simulation failed", details: err.message });
  }
}

module.exports = {
  verifyRecord,
  simulateTampering
};
