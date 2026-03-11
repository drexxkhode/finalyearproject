const express = require('express');
const router  = express.Router();
const auth    = require('../../middleware/auth');
const {
  getBookedSlots,
  initiateBooking,
  paystackWebhook,
  cancelBooking,
  getMyBookings,
  getBookings
} = require('../../controllers/bookingController');

// ── Paystack webhook — MUST come before express.json() middleware ──────────
// Raw body required for HMAC signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paystackWebhook
);

// ── Authenticated routes ───────────────────────────────────────────────────
router.post('/',              auth, initiateBooking);   // initiate (pending)
router.get('/mybookings',               auth, getMyBookings);     // my bookings
router.post('/:id/cancel',    auth, cancelBooking);     // cancel + refund
router.get('/slots',               getBookedSlots);     // available slots (public)
router.get('/get-bookings',            getBookings);     // available slots (public)

module.exports = router;