/**
 * slotLockSocket.js  —  server/sockets/slotLockSocket.js
 *
 * DESIGN:
 * - Slot locks live in time_slots (lock_status, locked_by, lock_expires_at)
 * - Bookings are NEVER written until charge.success webhook fires
 * - On lock expiry: free the time_slot lock + delete any pending_payments row
 *   so the slot is fully available for the next user
 */

const db = require('../config/db')

const LOCK_DURATION_MS = 5 * 60 * 1000   // 5 minutes

const timers = {}  // { `${turfId}:${slotId}`: timeoutHandle }

function timerKey(t, s)  { return `${t}:${s}` }
function clearTimer(t, s) {
  const k = timerKey(t, s)
  if (timers[k]) { clearTimeout(timers[k]); delete timers[k] }
}

// ── DB helpers ────────────────────────────────────────────────────────────

async function dbLock(turfId, slotId, userId, socketId) {
  const expiresAt = new Date(Date.now() + LOCK_DURATION_MS)
  await db.query(
    `UPDATE time_slots
     SET lock_status = 'locked', locked_by = ?, lock_socket_id = ?, lock_expires_at = ?
     WHERE id = ? AND turf_id = ?`,
    [userId, socketId, expiresAt, slotId, turfId]
  )
  return expiresAt
}

async function dbRelease(slotId) {
  await db.query(
    `UPDATE time_slots
     SET lock_status = 'free', locked_by = NULL,
         lock_socket_id = NULL, lock_expires_at = NULL
     WHERE id = ?`,
    [slotId]
  )
}

// On expiry: free the lock AND delete any orphaned pending_payments row
// so the slot is immediately available for other users to lock and pay
async function dbExpire(slotId) {
  // 1. Get the user who held the lock (to target their pending_payment)
  const [rows] = await db.query(
    `SELECT locked_by, turf_id FROM time_slots WHERE id = ? LIMIT 1`,
    [slotId]
  )

  // 2. Free the lock
  await db.query(
    `UPDATE time_slots
     SET lock_status = 'free', locked_by = NULL,
         lock_socket_id = NULL, lock_expires_at = NULL
     WHERE id = ?`,
    [slotId]
  )

  // 3. Delete their pending_payments row if it contains this slot
  //    (pending_payment may cover multiple slots — only delete if
  //     ALL of that user's locks have expired, otherwise leave it)
  if (rows.length && rows[0].locked_by) {
    const userId = rows[0].locked_by
    const turfId = rows[0].turf_id

    // Check if this user has any other active locks on this turf
    const [otherLocks] = await db.query(
      `SELECT id FROM time_slots
       WHERE turf_id = ? AND locked_by = ?
         AND lock_status = 'locked' AND lock_expires_at > NOW()
         AND id != ?`,
      [turfId, userId, slotId]
    )

    if (otherLocks.length === 0) {
      // No other locks — safe to wipe their pending_payments for this turf
      await db.query(
        `DELETE FROM pending_payments
         WHERE user_id = ? AND turf_id = ?`,
        [userId, turfId]
      )
      console.log(`[slotLock] Cleaned pending_payments for user ${userId} turf ${turfId}`)
    }
  }
}

// Clear expired locks and return all active ones for a turf
async function getActiveLocks(turfId) {
  await db.query(
    `UPDATE time_slots
     SET lock_status = 'free', locked_by = NULL,
         lock_socket_id = NULL, lock_expires_at = NULL
     WHERE turf_id = ? AND lock_status = 'locked' AND lock_expires_at < NOW()`,
    [turfId]
  )
  const [rows] = await db.query(
    `SELECT id AS slotId, locked_by AS userId, lock_expires_at AS expiresAt
     FROM time_slots
     WHERE turf_id = ? AND lock_status = 'locked'`,
    [turfId]
  )
  return rows
}

// ── Auto-expiry timer ─────────────────────────────────────────────────────

function scheduleExpiry(io, turfId, slotId, ms) {
  clearTimer(turfId, slotId)
  timers[timerKey(turfId, slotId)] = setTimeout(async () => {
    await dbExpire(slotId)          // frees lock + cleans pending_payments
    clearTimer(turfId, slotId)
    io.to(`turf:${turfId}`).emit('slot:released', { turfId, slotId, reason: 'expired' })
    console.log(`[slotLock] Slot ${slotId} expired and fully released`)
  }, ms)
}

