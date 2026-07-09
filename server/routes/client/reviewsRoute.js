const express  = require('express');
const router   = express.Router();
const auth     = require('../../middleware/auth');       // client auth
const {
  getReviews,
  createReview,
} = require('../../controllers/reviewController');

// ── Client routes ──────────────────────────────────────────────────────────
router.get('/',              getReviews);               // public — load enquiries for a turf
router.post('/',       auth, createReview);              // logged-in user submits enquiry


module.exports = router;