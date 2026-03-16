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

// ── Client routes (public — guests must be able to browse) ──────────────
router.get("/turf-data",        getTurfData);            // Home + Map — no auth required
router.get("/turf-data/:id",    getSingleTurf);          // TurfDetail Gallery — no auth required

module.exports = router;