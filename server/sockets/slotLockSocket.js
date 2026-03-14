/**
 * slotLockSocket.js  —  server/sockets/slotLockSocket.js
 *
 * DESIGN (v2 — advance booking):
 * - Slot locks live in slot_locks (separate table, NOT time_slots)
 * - time_slots is now a pure template table: id, turf_id, start_time, end_time
 * - Each lock row = (time_slot_id, lock_date) — one lock per slot per date
 * - A slot on 2026-03-20 and 2026-03-21 can be locked simultaneously by
 *   different users because they are different rows in slot_locks
 * - Bookings are NEVER written until charge.success webhook fires
 * - On lock expiry: DELETE from slot_locks + clean any orphaned pending_payments
 */

const db = require('../config/db')

const LOCK_DURATION_MS = 5 * 60 * 1000   // 5 minutes

// In-memory timer map — keyed by `${turfId}:${slotId}:${lockDate}`
// The date is part of the key so timers for the same slot on different
// dates never overwrite each other
const timers = {}

function timerKey(turfId, slotId, lockDate) {
  return `${turfId}:${slotId}:${lockDate}`
}
function clearTimer(turfId, slotId, lockDate) {
  const k = timerKey(turfId, slotId, lockDate)
  if (timers[k]) { clearTimeout(timers[k]); delete timers[k] }
}

// ── DB helpers ────────────────────────────────────────────────────────────

async function dbLock(turfId, slotId, lockDate, userId, socketId) {
  const expiresAt = new Date(Date.now() + LOCK_DURATION_MS)
  await db.query(
    `INSERT INTO slot_locks
       (turf_id, time_slot_id, lock_date, locked_by, lock_socket_id, lock_expires_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       locked_by       = VALUES(locked_by),
       lock_socket_id  = VALUES(lock_socket_id),
       lock_expires_at = VALUES(lock_expires_at)`,
    [turfId, slotId, lockDate, userId, socketId, expiresAt]
  )
  return expiresAt
}

async function dbRelease(slotId, lockDate, userId) {
  await db.query(
    `DELETE FROM slot_locks
     WHERE time_slot_id = ? AND lock_date = ? AND locked_by = ?`,
    [slotId, lockDate, userId]
  )
}

// On expiry: delete the lock row and clean any orphaned pending_payments
async function dbExpire(slotId, lockDate) {
  // 1. Get who held this lock before deleting
  const [rows] = await db.query(
    `SELECT locked_by, turf_id FROM slot_locks
     WHERE time_slot_id = ? AND lock_date = ? LIMIT 1`,
    [slotId, lockDate]
  )

  // 2. Delete the lock row
  await db.query(
    `DELETE FROM slot_locks WHERE time_slot_id = ? AND lock_date = ?`,
    [slotId, lockDate]
  )

  // 3. Clean pending_payments if this user has no other active locks on this turf+date
  if (rows.length && rows[0].locked_by) {
    const userId = rows[0].locked_by
    const turfId = rows[0].turf_id

    const [otherLocks] = await db.query(
      `SELECT id FROM slot_locks
       WHERE turf_id = ? AND locked_by = ? AND lock_date = ?
         AND lock_expires_at > NOW()`,
      [turfId, userId, lockDate]
    )

    if (otherLocks.length === 0) {
      await db.query(
        `DELETE FROM pending_payments
         WHERE user_id = ? AND turf_id = ? AND booking_date = ?`,
        [userId, turfId, lockDate]
      )
      console.log(`[slotLock] Cleaned pending_payments user=${userId} turf=${turfId} date=${lockDate}`)
    }
  }
}

