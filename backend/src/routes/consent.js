const express = require("express");
const router = express.Router();
const consentController = require("../controllers/consentController");

router.post("/request", consentController.requestAccess);
router.post("/:requestId/grant", consentController.grantConsent);
router.post("/:requestId/reject", consentController.rejectConsent);
router.post("/:requestId/revoke", consentController.revokeConsent);
router.get("/patient/:patientAddress", consentController.getPatientRequests);
router.get("/requester/:requesterAddress", consentController.getRequesterRequests);
router.get("/check", consentController.checkConsent);

module.exports = router;
