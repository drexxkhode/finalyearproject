const db = require('../config/db')

// ── GET /api/slots?turf_id=X ───────────────────────────────────────────────
const getSlots = async (req, res) => {
  try {
    const { turf_id } = req.query
    if (!turf_id) return res.status(400).json({ message: 'turf_id required' })

    const [rows] = await db.query(
      `SELECT id, turf_id, start_time, end_time
       FROM time_slots WHERE turf_id = ? ORDER BY start_time`,
      [turf_id]
    )
    res.json({ slots: rows })
  } catch (err) {
    console.error('getSlots error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ── POST /api/slots — add single slot ─────────────────────────────────────
const addSlot = async (req, res) => {
  try {
    const turf_id  = req.user?.turf_id
    const { start_time, end_time } = req.body

    if (!start_time || !end_time)
      return res.status(400).json({ message: 'start_time and end_time required' })

    if (start_time >= end_time)
      return res.status(400).json({ message: 'end_time must be after start_time' })

    // Check for overlap with existing slots
    const [overlap] = await db.query(
      `SELECT id FROM time_slots
       WHERE turf_id = ? AND NOT (end_time <= ? OR start_time >= ?)`,
      [turf_id, start_time, end_time]
    )
    if (overlap.length)
      return res.status(409).json({ message: 'This slot overlaps with an existing one' })

    const [result] = await db.query(
      `INSERT INTO time_slots (turf_id, start_time, end_time) VALUES (?, ?, ?)`,
      [turf_id, start_time, end_time]
    )

    res.status(201).json({
      slot: { id: result.insertId, turf_id, start_time, end_time }
    })
  } catch (err) {
    console.error('addSlot error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ── POST /api/slots/bulk — bulk generate ──────────────────────────────────
const bulkAddSlots = async (req, res) => {
  try {
    const turf_id = req.user?.turf_id
    const { slots } = req.body

    if (!Array.isArray(slots) || !slots.length)
      return res.status(400).json({ message: 'slots array required' })

    // Delete existing slots for clean slate — warn if any have active bookings
    const [activeBookings] = await db.query(
      `SELECT COUNT(*) AS cnt FROM bookings b
       JOIN time_slots ts ON ts.id = b.time_slot_id
       WHERE ts.turf_id = ? AND b.status != 'cancelled'
         AND b.booking_date >= CURDATE()`,
      [turf_id]
    )
    if (activeBookings[0].cnt > 0)
      return res.status(409).json({
        message: `Cannot bulk replace — ${activeBookings[0].cnt} upcoming active booking(s) exist. Delete slots individually or cancel bookings first.`
      })

    // Safe to wipe and recreate
    await db.query(`DELETE FROM time_slots WHERE turf_id = ?`, [turf_id])

    const values = slots.map(s => [turf_id, s.start_time, s.end_time])
    await db.query(
      `INSERT INTO time_slots (turf_id, start_time, end_time) VALUES ?`,
      [values]
    )

    res.status(201).json({ created: slots.length })
  } catch (err) {
    console.error('bulkAddSlots error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ── PUT /api/slots/:id ─────────────────────────────────────────────────────
const updateSlot = async (req, res) => {
  try {
    const turf_id  = req.user?.turf_id
    const slot_id  = parseInt(req.params.id)
    const { start_time, end_time } = req.body

    if (!start_time || !end_time)
      return res.status(400).json({ message: 'start_time and end_time required' })

    if (start_time >= end_time)
      return res.status(400).json({ message: 'end_time must be after start_time' })

    // Verify belongs to this turf
    const [rows] = await db.query(
      `SELECT id FROM time_slots WHERE id = ? AND turf_id = ?`, [slot_id, turf_id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Slot not found' })

    // Check overlap (exclude self)
    const [overlap] = await db.query(
      `SELECT id FROM time_slots
       WHERE turf_id = ? AND id != ?
         AND NOT (end_time <= ? OR start_time >= ?)`,
      [turf_id, slot_id, start_time, end_time]
    )
    if (overlap.length)
      return res.status(409).json({ message: 'This slot overlaps with an existing one' })

    await db.query(
      `UPDATE time_slots SET start_time = ?, end_time = ? WHERE id = ?`,
      [start_time, end_time, slot_id]
    )

    res.json({ slot: { id: slot_id, turf_id, start_time, end_time } })
  } catch (err) {
    console.error('updateSlot error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ── DELETE /api/slots/:id ──────────────────────────────────────────────────
const deleteSlot = async (req, res) => {
  try {
    const turf_id = req.user?.turf_id
    const slot_id = parseInt(req.params.id)

    const [rows] = await db.query(
      `SELECT id FROM time_slots WHERE id = ? AND turf_id = ?`, [slot_id, turf_id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Slot not found' })

    // Block delete if future bookings exist for this slot
    const [bookings] = await db.query(
      `SELECT id FROM bookings
       WHERE time_slot_id = ? AND status != 'cancelled'
         AND booking_date >= CURDATE()`,
      [slot_id]
    )
    if (bookings.length)
      return res.status(409).json({
        message: `Cannot delete — ${bookings.length} upcoming booking(s) use this slot`
      })

    await db.query(`DELETE FROM time_slots WHERE id = ?`, [slot_id])
    res.json({ message: 'Slot deleted' })
  } catch (err) {
    console.error('deleteSlot error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// ── DELETE /api/slots/all?turf_id=X ───────────────────────────────────────
const deleteAllSlots = async (req, res) => {
  try {
    const turf_id = req.user?.turf_id

    const [activeBookings] = await db.query(
      `SELECT COUNT(*) AS cnt FROM bookings b
       JOIN time_slots ts ON ts.id = b.time_slot_id
       WHERE ts.turf_id = ? AND b.status != 'cancelled'
         AND b.booking_date >= CURDATE()`,
      [turf_id]
    )
    if (activeBookings[0].cnt > 0)
      return res.status(409).json({
        message: `Cannot delete — ${activeBookings[0].cnt} upcoming active booking(s) exist`
      })

    await db.query(`DELETE FROM time_slots WHERE turf_id = ?`, [turf_id])
    res.json({ message: 'All slots deleted' })
  } catch (err) {
    console.error('deleteAllSlots error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getSlots, addSlot, bulkAddSlots, updateSlot, deleteSlot, deleteAllSlots }