// Return active locks for a turf on a specific viewing date only.
// Locks for other dates are invisible to this viewer — no cross-date bleed.
async function getActiveLocks(turfId, viewDate) {
  const today    = new Date().toISOString().split('T')[0]
  const lockDate = (viewDate && viewDate >= today) ? viewDate : today

  // Clean expired rows for this turf+date
  await db.query(
    `DELETE FROM slot_locks
     WHERE turf_id = ? AND lock_date = ? AND lock_expires_at < NOW()`,
    [turfId, lockDate]
  )

  const [rows] = await db.query(
    `SELECT time_slot_id AS slotId, locked_by AS userId, lock_expires_at AS expiresAt
     FROM slot_locks
     WHERE turf_id = ? AND lock_date = ?`,
    [turfId, lockDate]
  )
  return rows
}

// ── Auto-expiry timer ─────────────────────────────────────────────────────

function scheduleExpiry(io, turfId, slotId, lockDate, ms) {
  clearTimer(turfId, slotId, lockDate)
  timers[timerKey(turfId, slotId, lockDate)] = setTimeout(async () => {
    await dbExpire(slotId, lockDate)
    clearTimer(turfId, slotId, lockDate)
    io.to(`turf:${turfId}`).emit('slot:released', {
      turfId, slotId, lockDate, reason: 'expired',
    })
    console.log(`[slotLock] Slot ${slotId} on ${lockDate} expired and released`)
  }, ms)
}

