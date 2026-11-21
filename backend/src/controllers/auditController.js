const { getContract } = require("../config/blockchain");

const ACTION_MAP = [
  "RECORD_REGISTERED",
  "RECORD_ACCESSED",
  "RECORD_VERIFIED",
  "RECORD_REVOKED",
  "CONSENT_REQUESTED",
  "CONSENT_GRANTED",
  "CONSENT_REJECTED",
  "CONSENT_REVOKED",
  "SECURITY_ALERT"
];

async function getRecentLogs(req, res) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const auditContract = await getContract("AuditLogger");

    const rawLogs = await auditContract.getRecentLogs(limit);
    const logs = rawLogs.map((log) => ({
      logId: Number(log.logId),
      recordId: log.recordId,
      actor: log.actor,
      action: ACTION_MAP[Number(log.action)] || "UNKNOWN_ACTION",
      actionCode: Number(log.action),
      detail: log.detail,
      timestamp: Number(log.timestamp),
      formattedTime: new Date(Number(log.timestamp) * 1000).toISOString(),
      status: log.status
    }));

    res.json({ total: logs.length, logs });
  } catch (err) {
    console.error("Error in getRecentLogs:", err);
    res.status(500).json({ error: "Failed to fetch audit logs", details: err.message });
  }
}

async function getLogsByRecord(req, res) {
  try {
    const { recordId } = req.params;
    const auditContract = await getContract("AuditLogger");

    const logIds = await auditContract.getLogsByRecord(recordId);
    const logs = [];

    for (const id of logIds) {
      const log = await auditContract.getAuditEntry(id);
      logs.push({
        logId: Number(log.logId),
        recordId: log.recordId,
        actor: log.actor,
        action: ACTION_MAP[Number(log.action)] || "UNKNOWN_ACTION",
        detail: log.detail,
        timestamp: Number(log.timestamp),
        formattedTime: new Date(Number(log.timestamp) * 1000).toISOString(),
        status: log.status
      });
    }

    res.json({ recordId, total: logs.length, logs });
  } catch (err) {
    console.error("Error in getLogsByRecord:", err);
    res.status(500).json({ error: "Failed to fetch record audit logs", details: err.message });
  }
}

module.exports = {
  getRecentLogs,
  getLogsByRecord
};
