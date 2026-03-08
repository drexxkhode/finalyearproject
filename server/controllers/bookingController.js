const db = require('../config/db');

// Helper: parse "HH:MM:SS" → integer hour
const toHour = (timeStr) => parseInt(timeStr.split(':')[0], 10);

// Helper: format hour → "HH:MM:SS"
const toTimeStr = (hour) => `${String(hour).padStart(2, '0')}:00:00`;


// ── GET /api/bookings/slots?turf_id=X&date=YYYY-MM-DD ──────────────────────
// Returns all time_slots for this turf, each tagged available or booked.
const getBookedSlots = async (req, res) => {
  try {
    const { turf_id, date } = req.query;
    if (!turf_id || !date) {
      return res.status(400).json({ message: 'turf_id and date are required' });
    }

    // All slots this turf offers
    const [timeSlots] = await db.query(
      `SELECT id, start_time, end_time
       FROM time_slots
       WHERE turf_id = ?
       ORDER BY start_time`,
      [turf_id]
    );

    if (timeSlots.length === 0) {
      return res.json({ slots: [] });
    }

    // Which of those slots are already booked on this date?
    const [booked] = await db.query(
      `SELECT time_slot_id FROM bookings
       WHERE turf_id = ? AND booking_date = ? AND status != 'cancelled'`,
      [turf_id, date]
    );
    const bookedIds = new Set(booked.map((r) => r.time_slot_id));

    const slots = timeSlots.map((s) => ({
      id:         s.id,
      hour:       toHour(s.start_time),
      label:      `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`,
      status:     bookedIds.has(s.id) ? 'booked' : 'available',
      lockedBy:   null,
    }));

    return res.json({ slots });
  } catch (err) {
    console.error('getBookedSlots error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ── POST /api/bookings ─────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const { turf_id, time_slot_id, date, amount } = req.body;

    if (!turf_id || !time_slot_id || !date) {
      return res.status(400).json({ message: 'turf_id, time_slot_id, and date are required' });
    }

    // Verify the time_slot actually belongs to this turf
    const [slotRows] = await db.query(
      `SELECT id, start_time, end_time FROM time_slots
       WHERE id = ? AND turf_id = ? LIMIT 1`,
      [time_slot_id, turf_id]
    );
    if (slotRows.length === 0) {
      return res.status(400).json({ message: 'Invalid slot for this turf' });
    }
    const slot = slotRows[0];

    // Check not already booked
    const [existing] = await db.query(
      `SELECT id FROM bookings
       WHERE turf_id = ? AND booking_date = ? AND time_slot_id = ?
       LIMIT 1`,
      [turf_id, date, time_slot_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'This slot is already booked' });
    }

    const slotLabel = `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`;

    const [result] = await db.query(
      `INSERT INTO bookings (user_id, turf_id, time_slot_id, slot_label, booking_date, amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, turf_id, time_slot_id, slotLabel, date, amount ?? 0]
    );

    return res.status(201).json({
      message: 'Booking confirmed',
      booking: { id: result.insertId },
    });
  } catch (err) {
    console.error('createBooking error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};


// ── GET /api/bookings ──────────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await db.query(
      `SELECT b.id, b.slot_label, b.booking_date AS date, b.amount, b.status,
              t.name AS turf
       FROM bookings b
       LEFT JOIN turfs t ON t.id = b.turf_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [user_id]
    );

    const bookings = rows.map((r) => ({
      ...r,
      id: `BK${String(r.id).padStart(6, '0')}`,
    }));

    return res.json({ bookings });
  } catch (err) {
    console.error('getMyBookings error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createBooking, getMyBookings, getBookedSlots };