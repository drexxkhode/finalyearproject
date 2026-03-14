const db     = require('../config/db');
const crypto = require('crypto');
const axios  = require('axios');


// ── GET /api/bookings/slots ────────────────────────────────────────────────
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

    const [booked] = await db.query(
      `SELECT time_slot_id FROM bookings
       WHERE turf_id = ? AND booking_date = ?
         AND status != 'cancelled'
         AND payment_status = 'paid'`,
      [turf_id, date]
    );
    const bookedIds = new Set(booked.map(r => r.time_slot_id));

    // Mark past slots on today's date — calculated, never written to DB
    const today       = new Date().toISOString().split('T')[0]
    const isToday     = date === today
    const currentHour = new Date().getHours()

    return res.json({
      slots: timeSlots.map(s => {
        const slotHour = parseInt(s.start_time.split(':')[0], 10)
        const isPast   = isToday && slotHour <= currentHour

        return {
          id:       s.id,
          hour:     slotHour,
          label:    `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`,
          status:   bookedIds.has(s.id) ? 'booked' : isPast ? 'past' : 'free',
          lockedBy: null,
        }
      }),
    });
  } catch (err) {
    console.error('getBookedSlots error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ── POST /api/bookings — initiate ─────────────────────────────────────────
const initiateBooking = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const { turf_id, slots, date, total_amount } = req.body;

    if (!turf_id || !slots?.length || !date || !total_amount)
      return res.status(400).json({ message: 'turf_id, slots, date, total_amount required' });

    // Reject bookings for past dates
    const today = new Date().toISOString().split('T')[0];
    if (date < today)
      return res.status(400).json({ message: 'Cannot book a past date' });

    const slotIds = slots.map(s => s.time_slot_id);

    const [slotRows] = await db.query(
      `SELECT id, start_time, end_time FROM time_slots
       WHERE id IN (?) AND turf_id = ?`,
      [slotIds, turf_id]
    );
    if (slotRows.length !== slotIds.length)
      return res.status(400).json({ message: 'One or more slots are invalid for this turf' });

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

    // Verify user holds an active lock on every slot for this date in slot_locks
    const [lockedRows] = await db.query(
      `SELECT time_slot_id FROM slot_locks
       WHERE time_slot_id IN (?)
         AND turf_id = ?
         AND lock_date = ?
         AND locked_by = ?
         AND lock_expires_at > NOW()`,
      [slotIds, turf_id, date, String(user_id)]
    );
    if (lockedRows.length !== slotIds.length)
      return res.status(400).json({
        message: 'One or more slot locks have expired. Please go back and re-select your slots.',
      });

    const paystack_ref = `TF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await db.query(
      `INSERT INTO pending_payments
         (paystack_ref, user_id, turf_id, slots_json, booking_date, total_amount)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         slots_json   = VALUES(slots_json),
         booking_date = VALUES(booking_date),
         total_amount = VALUES(total_amount),
         created_at   = NOW()`,
      [paystack_ref, user_id, turf_id, JSON.stringify(slots), date, total_amount]
    );

    console.log(`[booking] Initiated ref=${paystack_ref} user=${user_id} turf=${turf_id} slots=${JSON.stringify(slotIds)}`);
    return res.status(201).json({ message: 'Ready for payment', paystack_ref });
  } catch (err) {
    console.error('initiateBooking error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ── POST /api/bookings/webhook ─────────────────────────────────────────────
// Registered in server.js with express.raw() BEFORE express.json()
// req.body will be a Buffer — we convert to string for HMAC + parse once
const paystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      console.error('[webhook] PAYSTACK_SECRET_KEY is not set');
      return res.sendStatus(500);
    }

    // ── Diagnostics ───────────────────────────────────────────────────────
    console.log('[webhook] body type:', typeof req.body, '| isBuffer:', Buffer.isBuffer(req.body));
    console.log('[webhook] content-type:', req.headers['content-type']);
    console.log('[webhook] x-paystack-signature present:', !!req.headers['x-paystack-signature']);
    console.log('[webhook] PAYSTACK_SECRET_KEY prefix:', secret.slice(0, 8));

    // ── Get raw string body ───────────────────────────────────────────────
    let rawBody;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
      console.log('[webhook] body is Buffer, byte length:', req.body.length);
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
      console.log('[webhook] body is string, length:', rawBody.length);
    } else {
      // Body was pre-parsed — cannot verify HMAC but log and continue for diagnostics
      console.error('[webhook] body is neither Buffer nor string, type:', typeof req.body);
      rawBody = JSON.stringify(req.body);
    }

    // ── Verify HMAC ───────────────────────────────────────────────────────
    const expectedSig = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    const receivedSig = req.headers['x-paystack-signature'] ?? '';

    console.log('[webhook] expected sig (32 chars):', expectedSig.slice(0, 32));
    console.log('[webhook] received sig (32 chars):', receivedSig.slice(0, 32));
    console.log('[webhook] signatures match:', expectedSig === receivedSig);

    if (expectedSig !== receivedSig) {
      console.error('[webhook] Signature mismatch — rejected');
      return res.sendStatus(401);
    }

    // ── Parse event ───────────────────────────────────────────────────────
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      console.error('[webhook] Invalid JSON body');
      return res.sendStatus(400);
    }

    // Acknowledge immediately — Paystack retries if no 200 within ~30s
    res.sendStatus(200);

    console.log(`[webhook] ✅ Verified — event=${event.event} ref=${event.data?.reference} amount=${event.data?.amount}`);

    // ── charge.success ────────────────────────────────────────────────────
    if (event.event === 'charge.success') {
      const ref       = event.data.reference;
      const amountGHS = event.data.amount / 100;  // Paystack sends pesewas

      // Look up staging row written by initiateBooking
      const [pending] = await db.query(
        `SELECT * FROM pending_payments WHERE paystack_ref = ? LIMIT 1`,
        [ref]
      );

      if (!pending.length) {
        // Check if already processed (duplicate webhook)
        const [existing] = await db.query(
          `SELECT id FROM bookings WHERE paystack_ref = ? LIMIT 1`, [ref]
        );
        if (existing.length) {
          console.log(`[webhook] Duplicate — ref=${ref} already processed`);
        } else {
          console.error(`[webhook] ❌ No pending_payment for ref=${ref}`);
        }
        return;
      }

      const p = pending[0];

      // Parse slots_json safely — guard against '[object Object]' if DB column was wrong type
      let slots;
      try {
        slots = typeof p.slots_json === 'string' ? JSON.parse(p.slots_json) : p.slots_json;
        if (!Array.isArray(slots)) throw new Error('slots_json is not an array');
      } catch (parseErr) {
        console.error('[webhook] slots_json parse failed:', parseErr.message);
        console.error('[webhook] raw slots_json value:', p.slots_json);
        console.error('[webhook] Fix: run ALTER TABLE pending_payments MODIFY COLUMN slots_json JSON NOT NULL on your DB');
        return;
      }
      const slotIds = slots.map(s => s.time_slot_id);

      console.log(`[webhook] Processing ${slots.length} slot(s) for user=${p.user_id} turf=${p.turf_id}`);

      // Get slot labels
      const [slotRows] = await db.query(
        `SELECT id, start_time, end_time FROM time_slots WHERE id IN (?)`,
        [slotIds]
      );
      const slotMap = Object.fromEntries(slotRows.map(r => [r.id, r]));

      // Write one booking row per slot — INSERT IGNORE makes it idempotent
      const bookingIds = [];
      for (const s of slots) {
        const sr        = slotMap[s.time_slot_id];
        const slotLabel = sr
          ? `${sr.start_time.slice(0, 5)} – ${sr.end_time.slice(0, 5)}`
          : 'Unknown';
        const perSlotAmount = parseFloat(s.amount) || parseFloat((amountGHS / slots.length).toFixed(2));

        const [result] = await db.query(
          `INSERT IGNORE INTO bookings
             (user_id, turf_id, time_slot_id, slot_label, booking_date,
              amount, status, payment_status, paystack_ref)
           VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'paid', ?)`,
          [p.user_id, p.turf_id, s.time_slot_id, slotLabel,
           p.booking_date, perSlotAmount, ref]
        );
        if (result.insertId) bookingIds.push(result.insertId);
        console.log(`[webhook] Booking row — slotId=${s.time_slot_id} label=${slotLabel} amount=${perSlotAmount} insertId=${result.insertId}`);
      }

      // Write payments row
      const [payResult] = await db.query(
        `INSERT IGNORE INTO payments
           (turf_id, user_id, booking_ids, paystack_ref, amount, payment_status, paid_at)
         VALUES (?, ?, ?, ?, ?, 'completed', NOW())`,
        [p.turf_id, p.user_id, JSON.stringify(bookingIds), ref, amountGHS]
      );
      console.log(`[webhook] Payment row insertId=${payResult.insertId} amount=₵${amountGHS}`);

      // Delete lock rows — booking rows in `bookings` are now the permanent record
      if (slotIds.length) {
        await db.query(
          `DELETE FROM slot_locks
           WHERE time_slot_id IN (?) AND lock_date = ?`,
          [slotIds, p.booking_date]
        );
      }

      // Clean up staging row
      await db.query(`DELETE FROM pending_payments WHERE paystack_ref = ?`, [ref]);

      // ── Notify admin room in real time ──────────────────────────────────
      const io = global._io  // set in server.js: global._io = io
      if (io) {
        // Get user name for the notification
        const [uRows] = await db.query(
          'SELECT name FROM users WHERE id = ? LIMIT 1', [p.user_id]
        )
        io.to(`admin:${p.turf_id}`).emit('booking:new', {
          ref,
          user:     uRows[0]?.name ?? 'A user',
          slots:    slots.length,
          amount:   amountGHS,
          date:     p.booking_date,
          turf_id:  p.turf_id,
        })
      }

      console.log(`[webhook] ✅ Done — ${bookingIds.length} booking(s) saved for ref=${ref}`);
    }

    // ── refund.processed ──────────────────────────────────────────────────
    if (event.event === 'refund.processed') {
      const ref       = event.data.transaction_reference;
      const refundGHS = event.data.amount / 100;

      const [bRows] = await db.query(
        `SELECT id FROM bookings WHERE paystack_ref = ? AND status = 'cancelled'`, [ref]
      );
      const perSlot = bRows.length
        ? parseFloat((refundGHS / bRows.length).toFixed(2))
        : refundGHS;

      await db.query(
        `UPDATE bookings SET payment_status = 'refunded', refund_amount = ?
         WHERE paystack_ref = ? AND status = 'cancelled'`,
        [perSlot, ref]
      );
      await db.query(
        `UPDATE payments SET payment_status = 'refunded', paystack_event = 'refund.processed'
         WHERE paystack_ref = ?`, [ref]
      );
      console.log(`[webhook] ↩️  Refund processed ref=${ref} ₵${refundGHS}`);
    }

  } catch (err) {
    console.error('[webhook] Unhandled error:', err);
  }
};


// ── POST /api/bookings/:id/cancel ─────────────────────────────────────────
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
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' });

    const booking = rows[0];
    if (booking.status === 'cancelled')
      return res.status(400).json({ message: 'Booking is already cancelled' });
    if (booking.payment_status !== 'paid')
      return res.status(400).json({ message: 'Only paid bookings can be cancelled' });

    // Fetch the authoritative start_time from time_slots instead of
    // parsing slot_label — more reliable and format-independent
    const [tsRows] = await db.query(
      `SELECT start_time FROM time_slots WHERE id = ? LIMIT 1`,
      [booking.time_slot_id]
    );
    // Strip any time component from booking_date (DB may return full ISO string)
    const dateOnly   = String(booking.booking_date).slice(0, 10);
    const startTime  = tsRows.length ? tsRows[0].start_time.slice(0, 5) : booking.slot_label.slice(0, 5);
    const slotDateTime   = new Date(`${dateOnly}T${startTime}:00`);
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
      `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), refund_amount = ?
       WHERE id = ?`,
      [refundAmount, booking_id]
    );
    // slot_locks row was already deleted at payment time — nothing to free here.
    // The booking row's status = 'cancelled' is all that's needed.

    let refundInitiated = false;
    if (refundAmount > 0 && booking.paystack_ref) {
      try {
        const refRes = await axios.post(
          'https://api.paystack.co/refund',
          { transaction: booking.paystack_ref, amount: Math.round(refundAmount * 100) },
          { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
        );
        refundInitiated = refRes.data?.status === true;
      } catch (refErr) {
        console.error('Paystack refund error:', refErr.response?.data ?? refErr.message);
      }
    }

    return res.json({
      message: 'Booking cancelled', refund_amount: refundAmount,
      penalty_pct: penaltyPct, refund_initiated: refundInitiated,
    });
  } catch (err) {
    console.error('cancelBooking error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ── GET /api/bookings ─────────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await db.query(
      `SELECT b.id, b.slot_label, b.booking_date AS date,
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
        b.slot_label,
        b.amount,
        b.status,
        b.payment_status,
        u.name,
        u.email,
        u.contact,
        b.created_at
      FROM bookings b
      JOIN users u 
        ON b.user_id = u.id
      WHERE b.turf_id = ?
      ORDER BY b.created_at DESC
    `, [turf_id]);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

module.exports = { getBookedSlots, initiateBooking, paystackWebhook, cancelBooking, getMyBookings, getBookings };