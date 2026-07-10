const express  = require('express');
const router   = express.Router();
const auth     = require('../../middleware/auth');       // client auth
const {
  getReviews,
  createReview,
  createSystemReview,
  getPendingReview,
  dismissReview
} = require('../../controllers/reviewController');

// ── Client routes ──────────────────────────────────────────────────────────
router.get('/',              getReviews);               // public — load enquiries for a turf
router.post('/create',       auth, createReview);              // logged-in user submits enquiry
router.post('/system-reviews',       auth, createSystemReview);              // logged-in user submits system review
router.get('/pending', auth, getPendingReview);
router.post('/dismiss', auth, dismissReview);


module.exports = router;