const express = require("express");

const {
 getDirections,
 getMapDetails
} = require("../../controllers/mapController");

const protect = require("../../middleware/auth");

const router = express.Router();

/* AUTH ROUTES */

router.get("/turf-dir/:id",protect, getDirections);
router.get("/turf-data",protect, getMapDetails);

/* USER ROUTES */



module.exports = router;