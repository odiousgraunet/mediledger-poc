const { getContract, getSignerForRole } = require("../config/blockchain");
const { saveDocument, getDocument } = require("../config/storage");
const { computeSHA256 } = require("../utils/cryptoUtils");

/**
 * Register a new medical record
 * Off-chain document saved to storage; SHA-256 fingerprint registered on-chain
 */
async function registerRecord(req, res) {
  try {
    const role = req.headers["x-role"] || "hospital";
    const userAddress = req.headers["x-user-address"];
    const { recordId, patientAddress, docType, clinicalData } = req.body;

    if (!recordId || !patientAddress || !docType || !clinicalData) {
      return res.status(400).json({
        error: "Missing required fields: recordId, patientAddress, docType, clinicalData"
      });
    }

    // 1. Save document off-chain and compute cryptographic hash
    const filename = `${recordId.toLowerCase()}_${Date.now()}.json`;
    const docPayload = typeof clinicalData === "string" ? JSON.parse(clinicalData) : clinicalData;
    const saveResult = saveDocument(filename, docPayload);

    // 2. Call RecordRegistry smart contract
    const signer = await getSignerForRole(userAddress || role);
    const registryContract = await getContract("RecordRegistry", signer);

    const tx = await registryContract.registerRecord(
      recordId,
      patientAddress,
      saveResult.hash,
      docType,
      filename
    );
    const receipt = await tx.wait();

    res.status(201).json({
      message: "Medical record successfully anchored on blockchain",
      recordId,
      patientAddress,
      issuer: await signer.getAddress(),
      documentHash: saveResult.hash,
      docType,
      offchainURI: filename,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (err) {
    console.error("Error in registerRecord:", err);
    res.status(500).json({
      error: "Failed to register record on blockchain",
      details: err.reason || err.message
    });
  }
}

/**
 * Get all records owned by a patient
 */
async function getPatientRecords(req, res) {
  try {
    const { patientAddress } = req.params;
    const registryContract = await getContract("RecordRegistry");

    const recordIds = await registryContract.getPatientRecords(patientAddress);
    const records = [];

    for (const id of recordIds) {
      const rec = await registryContract.getRecord(id);
      records.push({
        recordId: rec[0],
        patient: rec[1],
        issuer: rec[2],
        documentHash: rec[3],
        docType: rec[4],
        offchainURI: rec[5],
        createdAt: Number(rec[6]),
        isActive: rec[7]
      });
    }

    res.json({ patientAddress, records });
  } catch (err) {
    console.error("Error in getPatientRecords:", err);
    res.status(500).json({ error: "Failed to fetch patient records", details: err.message });
  }
}

/**
 * Get all records issued by a healthcare provider or lab
 */
async function getIssuerRecords(req, res) {
  try {
    const { issuerAddress } = req.params;
    const registryContract = await getContract("RecordRegistry");

    const recordIds = await registryContract.getIssuerRecords(issuerAddress);
    const records = [];

    for (const id of recordIds) {
      const rec = await registryContract.getRecord(id);
      records.push({
        recordId: rec[0],
        patient: rec[1],
        issuer: rec[2],
        documentHash: rec[3],
        docType: rec[4],
        offchainURI: rec[5],
        createdAt: Number(rec[6]),
        isActive: rec[7]
      });
    }

    res.json({ issuerAddress, records });
  } catch (err) {
    console.error("Error in getIssuerRecords:", err);
    res.status(500).json({ error: "Failed to fetch issuer records", details: err.message });
  }
}

/**
 * Get all records in the registry
 */
async function getAllRecords(req, res) {
  try {
    const registryContract = await getContract("RecordRegistry");
    const recordIds = await registryContract.getAllRecordIds();

    const records = [];
    for (const id of recordIds) {
      const rec = await registryContract.getRecord(id);
      records.push({
        recordId: rec[0],
        patient: rec[1],
        issuer: rec[2],
        documentHash: rec[3],
        docType: rec[4],
        offchainURI: rec[5],
        createdAt: Number(rec[6]),
        isActive: rec[7]
      });
    }

    res.json({ total: records.length, records });
  } catch (err) {
    console.error("Error in getAllRecords:", err);
    res.status(500).json({ error: "Failed to fetch records", details: err.message });
  }
}

/**
 * Retrieve record with consent verification check
 */
async function getRecordById(req, res) {
  try {
    const { recordId } = req.params;
    const role = req.headers["x-role"] || "patient1";
    const userAddress = req.headers["x-user-address"];

    const registryContract = await getContract("RecordRegistry");
    const consentContract = await getContract("ConsentManager");

    const rec = await registryContract.getRecord(recordId);
    const record = {
      recordId: rec[0],
      patient: rec[1],
      issuer: rec[2],
      documentHash: rec[3],
      docType: rec[4],
      offchainURI: rec[5],
      createdAt: Number(rec[6]),
      isActive: rec[7]
    };

    const callerSigner = await getSignerForRole(userAddress || role);
    const callerAddress = await callerSigner.getAddress();

    const isPatient = callerAddress.toLowerCase() === record.patient.toLowerCase();
    const isIssuer = callerAddress.toLowerCase() === record.issuer.toLowerCase();

    let hasConsent = false;
    if (!isPatient && !isIssuer) {
      // Check on-chain consent
      hasConsent = await consentContract.hasValidConsent(callerAddress, recordId);

      if (!hasConsent) {
        return res.status(403).json({
          error: "ConsentRequired",
          message: "Access Denied: You do not possess active patient consent for this record.",
          recordId,
          patient: record.patient,
          caller: callerAddress
        });
      }

      // Log access in smart contract
      try {
        const consentSignerContract = await getContract("ConsentManager", callerSigner);
        const logTx = await consentSignerContract.logAccessIfAuthorized(callerAddress, recordId);
        await logTx.wait();
      } catch (logErr) {
        console.warn("Could not append access log:", logErr.message);
      }
    }

    // Load off-chain document
    const fileBuffer = getDocument(record.offchainURI);
    let documentContent = null;
    if (fileBuffer) {
      try {
        documentContent = JSON.parse(fileBuffer.toString("utf8"));
      } catch (parseErr) {
        documentContent = fileBuffer.toString("utf8");
      }
    }

    res.json({
      record,
      accessGranted: true,
      accessReason: isPatient ? "DATA_OWNER" : isIssuer ? "RECORD_ISSUER" : "ACTIVE_CONSENT",
      documentContent
    });
  } catch (err) {
    console.error("Error in getRecordById:", err);
    res.status(500).json({ error: "Failed to retrieve record", details: err.message });
  }
}

/**
 * Revoke/Deactivate a medical record
 */
async function revokeRecord(req, res) {
  try {
    const { recordId } = req.params;
    const role = req.headers["x-role"] || "patient1";
    const userAddress = req.headers["x-user-address"];

    const signer = await getSignerForRole(userAddress || role);
    const registryContract = await getContract("RecordRegistry", signer);

    const tx = await registryContract.revokeRecord(recordId);
    const receipt = await tx.wait();

    res.json({
      message: "Record revoked on blockchain",
      recordId,
      transactionHash: receipt.hash
    });
  } catch (err) {
    console.error("Error in revokeRecord:", err);
    res.status(500).json({ error: "Failed to revoke record", details: err.reason || err.message });
  }
}

module.exports = {
  registerRecord,
  getPatientRecords,
  getIssuerRecords,
  getAllRecords,
  getRecordById,
  revokeRecord
};
