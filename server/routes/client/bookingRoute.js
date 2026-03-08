const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getBookedSlots,
} = require('../../controllers/bookingController');

// POST /api/bookings  — create booking (auth required)
router.post('/', auth, createBooking);

// GET  /api/bookings  — get my bookings (auth required)
router.get('/mybookings', auth, getMyBookings);

// GET  /api/bookings/slots?turf_id=X&date=Y  — available slots (public)
router.get('/slots', getBookedSlots);

module.exports = router;