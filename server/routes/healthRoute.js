// routes/healthRoutes.js
const express = require("express");
const router = express.Router();
const { checkHealth } = require("../controllers/healthChecker");

router.get("/health", checkHealth);

module.exports = router;