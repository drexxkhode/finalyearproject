const db = require('../config/db');

// ── GET /api/slots?turf_id=X ───────────────────────────────────────────────
// Returns all time slots defined for a turf (no date/booking context).
// Used by admin or turf setup screens.
const getSlotsByTurf = async (req, res) => {
  try {
    const { turf_id } = req.query;
    if (!turf_id) {
      return res.status(400).json({ message: 'turf_id is required' });
    }

    const [rows] = await db.query(
      `SELECT id, turf_id, start_time, end_time, created_at
       FROM time_slots
       WHERE turf_id = ?
       ORDER BY start_time`,
      [turf_id]
    );

    return res.json({ slots: rows });
  } catch (err) {
    console.error('getSlotsByTurf error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ── POST /api/slots ────────────────────────────────────────────────────────
// Add a single custom slot to a turf.
// Body: { turf_id, start_time, end_time }  (times as "HH:MM" or "HH:MM:SS")
const createSlot = async (req, res) => {
  try {
    const { turf_id, start_time, end_time } = req.body;

    if (!turf_id || !start_time || !end_time) {
      return res.status(400).json({ message: 'turf_id, start_time and end_time are required' });
    }

    // Prevent duplicate slot on same turf
    const [existing] = await db.query(
      `SELECT id FROM time_slots
       WHERE turf_id = ? AND start_time = ? LIMIT 1`,
      [turf_id, start_time]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'A slot with this start time already exists for this turf' });
    }

    const [result] = await db.query(
      `INSERT INTO time_slots (turf_id, start_time, end_time) VALUES (?, ?, ?)`,
      [turf_id, start_time, end_time]
    );

    return res.status(201).json({
      message: 'Slot created',
      slot: { id: result.insertId, turf_id, start_time, end_time },
    });
  } catch (err) {
    console.error('createSlot error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ── POST /api/slots/seed ───────────────────────────────────────────────────
// Bulk-seed standard hourly slots (06:00–22:00) for every turf in the DB
// that doesn't already have slots. Safe to run multiple times.
const seedSlots = async (req, res) => {
  try {
    // Standard operating hours: 06:00 → 22:00 (16 one-hour slots)
    const HOURS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];

    const fmt = (h) => `${String(h).padStart(2, '0')}:00:00`;

    // Get all turf IDs
    const [turfs] = await db.query(`SELECT id FROM turfs`);
    if (turfs.length === 0) {
      return res.json({ message: 'No turfs found', inserted: 0 });
    }

    // Get turf IDs that already have at least one slot
    const [seeded] = await db.query(
      `SELECT DISTINCT turf_id FROM time_slots`
    );
    const seededIds = new Set(seeded.map((r) => r.turf_id));

    const toInsert = turfs.filter((t) => !seededIds.has(t.id));

    if (toInsert.length === 0) {
      return res.json({ message: 'All turfs already have slots', inserted: 0 });
    }

    // Build bulk insert values
    const values = [];
    const params = [];
    toInsert.forEach((t) => {
      HOURS.forEach((h) => {
        values.push('(?, ?, ?)');
        params.push(t.id, fmt(h), fmt(h + 1));
      });
    });

    const [result] = await db.query(
      `INSERT INTO time_slots (turf_id, start_time, end_time) VALUES ${values.join(', ')}`,
      params
    );

    return res.json({
      message: `Slots seeded for ${toInsert.length} turf(s)`,
      inserted: result.affectedRows,
    });
  } catch (err) {
    console.error('seedSlots error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ── DELETE /api/slots/:id ──────────────────────────────────────────────────
// Remove a single slot (admin only). Will fail if bookings reference it.
const deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;

    // Guard: don't delete if active bookings exist for this slot
    const [bookings] = await db.query(
      `SELECT id FROM bookings
       WHERE time_slot_id = ? AND status != 'cancelled' LIMIT 1`,
      [id]
    );
    if (bookings.length > 0) {
      return res.status(409).json({
        message: 'Cannot delete a slot that has active bookings',
      });
    }

    const [result] = await db.query(
      `DELETE FROM time_slots WHERE id = ?`, [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    return res.json({ message: 'Slot deleted' });
  } catch (err) {
    console.error('deleteSlot error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { getSlotsByTurf, createSlot, seedSlots, deleteSlot };