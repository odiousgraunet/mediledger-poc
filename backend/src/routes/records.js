const express = require("express");
const router = express.Router();
const recordController = require("../controllers/recordController");

router.post("/register", recordController.registerRecord);
router.get("/all", recordController.getAllRecords);
router.get("/patient/:patientAddress", recordController.getPatientRecords);
router.get("/issuer/:issuerAddress", recordController.getIssuerRecords);
router.get("/:recordId", recordController.getRecordById);
router.post("/:recordId/revoke", recordController.revokeRecord);

module.exports = router;
