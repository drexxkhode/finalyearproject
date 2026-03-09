const express = require("express");
const {
  getDashboardDetails,
  
} = require("../../controllers/turfController");
const protect = require("../../middleware/auth");
const router = express.Router();

router.get("/total", protect,getDashboardDetails);
module.exports = router;