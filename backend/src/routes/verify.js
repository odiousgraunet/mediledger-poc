const express = require("express");
const router = express.Router();
const verifyController = require("../controllers/verifyController");

router.post("/record", verifyController.verifyRecord);
router.post("/simulate-tamper", verifyController.simulateTampering);

module.exports = router;
