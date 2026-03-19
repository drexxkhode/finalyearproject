const db     = require('../config/db');
const crypto = require('crypto');
const axios  = require('axios');
const redis  = require('../config/RedisClient');
const sendEmail = require('../utils/userMail');

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
         AND payment_status = 'paid'
         AND is_deleted = 0`,
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

    // Email must be verified before payment can be initiated
    if (!req.user?.email_verified) {
      return res.status(403).json({
        message: 'Please verify your email address before booking.',
        code:    'EMAIL_NOT_VERIFIED',
      });
    }

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
         AND payment_status = 'paid'
         AND is_deleted = 0`,
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

    // ref field differs by event type — pick the right one for the log
    const _logRef = event.data?.reference               // charge.success
                 ?? event.data?.transaction_reference   // refund.pending / refund.processed
                 ?? '—'
    console.log(`[webhook] ✅ Verified — event=${event.event} ref=${_logRef} amount=${event.data?.amount}`);

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

        if (result.insertId) {
          bookingIds.push(result.insertId);
        }

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

      // Invalidate dashboard cache — total_bookings + total_payments changed
      await redis.del(redis.KEYS.dashboard(p.turf_id));
      console.log(`[cache] Invalidated dashboard:${p.turf_id} after new booking`);

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

      // ── Send booking confirmation email to user ────────────────────────
      // Non-blocking — don't fail webhook processing if email fails
      try {
        const [userRow] = await db.query(
          'SELECT name, email FROM users WHERE id = ? LIMIT 1', [p.user_id]
        );
        const [turfRow] = await db.query(
          'SELECT name FROM turfs WHERE id = ? LIMIT 1', [p.turf_id]
        );

        if (userRow.length && userRow[0].email) {
          const userName  = userRow[0].name;
          const userEmail = userRow[0].email;
          const turfName  = turfRow[0]?.name ?? 'TurfArena Facility';
          const bookDate  = new Date(p.booking_date).toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          });

          // Build slot list rows
          const slotRows = bookingIds.map((id, idx) => {
            const s   = slots[idx];
            const sr  = slotMap[s?.time_slot_id];
            const lbl = sr
              ? `${sr.start_time.slice(0, 5)} – ${sr.end_time.slice(0, 5)}`
              : 'Slot';
            const amt = parseFloat(s?.amount ?? (amountGHS / slots.length)).toFixed(2);
            return `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #e9ecef;font-size:14px;">${lbl}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e9ecef;font-size:14px;text-align:right;font-weight:700;color:#0d6efd;">₵${amt}</td>
            </tr>`;
          }).join('');

          await sendEmail(userEmail, `Booking Confirmed — ${turfName}`, `
  <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:40px 0;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0"
           style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="text-align:center;padding:28px 20px 10px;">
          <img src="https://res.cloudinary.com/daionfxml/image/upload/v1773645071/turfArena_transparent_kqf2ru.png"
               alt="TurfArena" width="110" style="display:block;margin:0 auto;" />
        </td>
      </tr>
      <tr>
        <td style="background:#0d6efd;padding:20px;text-align:center;">
          <h2 style="color:#fff;margin:0;font-size:20px;">✅ Booking Confirmed!</h2>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 30px 10px;">
          <p style="font-size:16px;margin:0 0 6px 0;">
            Hi <span style="color:#0d6efd;font-weight:bold;">${userName}</span>,
          </p>
          <p style="font-size:14px;color:#555;margin:0 0 20px 0;">
            Your booking has been confirmed. See you on the pitch!
          </p>

          <!-- Booking summary card -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f8faff;border:1px solid #d0e0ff;border-radius:10px;margin-bottom:20px;">
            <tr>
              <td style="padding:16px 20px;">
                <div style="font-size:13px;color:#6c757d;text-transform:uppercase;
                            letter-spacing:1px;font-weight:700;margin-bottom:12px;">
                  Booking Details
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px;color:#6c757d;padding:4px 0;">Facility</td>
                    <td style="font-size:13px;font-weight:700;text-align:right;padding:4px 0;">${turfName}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#6c757d;padding:4px 0;">Date</td>
                    <td style="font-size:13px;font-weight:700;text-align:right;padding:4px 0;">${bookDate}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#6c757d;padding:4px 0;">Reference</td>
                    <td style="font-size:13px;font-weight:700;text-align:right;padding:4px 0;color:#0d6efd;">${ref}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Slot rows -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #e9ecef;border-radius:8px;margin-bottom:20px;overflow:hidden;">
            <thead>
              <tr style="background:#f8f9fa;">
                <th style="padding:10px 12px;font-size:12px;color:#6c757d;text-align:left;
                           font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                  Time Slot
                </th>
                <th style="padding:10px 12px;font-size:12px;color:#6c757d;text-align:right;
                           font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              ${slotRows}
            </tbody>
            <tfoot>
              <tr style="background:#f0f4ff;">
                <td style="padding:10px 12px;font-weight:800;font-size:14px;">Total</td>
                <td style="padding:10px 12px;font-weight:800;font-size:15px;
                           text-align:right;color:#0d6efd;">₵${amountGHS.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <p style="font-size:13px;color:#888;margin:0;">
            Questions? Contact the facility directly or visit your
            <a href="${process.env.VITE_APP_URL ?? '#'}/mybookings"
               style="color:#0d6efd;text-decoration:none;font-weight:700;">My Bookings</a> page.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafd;padding:20px;text-align:center;">
          <p style="font-size:13px;color:#8a9bb5;margin:0;">
            © ${new Date().getFullYear()}
            <span style="color:#198754;font-weight:bold;">Turf</span><span style="color:#0d6efd;font-weight:bold;">Arena</span>.
            All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </div>
          `);
          console.log(`[webhook] 📧 Confirmation email sent to ${userEmail}`);
        }
      } catch (emailErr) {
        // Never fail webhook for email errors
        console.error('[webhook] Confirmation email failed:', emailErr.message);
      }

      console.log(`[webhook] ✅ Done — ${bookingIds.length} booking(s) saved for ref=${ref}`);
    }

    // ── refund.pending + refund.processed ────────────────────────────────
    // Paystack fires refund.pending first (queued), then refund.processed
    // (money confirmed returned). DB is only updated on refund.processed.
    if (event.event === 'refund.pending' || event.event === 'refund.processed') {

      // Confirmed field from Paystack payload: event.data.transaction_reference
      const ref       = event.data?.transaction_reference ?? null
      const refundGHS = (event.data?.amount ?? 0) / 100;

      if (!ref) {
        console.error(`[webhook] ⚠️  Could not extract ref from ${event.event}:`, JSON.stringify(event.data));
        return;
      }

      // ── refund.pending ───────────────────────────────────────────────────
      if (event.event === 'refund.pending') {
        // In LIVE mode: Paystack fires refund.processed later — wait for it.
        // In TEST mode: refund.processed never fires automatically from Paystack.
        // So in test mode we treat refund.pending as the final confirmation
        // and update the DB immediately, mirroring what live mode will do.
        const isTestMode = (process.env.PAYSTACK_SECRET_KEY ?? '').startsWith('sk_test_')

        if (!isTestMode) {
          console.log(`[webhook] ↩️  Refund pending ref=${ref} ₵${refundGHS} — live mode, waiting for refund.processed`);
          return;
        }

        console.log(`[webhook] ↩️  Refund pending ref=${ref} ₵${refundGHS} — test mode, simulating delay then treating as processed`);
        // Delay before processing so demo doesn't show instant status flip
        const TEST_REFUND_DELAY_MS = 25000; //25 seconds
        await new Promise(resolve => setTimeout(resolve, TEST_REFUND_DELAY_MS));
        // Fall through to the refund.processed logic below
      }

      // ── refund.processed — money confirmed returned, update DB ───────────
      console.log(`[webhook] ↩️  Refund processed ref=${ref} ₵${refundGHS}`);

      // Update cancelled booking rows for this ref that are still refund_pending
      await db.query(
        `UPDATE bookings
         SET payment_status = 'refunded'
         WHERE paystack_ref = ? AND status = 'cancelled' AND payment_status = 'refund_pending'`,
        [ref]
      );

      // Check if ALL booking rows for this ref are now settled
      const [remaining] = await db.query(
        `SELECT
           SUM(CASE WHEN status = 'cancelled' AND payment_status = 'refund_pending' THEN 1 ELSE 0 END) AS still_pending,
           SUM(CASE WHEN status = 'confirmed' AND payment_status = 'paid' THEN 1 ELSE 0 END) AS still_active
         FROM bookings WHERE paystack_ref = ?`,
        [ref]
      );

      const stillPending = parseInt(remaining[0]?.still_pending ?? 0);
      const stillActive  = parseInt(remaining[0]?.still_active  ?? 0);

      if (stillPending === 0 && stillActive === 0) {
        await db.query(
          `UPDATE payments SET payment_status = 'refunded', paystack_event = 'refund.processed'
           WHERE paystack_ref = ?`,
          [ref]
        );
        console.log(`[webhook] Payment ref=${ref} fully refunded`);
      } else if (stillPending === 0 && stillActive > 0) {
        await db.query(
          `UPDATE payments SET payment_status = 'partial_refund', paystack_event = 'refund.processed'
           WHERE paystack_ref = ?`,
          [ref]
        );
        console.log(`[webhook] Payment ref=${ref} partial refund — ${stillActive} slot(s) still active`);
      }
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

    // ── Guard: already cancelled ───────────────────────────────────────────
    if (booking.status === 'cancelled')
      return res.status(400).json({ message: 'Booking is already cancelled' });

    // ── Guard: only paid bookings can be cancelled ─────────────────────────
    if (booking.payment_status !== 'paid')
      return res.status(400).json({ message: 'Only paid bookings can be cancelled' });

    // ── Fetch authoritative start_time from time_slots ────────────────────
    const [tsRows] = await db.query(
      `SELECT start_time FROM time_slots WHERE id = ? LIMIT 1`,
      [booking.time_slot_id]
    );
    const dateOnly       = String(booking.booking_date).slice(0, 10);
    const startTime      = tsRows.length ? tsRows[0].start_time.slice(0, 5) : booking.slot_label.slice(0, 5);
    const slotDateTime   = new Date(`${dateOnly}T${startTime}:00`);
    const hoursUntilSlot = (slotDateTime - Date.now()) / (1000 * 60 * 60);

    // ── Guard: reject cancellation for already-passed slots ───────────────
    // The client hides the button, but this server-side check prevents
    // direct API calls from cancelling a passed booking.
    if (hoursUntilSlot < 0)
      return res.status(400).json({
        message: 'Cannot cancel a booking whose slot time has already passed.',
      });

    // ── Calculate penalty and refund ──────────────────────────────────────
    let penaltyPct;
    if      (hoursUntilSlot < 6)  penaltyPct = 100;
    else if (hoursUntilSlot < 24) penaltyPct = 50;
    else                           penaltyPct = 0;

    const paidAmount   = parseFloat(booking.amount);
    const penaltyAmt   = parseFloat(((penaltyPct / 100) * paidAmount).toFixed(2));
    const refundAmount = parseFloat((paidAmount - penaltyAmt).toFixed(2));

    // ── No refund case (100% penalty) — cancel immediately ────────────────
    if (refundAmount === 0) {
      await db.query(
        `UPDATE bookings
         SET status = 'cancelled', cancelled_at = NOW(),
             refund_amount = 0, payment_status = 'no_refund'
         WHERE id = ?`,
        [booking_id]
      );

      await redis.del(redis.KEYS.dashboard(booking.turf_id));
      console.log(`[cancel] Booking ${booking_id} cancelled — no refund (within 6 hrs)`);
      return res.json({
        message:          'Booking cancelled — no refund applies (within 6 hours of slot)',
        refund_amount:    0,
        penalty_pct:      penaltyPct,
        refund_initiated: false,
      });
    }

    // ── Refund case — call Paystack FIRST, then update DB ─────────────────
    // IMPORTANT: DB is only updated after Paystack confirms the refund was
    // accepted. If Paystack rejects (wrong ref, key mismatch, network error),
    // the booking stays 'confirmed' and 'paid' — the user can try again.
    let paystackRefundRef = null;
    try {
      const refRes = await axios.post(
        'https://api.paystack.co/refund',
        {
          transaction: booking.paystack_ref,
          amount:      Math.round(refundAmount * 100),  // pesewas
        },
        {
          headers: {
            Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!refRes.data?.status) {
        // Paystack returned a failure response
        const msg = refRes.data?.message ?? 'Paystack refund request failed';
        console.error(`[cancel] Paystack rejected refund for booking ${booking_id}: ${msg}`);
        return res.status(502).json({ message: `Refund could not be initiated: ${msg}` });
      }

      paystackRefundRef = refRes.data?.data?.id ?? null;
      console.log(`[cancel] Paystack refund accepted — booking=${booking_id} ref=${booking.paystack_ref} refundRef=${paystackRefundRef} amount=₵${refundAmount}`);

    } catch (refErr) {
      const msg = refErr.response?.data?.message ?? refErr.message;
      console.error(`[cancel] Paystack refund error for booking ${booking_id}:`, msg);
      // Do NOT update DB — return error so user knows refund wasn't initiated
      return res.status(502).json({
        message: `Could not initiate refund: ${msg}. Your booking has NOT been cancelled. Please try again or contact support.`,
      });
    }

    // ── Paystack accepted — now update DB ─────────────────────────────────
    await db.query(
      `UPDATE bookings
       SET status = 'cancelled', cancelled_at = NOW(),
           refund_amount = ?, payment_status = 'refund_pending'
       WHERE id = ?`,
      [refundAmount, booking_id]
    );


    await redis.del(redis.KEYS.dashboard(booking.turf_id));
    console.log(`[cancel] Booking ${booking_id} cancelled — refund_pending ₵${refundAmount}`);

    return res.json({
      message:          'Booking cancelled. Refund is being processed.',
      refund_amount:    refundAmount,
      penalty_pct:      penaltyPct,
      refund_initiated: true,
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
              b.amount, b.status, b.payment_status,b.created_at,
              b.refund_amount, b.paystack_ref,b.is_deleted,
              t.name AS turf, t.id AS turf_id
       FROM bookings b
       LEFT JOIN turfs t ON t.id = b.turf_id
       WHERE b.user_id = ? AND is_deleted=0
       ORDER BY b.created_at DESC`,
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

// ── DELETE /api/bookings/:id ──────────────────────────────────────────────
// Only allows deleting cancelled or completed bookings — not active ones.
// This removes the record from the user's booking history only.
const deleteBooking = async (req, res) => {
  try {
    const user_id    = req.user?.id;
    const booking_id = parseInt(req.params.id);
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await db.query(
      `SELECT id, status, payment_status FROM bookings
       WHERE id = ? AND user_id = ? LIMIT 1`,
      [booking_id, user_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' });

    const booking = rows[0];

    // Block deletion of active paid bookings — must be cancelled first
    if (booking.status === 'confirmed' && booking.payment_status === 'paid')
      return res.status(400).json({
        message: 'Cannot delete an active booking. Cancel it first.',
      });

    // Block deletion if a refund is still in progress
    if (booking.payment_status === 'refund_pending')
      return res.status(400).json({
        message: 'Cannot delete while a refund is being processed.',
      });

    await db.query(`UPDATE  bookings SET is_deleted=1 WHERE id = ? AND user_id = ?`, [booking_id, user_id]);

    return res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error('deleteBooking error:', err);
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

module.exports = { getBookedSlots, initiateBooking, paystackWebhook, cancelBooking, getMyBookings, getBookings, deleteBooking };