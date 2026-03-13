const express   = require('express')
const router    = express.Router()
const adminAuth = require('../../middleware/auth')
const {
  getSlots, addSlot, bulkAddSlots,
  updateSlot, deleteSlot, deleteAllSlots
} = require('../../controllers/timeslotController')

router.get('/',          getSlots)             // public — used by booking page
router.post('/',         adminAuth, addSlot)
router.post('/bulk',     adminAuth, bulkAddSlots)
router.put('/:id',       adminAuth, updateSlot)
router.delete('/all',    adminAuth, deleteAllSlots)
router.delete('/:id',    adminAuth, deleteSlot)

module.exports = router