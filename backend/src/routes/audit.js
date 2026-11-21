const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");

router.get("/logs", auditController.getRecentLogs);
router.get("/record/:recordId", auditController.getLogsByRecord);

module.exports = router;
