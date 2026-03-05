const express = require("express");
const {
    getTurfDetails,
  updateTurfDetails,
  getTurfName
} = require("../../controllers/turfController");
const protect = require("../../middleware/auth");
const router = express.Router();

router.get("/turf-details", protect, getTurfDetails);
router.put("/update-turf", protect, updateTurfDetails);
router.get("/turf-name", protect, getTurfName);

module.exports = router;