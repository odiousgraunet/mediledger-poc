const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/roles", authController.getRoles);
router.get("/current", authController.getCurrentUser);

module.exports = router;
