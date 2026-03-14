const express = require('express');
const router  = express.Router();
const auth    = require('../../middleware/auth');
const {
  getBookedSlots,
  initiateBooking,
  cancelBooking,
  getMyBookings,
  getBookings,
  deleteBooking,
} = require('../../controllers/bookingController');


// ── Authenticated routes ───────────────────────────────────────────────────
router.post('/',              auth, initiateBooking);   // initiate (pending)
router.get('/mybookings',               auth, getMyBookings);     // my bookings
router.post('/:id/cancel',    auth, cancelBooking);     // cancel + refund
router.get('/slots',               getBookedSlots);     // available slots (public)
router.get('/get-bookings',       auth,     getBookings);
router.delete('/:id',             auth,     deleteBooking);   // delete cancelled/completed booking

module.exports = router;