const express  = require('express');
const router   = express.Router();
const auth     = require('../../middleware/auth');       // client auth
const {
  getEnquiries,
  createEnquiry,
  replyEnquiry,
  getAdminEnquiries,
  markRead,
} = require('../../controllers/enquirieController');

// ── Client routes ──────────────────────────────────────────────────────────
router.get('/',              getEnquiries);               // public — load enquiries for a turf
router.post('/',       auth, createEnquiry);              // logged-in user submits enquiry

// ── Admin routes ───────────────────────────────────────────────────────────
router.get('/admin',          auth, getAdminEnquiries);         // all enquiries for turf
router.post('/:id/reply',     auth, replyEnquiry);              // admin replies
router.patch('/:id/read',     auth, markRead);                  // mark as read

module.exports = router;