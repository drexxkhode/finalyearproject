const express = require("express");
const {
  getBookings,
  deleteBookingByAdmin,
  getBookingsForAdmin
  
} = require("../../controllers/bookingController");
const protect = require("../../middleware/auth");
const router = express.Router();

router.get("/get-bookings", protect,getBookings);
router.delete("/delete-booking/:id", protect, deleteBookingByAdmin);
router.get("/all-bookings", protect, getBookingsForAdmin);
module.exports = router;