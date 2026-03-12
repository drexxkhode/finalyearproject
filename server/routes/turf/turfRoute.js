// routes/turfRoute.js  (show your existing file — add the two new lines marked ← NEW)

const express    = require("express");
const router     = express.Router();
const auth       = require("../../middleware/auth");   // your existing admin middleware
const {
  getTurfDetails,
  updateTurfDetails,
  getTurfName,
  getDashboardDetails,
  getTurfData,        // ← NEW
  getSingleTurf,      // ← NEW
} = require("../../controllers/turfController");

// ── Admin routes (protected) ──────────────────────────────────────────────
router.get("/turf-details",     auth, getTurfDetails);
router.put("/update-turf",      auth, updateTurfDetails);
router.get("/turf-name",        auth, getTurfName);
router.get("/dashboard",        auth, getDashboardDetails);

// ── Client routes (auth required) ────────────────────────────────────────
router.get("/turf-data",        auth, getTurfData);      // ← NEW — Home + Map
router.get("/turf-data/:id",    auth, getSingleTurf);    // ← NEW — TurfDetail Gallery

module.exports = router;