// Restore in-memory timers on server restart for any locks still active in DB
async function restoreTimers(io) {
  try {
    // Clean locks that expired while server was down
    await db.query(`DELETE FROM slot_locks WHERE lock_expires_at < NOW()`)

    // Clean orphaned pending_payments older than 10 minutes
    await db.query(
      `DELETE FROM pending_payments WHERE created_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)`
    )

    // Restore timers for still-active locks
    const [rows] = await db.query(
      `SELECT time_slot_id AS slotId, turf_id AS turfId,
              lock_date AS lockDate, lock_expires_at AS expiresAt
       FROM slot_locks WHERE lock_expires_at > NOW()`
    )
    rows.forEach(({ turfId, slotId, lockDate, expiresAt }) => {
      const ms = new Date(expiresAt).getTime() - Date.now()
      if (ms > 0) scheduleExpiry(io, turfId, slotId, lockDate, ms)
    })
    console.log(`[slotLock] Restored ${rows.length} active lock timer(s)`)
  } catch (e) {
    console.error('[slotLock] Could not restore timers:', e.message)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
module.exports = function registerSlotLockSocket(io) {

  restoreTimers(io)

  io.on('connection', (socket) => {
    const userId = String(
      socket.user?.id ?? socket.user?.userId ?? socket.user?._id ?? socket.id
    )

    // ── JOIN ───────────────────────────────────────────────────────────────
    // Accepts { turfId, viewDate } or a plain turfId for backward compatibility.
    // viewDate determines which date's locks are returned — a user viewing
    // tomorrow only sees tomorrow's locks, never today's.
    socket.on('turf:join', async (payload) => {
      const turfId   = typeof payload === 'object' ? payload.turfId   : payload
      const viewDate = typeof payload === 'object' ? payload.viewDate : null
      socket.join(`turf:${turfId}`)
      try {
        const locks = await getActiveLocks(turfId, viewDate)
        socket.emit('turf:current-locks', { turfId, locks })
      } catch (e) {
        console.error('[slotLock] turf:join error', e.message)
      }
    })

    socket.on('turf:leave', (turfId) => socket.leave(`turf:${turfId}`))

    // ── LOCK ───────────────────────────────────────────────────────────────
    // Expects { turfId, slotId, lockDate }
    // lockDate = the booking date the user selected (today or any future date)
    socket.on('slot:lock', async ({ turfId, slotId, lockDate }) => {
      if (!turfId || !slotId || !lockDate) return

      // Safety net — reject past dates
      const today = new Date().toISOString().split('T')[0]
      if (lockDate < today) {
        socket.emit('slot:lock:ack', {
          ok: false, turfId, slotId, lockDate,
          reason: 'Cannot lock a slot for a past date',
        })
        return
      }

      try {
        // Is this slot already locked on this date by someone else?
        const [existing] = await db.query(
          `SELECT locked_by FROM slot_locks
           WHERE time_slot_id = ? AND lock_date = ?
             AND lock_expires_at > NOW()`,
          [slotId, lockDate]
        )

        if (existing.length && existing[0].locked_by !== userId) {
          socket.emit('slot:lock:ack', {
            ok: false, turfId, slotId, lockDate,
            reason: 'Slot is already locked by another user',
          })
          return
        }

        // Is this slot already permanently booked on this date?
        const [booked] = await db.query(
          `SELECT id FROM bookings
           WHERE time_slot_id = ? AND booking_date = ?
             AND status != 'cancelled' AND payment_status = 'paid'`,
          [slotId, lockDate]
        )
        if (booked.length) {
          socket.emit('slot:lock:ack', {
            ok: false, turfId, slotId, lockDate,
            reason: 'Slot is already booked for this date',
          })
          return
        }

        const expiresAt = await dbLock(turfId, slotId, lockDate, userId, socket.id)
        scheduleExpiry(io, turfId, slotId, lockDate, LOCK_DURATION_MS)

        socket.emit('slot:lock:ack', {
          ok: true, turfId, slotId, lockDate,
          expiresAt: expiresAt.getTime(),
        })

        // Broadcast to all other users in the turf room.
        // lockDate is included so each client can decide whether to apply
        // the visual update (only if their viewDate === lockDate)
        socket.to(`turf:${turfId}`).emit('slot:locked', {
          turfId, slotId, lockDate,
          expiresAt: expiresAt.getTime(),
        })
      } catch (e) {
        console.error('[slotLock] slot:lock error', e.message)
      }
    })

    // ── RELEASE ────────────────────────────────────────────────────────────
    // Expects { turfId, slotId, lockDate }
    socket.on('slot:release', async ({ turfId, slotId, lockDate }) => {
      if (!lockDate) return
      try {
        const [rows] = await db.query(
          `SELECT id FROM slot_locks
           WHERE time_slot_id = ? AND lock_date = ? AND locked_by = ?`,
          [slotId, lockDate, userId]
        )
        if (!rows.length) return

        await dbRelease(slotId, lockDate, userId)
        clearTimer(turfId, slotId, lockDate)

        // Clean pending_payments if user has no remaining locks on this turf+date
        const [otherLocks] = await db.query(
          `SELECT id FROM slot_locks
           WHERE turf_id = ? AND locked_by = ? AND lock_date = ?
             AND lock_expires_at > NOW()`,
          [turfId, userId, lockDate]
        )
        if (otherLocks.length === 0) {
          await db.query(
            `DELETE FROM pending_payments
             WHERE user_id = ? AND turf_id = ? AND booking_date = ?`,
            [userId, turfId, lockDate]
          )
        }

        io.to(`turf:${turfId}`).emit('slot:released', {
          turfId, slotId, lockDate, reason: 'released',
        })
      } catch (e) {
        console.error('[slotLock] slot:release error', e.message)
      }
    })

    // ── CONFIRM — called after successful payment ──────────────────────────
    // Expects { turfId, slotId, lockDate }
    socket.on('slot:confirm', async ({ turfId, slotId, lockDate }) => {
      try {
        if (lockDate) {
          clearTimer(turfId, slotId, lockDate)
          // Delete the now-redundant lock row — booking row is the permanent record
          await db.query(
            `DELETE FROM slot_locks WHERE time_slot_id = ? AND lock_date = ?`,
            [slotId, lockDate]
          )
        }
        io.to(`turf:${turfId}`).emit('slot:booked', { turfId, slotId, lockDate })
      } catch (e) {
        console.error('[slotLock] slot:confirm error', e.message)
      }
    })

    // ── DISCONNECT — locks survive (user may be refreshing) ────────────────
    socket.on('disconnect', () => {
      console.log(`[slotLock] ${userId} disconnected (locks preserved in DB)`)
    })
  })
};