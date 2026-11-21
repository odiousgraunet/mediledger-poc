const { getContract, getSignerForRole } = require("../config/blockchain");

/**
 * Submit an access request
 */
async function requestAccess(req, res) {
  try {
    const role = req.headers["x-role"] || "insurance";
    const userAddress = req.headers["x-user-address"];
    const { recordId, purpose } = req.body;

    if (!recordId || !purpose) {
      return res.status(400).json({ error: "recordId and purpose are required" });
    }

    const signer = await getSignerForRole(userAddress || role);
    const consentContract = await getContract("ConsentManager", signer);

    const tx = await consentContract.requestAccess(recordId, purpose);
    const receipt = await tx.wait();

    res.status(201).json({
      message: "Consent request submitted to patient on blockchain",
      recordId,
      purpose,
      requester: await signer.getAddress(),
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (err) {
    console.error("Error in requestAccess:", err);
    res.status(500).json({
      error: "Failed to submit consent request",
      details: err.reason || err.message
    });
  }
}

/**
 * Patient approves consent request with validity duration
 */
async function grantConsent(req, res) {
  try {
    const { requestId } = req.params;
    const { durationInSeconds } = req.body;
    const role = req.headers["x-role"] || "patient1";
    const userAddress = req.headers["x-user-address"];

    const seconds = durationInSeconds ? Number(durationInSeconds) : 86400; // default 24h

    const signer = await getSignerForRole(userAddress || role);
    const consentContract = await getContract("ConsentManager", signer);

    const tx = await consentContract.grantConsent(requestId, seconds);
    const receipt = await tx.wait();

    res.json({
      message: "Consent granted on blockchain",
      requestId: Number(requestId),
      durationInSeconds: seconds,
      transactionHash: receipt.hash
    });
  } catch (err) {
    console.error("Error in grantConsent:", err);
    res.status(500).json({
      error: "Failed to grant consent",
      details: err.reason || err.message
    });
  }
}

/**
 * Patient rejects consent request
 */
async function rejectConsent(req, res) {
  try {
    const { requestId } = req.params;
    const role = req.headers["x-role"] || "patient1";
    const userAddress = req.headers["x-user-address"];

    const signer = await getSignerForRole(userAddress || role);
    const consentContract = await getContract("ConsentManager", signer);

    const tx = await consentContract.rejectConsent(requestId);
    const receipt = await tx.wait();

    res.json({
      message: "Consent request rejected on blockchain",
      requestId: Number(requestId),
      transactionHash: receipt.hash
    });
  } catch (err) {
    console.error("Error in rejectConsent:", err);
    res.status(500).json({
      error: "Failed to reject consent",
      details: err.reason || err.message
    });
  }
}

/**
 * Patient revokes active consent immediately
 */
async function revokeConsent(req, res) {
  try {
    const { requestId } = req.params;
    const role = req.headers["x-role"] || "patient1";
    const userAddress = req.headers["x-user-address"];

    const signer = await getSignerForRole(userAddress || role);
    const consentContract = await getContract("ConsentManager", signer);

    const tx = await consentContract.revokeConsent(requestId);
    const receipt = await tx.wait();

    res.json({
      message: "Consent revoked immediately on blockchain",
      requestId: Number(requestId),
      transactionHash: receipt.hash
    });
  } catch (err) {
    console.error("Error in revokeConsent:", err);
    res.status(500).json({
      error: "Failed to revoke consent",
      details: err.reason || err.message
    });
  }
}

/**
 * Get all consent requests received by a patient
 */
async function getPatientRequests(req, res) {
  try {
    const { patientAddress } = req.params;
    const consentContract = await getContract("ConsentManager");

    const requestIds = await consentContract.getPatientRequests(patientAddress);
    const requests = [];

    const STATUS_MAP = ["NONE", "PENDING", "APPROVED", "REJECTED", "REVOKED", "EXPIRED"];

    for (const id of requestIds) {
      const r = await consentContract.getConsentRequest(id);
      requests.push({
        requestId: Number(r.requestId),
        recordId: r.recordId,
        patient: r.patient,
        requester: r.requester,
        purpose: r.purpose,
        requestedAt: Number(r.requestedAt),
        approvedAt: Number(r.approvedAt),
        validUntil: Number(r.validUntil),
        status: STATUS_MAP[Number(r.status)] || "UNKNOWN"
      });
    }

    res.json({ patientAddress, requests: requests.reverse() });
  } catch (err) {
    console.error("Error in getPatientRequests:", err);
    res.status(500).json({ error: "Failed to fetch patient requests", details: err.message });
  }
}

/**
 * Get all consent requests sent by a requester (Hospital/Insurance)
 */
async function getRequesterRequests(req, res) {
  try {
    const { requesterAddress } = req.params;
    const consentContract = await getContract("ConsentManager");

    const requestIds = await consentContract.getRequesterRequests(requesterAddress);
    const requests = [];

    const STATUS_MAP = ["NONE", "PENDING", "APPROVED", "REJECTED", "REVOKED", "EXPIRED"];

    for (const id of requestIds) {
      const r = await consentContract.getConsentRequest(id);
      requests.push({
        requestId: Number(r.requestId),
        recordId: r.recordId,
        patient: r.patient,
        requester: r.requester,
        purpose: r.purpose,
        requestedAt: Number(r.requestedAt),
        approvedAt: Number(r.approvedAt),
        validUntil: Number(r.validUntil),
        status: STATUS_MAP[Number(r.status)] || "UNKNOWN"
      });
    }

    res.json({ requesterAddress, requests: requests.reverse() });
  } catch (err) {
    console.error("Error in getRequesterRequests:", err);
    res.status(500).json({ error: "Failed to fetch requester requests", details: err.message });
  }
}

/**
 * Check if active valid consent exists
 */
async function checkConsent(req, res) {
  try {
    const { requester, recordId } = req.query;
    if (!requester || !recordId) {
      return res.status(400).json({ error: "requester and recordId query params required" });
    }

    const consentContract = await getContract("ConsentManager");
    const isValid = await consentContract.hasValidConsent(requester, recordId);

    res.json({ requester, recordId, hasValidConsent: isValid });
  } catch (err) {
    console.error("Error in checkConsent:", err);
    res.status(500).json({ error: "Failed to check consent", details: err.message });
  }
}

module.exports = {
  requestAccess,
  grantConsent,
  rejectConsent,
  revokeConsent,
  getPatientRequests,
  getRequesterRequests,
  checkConsent
};
