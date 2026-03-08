const express = require('express');
const router  = express.Router();
const auth    = require('../../middleware/auth');
const {
  getSlotsByTurf,
  createSlot,
  seedSlots,
  deleteSlot,
} = require('../../controllers/timeslotController');

// GET  /api/slots?turf_id=X   — fetch all slots for a turf (public)
router.get('/',   getSlotsByTurf);

// POST /api/slots             — add a single slot (auth required)
router.post('/',   auth,  createSlot);

// POST /api/slots/seed        — bulk-seed all turfs (auth required)
router.post('/seed', auth, seedSlots);

// DELETE /api/slots/:id       — remove a slot (auth required)
router.delete('/:id', auth, deleteSlot);

module.exports = router;