// Restore timers on server restart
async function restoreTimers(io) {
  try {
    const [rows] = await db.query(
      `SELECT id AS slotId, turf_id AS turfId, lock_expires_at AS expiresAt
       FROM time_slots
       WHERE lock_status = 'locked' AND lock_expires_at > NOW()`
    )
    rows.forEach(({ turfId, slotId, expiresAt }) => {
      const ms = new Date(expiresAt).getTime() - Date.now()
      if (ms > 0) scheduleExpiry(io, turfId, slotId, ms)
    })
    console.log(`[slotLock] Restored ${rows.length} active lock timer(s)`)

    // Also clean up any locks that expired while server was down
    await db.query(
      `UPDATE time_slots
       SET lock_status = 'free', locked_by = NULL,
           lock_socket_id = NULL, lock_expires_at = NULL
       WHERE lock_status = 'locked' AND lock_expires_at < NOW()`
    )
    // Clean orphaned pending_payments older than 10 minutes
    await db.query(
      `DELETE FROM pending_payments
       WHERE created_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)`
    )
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
    socket.on('turf:join', async (turfId) => {
      socket.join(`turf:${turfId}`)
      try {
        const locks = await getActiveLocks(turfId)
        socket.emit('turf:current-locks', { turfId, locks })
      } catch (e) {
        console.error('[slotLock] turf:join error', e.message)
      }
    })

    socket.on('turf:leave', (turfId) => socket.leave(`turf:${turfId}`))

    // ── LOCK ───────────────────────────────────────────────────────────────
    socket.on('slot:lock', async ({ turfId, slotId }) => {
      if (!turfId || !slotId) return
      try {
        const [rows] = await db.query(
          `SELECT locked_by, lock_expires_at FROM time_slots
           WHERE id = ? AND turf_id = ? AND lock_status = 'locked'
             AND lock_expires_at > NOW()`,
          [slotId, turfId]
        )

        if (rows.length > 0 && rows[0].locked_by !== userId) {
          socket.emit('slot:lock:ack', {
            ok: false, turfId, slotId,
            reason: 'Slot is already locked by another user',
          })
          return
        }

        const expiresAt = await dbLock(turfId, slotId, userId, socket.id)
        scheduleExpiry(io, turfId, slotId, LOCK_DURATION_MS)

        socket.emit('slot:lock:ack', {
          ok: true, turfId, slotId,
          expiresAt: expiresAt.getTime(),
        })
        socket.to(`turf:${turfId}`).emit('slot:locked', {
          turfId, slotId,
          expiresAt: expiresAt.getTime(),
        })
      } catch (e) {
        console.error('[slotLock] slot:lock error', e.message)
      }
    })

    // ── RELEASE ────────────────────────────────────────────────────────────
    socket.on('slot:release', async ({ turfId, slotId }) => {
      try {
        const [rows] = await db.query(
          `SELECT locked_by FROM time_slots WHERE id = ? AND turf_id = ?`,
          [slotId, turfId]
        )
        if (!rows.length || rows[0].locked_by !== userId) return

        await dbRelease(slotId)
        clearTimer(turfId, slotId)

        // Also clean their pending_payments if no other locks remain
        const [otherLocks] = await db.query(
          `SELECT id FROM time_slots
           WHERE turf_id = ? AND locked_by = ?
             AND lock_status = 'locked' AND lock_expires_at > NOW()`,
          [turfId, userId]
        )
        if (otherLocks.length === 0) {
          await db.query(
            `DELETE FROM pending_payments WHERE user_id = ? AND turf_id = ?`,
            [userId, turfId]
          )
        }

        io.to(`turf:${turfId}`).emit('slot:released', { turfId, slotId, reason: 'released' })
      } catch (e) {
        console.error('[slotLock] slot:release error', e.message)
      }
    })

    // ── CONFIRM — called after successful payment (belt + suspenders) ──────
    socket.on('slot:confirm', async ({ turfId, slotId }) => {
      try {
        // Webhook already handles the DB write — this just clears the timer
        clearTimer(turfId, slotId)
        io.to(`turf:${turfId}`).emit('slot:booked', { turfId, slotId })
      } catch (e) {
        console.error('[slotLock] slot:confirm error', e.message)
      }
    })

    // ── DISCONNECT — locks survive (user may be refreshing) ────────────────
    socket.on('disconnect', () => {
      console.log(`[slotLock] ${userId} disconnected (locks preserved)`)
    })
  })
}