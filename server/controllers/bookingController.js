const db     = require('../config/db');
const crypto = require('crypto');
const axios  = require('axios');


// ── GET /api/bookings/slots?turf_id=X&date=YYYY-MM-DD ─────────────────────
const getBookedSlots = async (req, res) => {
  try {
    const { turf_id, date } = req.query;
    if (!turf_id || !date)
      return res.status(400).json({ message: 'turf_id and date are required' });

    const [timeSlots] = await db.query(
      `SELECT id, start_time, end_time FROM time_slots
       WHERE turf_id = ? ORDER BY start_time`,
      [turf_id]
    );
    if (!timeSlots.length) return res.json({ slots: [] });

    // Only PAID bookings block a slot — pending/cancelled never count
    const [booked] = await db.query(
      `SELECT time_slot_id FROM bookings
       WHERE turf_id = ? AND booking_date = ?
         AND status != 'cancelled'
         AND payment_status = 'paid'`,
      [turf_id, date]
    );
    const bookedIds = new Set(booked.map(r => r.time_slot_id));

    return res.json({
      slots: timeSlots.map(s => ({
        id:       s.id,
        hour:     parseInt(s.start_time.split(':')[0], 10),
        label:    `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`,
        status:   bookedIds.has(s.id) ? 'booked' : 'available',
        lockedBy: null,
      })),
    });
  } catch (err) {
    console.error('getBookedSlots error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ── POST /api/bookings — initiate ─────────────────────────────────────────
// ONLY validates + returns a paystack_ref. Does NOT write to bookings table.
// The slot lock in time_slots is the reservation — bookings row is only
// created after charge.success webhook fires.
const initiateBooking = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const { turf_id, slots, date, total_amount } = req.body;
    // slots: [{ time_slot_id, amount }, ...]

    if (!turf_id || !slots?.length || !date || !total_amount)
      return res.status(400).json({ message: 'turf_id, slots, date, total_amount required' });

    // 1. Verify every slot belongs to this turf
    const slotIds = slots.map(s => s.time_slot_id);
    const [slotRows] = await db.query(
      `SELECT id, start_time, end_time FROM time_slots
       WHERE id IN (?) AND turf_id = ?`,
      [slotIds, turf_id]
    );
    if (slotRows.length !== slotIds.length)
      return res.status(400).json({ message: 'One or more slots are invalid for this turf' });

    // 2. Verify none are already paid-booked
    const [alreadyBooked] = await db.query(
      `SELECT time_slot_id FROM bookings
       WHERE turf_id = ? AND booking_date = ?
         AND time_slot_id IN (?)
         AND status != 'cancelled'
         AND payment_status = 'paid'`,
      [turf_id, date, slotIds]
    );
    if (alreadyBooked.length)
      return res.status(409).json({ message: 'One or more slots are already booked' });

    // 3. Verify the user actually holds the lock on every slot
    const [lockedRows] = await db.query(
      `SELECT id FROM time_slots
       WHERE id IN (?)
         AND turf_id = ?
         AND lock_status = 'locked'
         AND locked_by = ?
         AND lock_expires_at > NOW()`,
      [slotIds, turf_id, String(user_id)]
    );
    if (lockedRows.length !== slotIds.length)
      return res.status(400).json({ message: 'One or more slot locks have expired. Please re-select your slots.' });

    // 4. Generate unique ref and store it in a pending_payments staging table
    //    so the webhook can retrieve all context needed to write bookings
    const paystack_ref = `TF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await db.query(
      `INSERT INTO pending_payments
         (paystack_ref, user_id, turf_id, slots_json, booking_date, total_amount)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         slots_json = VALUES(slots_json),
         booking_date = VALUES(booking_date),
         total_amount = VALUES(total_amount),
         created_at = NOW()`,
      [paystack_ref, user_id, turf_id, JSON.stringify(slots), date, total_amount]
    );

    return res.status(201).json({
      message:     'Ready for payment',
      paystack_ref,
    });
  } catch (err) {
    console.error('initiateBooking error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ── POST /api/bookings/webhook ─────────────────────────────────────────────
// Verifies Paystack HMAC → writes bookings rows → releases slot locks
const paystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    console.warn('Webhook: invalid signature — rejected');
    return res.sendStatus(401);
  }

  // Acknowledge immediately — Paystack retries if no 200 within ~30s
  res.sendStatus(200);

  const event = req.body;
  console.log(`Paystack webhook: ${event.event} | ref: ${event.data?.reference}`);

  try {

    // ── charge.success ───────────────────────────────────────────────────
    if (event.event === 'charge.success') {
      const ref       = event.data.reference;
      const amountGHS = event.data.amount / 100;

      // Fetch the pending payment context
      const [pending] = await db.query(
        `SELECT * FROM pending_payments WHERE paystack_ref = ? LIMIT 1`,
        [ref]
      );
      if (!pending.length) {
        console.warn(`Webhook: no pending_payment found for ref ${ref}`);
        return;
      }
      const p     = pending[0];
      const slots = JSON.parse(p.slots_json);  // [{ time_slot_id, amount }]

      // Build slot label map
      const slotIds = slots.map(s => s.time_slot_id);
      const [slotRows] = await db.query(
        `SELECT id, start_time, end_time FROM time_slots WHERE id IN (?)`,
        [slotIds]
      );
      const slotMap = Object.fromEntries(slotRows.map(r => [r.id, r]));

      // Write one confirmed+paid booking row per slot
      const bookingIds = [];
      for (const s of slots) {
        const sr        = slotMap[s.time_slot_id];
        const slotLabel = sr
          ? `${sr.start_time.slice(0, 5)} – ${sr.end_time.slice(0, 5)}`
          : 'Unknown';

        // INSERT IGNORE — idempotent if webhook fires twice
        const [result] = await db.query(
          `INSERT IGNORE INTO bookings
             (user_id, turf_id, time_slot_id, slot_label, booking_date,
              amount, status, payment_status, paystack_ref)
           VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'paid', ?)`,
          [p.user_id, p.turf_id, s.time_slot_id, slotLabel,
           p.booking_date, s.amount, ref]
        );
        if (result.insertId) bookingIds.push(result.insertId);
      }

      // Write ONE payments row covering all booking ids
      await db.query(
        `INSERT IGNORE INTO payments
           (turf_id, user_id, booking_ids, paystack_ref, amount, payment_status, paid_at)
         VALUES (?, ?, ?, ?, ?, 'completed', NOW())`,
        [p.turf_id, p.user_id, JSON.stringify(bookingIds), ref, amountGHS]
      );

      // Release slot locks — they are now permanently booked
      if (slotIds.length) {
        await db.query(
          `UPDATE time_slots
           SET lock_status = 'booked', locked_by = NULL,
               lock_socket_id = NULL, lock_expires_at = NULL
           WHERE id IN (?)`,
          [slotIds]
        );
      }

      // Clean up staging row
      await db.query(`DELETE FROM pending_payments WHERE paystack_ref = ?`, [ref]);

      console.log(`✅ Confirmed ${bookingIds.length} booking(s) for ref ${ref} (₵${amountGHS})`);
    }

    // ── refund.processed ─────────────────────────────────────────────────
    if (event.event === 'refund.processed') {
      const ref       = event.data.transaction_reference;
      const refundGHS = event.data.amount / 100;

      const [bRows] = await db.query(
        `SELECT id FROM bookings WHERE paystack_ref = ? AND status = 'cancelled'`,
        [ref]
      );
      const perSlot = bRows.length
        ? parseFloat((refundGHS / bRows.length).toFixed(2))
        : refundGHS;

      await db.query(
        `UPDATE bookings
         SET payment_status = 'refunded', refund_amount = ?
         WHERE paystack_ref = ? AND status = 'cancelled'`,
        [perSlot, ref]
      );
      await db.query(
        `UPDATE payments
         SET payment_status = 'refunded', paystack_event = 'refund.processed'
         WHERE paystack_ref = ?`,
        [ref]
      );

      console.log(`↩️  Refund processed: ${ref} (₵${refundGHS} / ${bRows.length} slots)`);
    }

  } catch (err) {
    console.error('Webhook processing error:', err);
  }
};


// ── POST /api/bookings/:id/cancel ──────────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const user_id    = req.user?.id;
    const booking_id = parseInt(req.params.id);
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await db.query(
      `SELECT b.*, t.name AS turf_name
       FROM bookings b JOIN turfs t ON t.id = b.turf_id
       WHERE b.id = ? AND b.user_id = ? LIMIT 1`,
      [booking_id, user_id]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Booking not found' });

    const booking = rows[0];

    if (booking.status === 'cancelled')
      return res.status(400).json({ message: 'Booking is already cancelled' });
    if (booking.payment_status !== 'paid')
      return res.status(400).json({ message: 'Only paid bookings can be cancelled' });

    // Penalty logic
    const slotTime       = booking.slot_label.slice(0, 5);
    const slotDateTime   = new Date(`${booking.booking_date}T${slotTime}:00`);
    const hoursUntilSlot = (slotDateTime - Date.now()) / (1000 * 60 * 60);

    let penaltyPct;
    if      (hoursUntilSlot < 0)  penaltyPct = 100;
    else if (hoursUntilSlot < 6)  penaltyPct = 100;
    else if (hoursUntilSlot < 24) penaltyPct = 50;
    else                           penaltyPct = 0;

    const paidAmount   = parseFloat(booking.amount);
    const penaltyAmt   = parseFloat(((penaltyPct / 100) * paidAmount).toFixed(2));
    const refundAmount = parseFloat((paidAmount - penaltyAmt).toFixed(2));

    await db.query(
      `UPDATE bookings
       SET status = 'cancelled', cancelled_at = NOW(), refund_amount = ?
       WHERE id = ?`,
      [refundAmount, booking_id]
    );

    // Free the slot so others can book it
    await db.query(
      `UPDATE time_slots
       SET lock_status = 'free', locked_by = NULL,
           lock_socket_id = NULL, lock_expires_at = NULL
       WHERE id = ?`,
      [booking.time_slot_id]
    );

    let refundInitiated = false;
    if (refundAmount > 0 && booking.paystack_ref) {
      try {
        const refRes = await axios.post(
          'https://api.paystack.co/refund',
          {
            transaction: booking.paystack_ref,
            amount:      Math.round(refundAmount * 100),
          },
          {
            headers: {
              Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        refundInitiated = refRes.data?.status === true;
      } catch (refErr) {
        console.error('Paystack refund error:', refErr.response?.data ?? refErr.message);
      }
    }

    return res.json({
      message:          'Booking cancelled',
      refund_amount:    refundAmount,
      penalty_amount:   penaltyAmt,
      penalty_pct:      penaltyPct,
      refund_initiated: refundInitiated,
    });
  } catch (err) {
    console.error('cancelBooking error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ── GET /api/bookings ──────────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await db.query(
      `SELECT
         b.id, b.slot_label, b.booking_date AS date,
         b.amount, b.status, b.payment_status,
         b.refund_amount, b.paystack_ref,
         t.name AS turf, t.id AS turf_id
       FROM bookings b
       LEFT JOIN turfs t ON t.id = b.turf_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC, b.slot_label ASC`,
      [user_id]
    );

    return res.json({
      bookings: rows.map(r => ({
        ...r,
        id:     `BK${String(r.id).padStart(6, '0')}`,
        raw_id: r.id,
      })),
    });
  } catch (err) {
    console.error('getMyBookings error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
//ADMIN DASHBOARD DATA FETCH.
const getBookings = async (req, res) => {
  try {
    const turf_id = req.user?.turf_id;

    const [rows] = await db.execute(`
      SELECT 
        b.id,
        b.booking_date,
        b.amount,
        u.name,
        u.email,
        u.contact,
        ts.id AS time_slot_id,
        ts.start_time,
        ts.end_time
      FROM bookings b
      JOIN users u 
        ON b.user_id = u.id
      JOIN time_slots ts
        ON b.time_slot_id = ts.id
      WHERE b.turf_id = ?
    `, [turf_id]);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

module.exports = {
  getBookings,
  getBookedSlots,
  initiateBooking,
  paystackWebhook,
  cancelBooking,
  getMyBookings,
};




