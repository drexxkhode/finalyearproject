/**
 * slotLockSocket.js  —  server/sockets/slotLockSocket.js
 *
 * KEY DESIGN DECISIONS:
 * - locked_by stores userId (from JWT), NOT socket.id
 *   → Locks survive page refresh/reconnect for the same user
 *   → Disconnect does NOT release locks (user may just be refreshing)
 * - Locks expire automatically via server setTimeout + DB expiry timestamp
 * - On turf:join, server sends all current locks from DB
 * - socketId is stored separately only for ownership checks during a session
 */

const db = require('../config/db')

const LOCK_DURATION_MS = 5 * 60 * 1000

const timers = {}  // { `${turfId}:${slotId}`: timeoutHandle }

function timerKey(t, s) { return `${t}:${s}` }
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
     SET lock_status = 'free', locked_by = NULL, lock_socket_id = NULL, lock_expires_at = NULL
     WHERE id = ?`,
    [slotId]
  )
}

async function dbBook(slotId) {
  await db.query(
    `UPDATE time_slots
     SET lock_status = 'booked', locked_by = NULL, lock_socket_id = NULL, lock_expires_at = NULL
     WHERE id = ?`,
    [slotId]
  )
}

// Clear expired locks for a turf then return all active ones
async function getActiveLocks(turfId) {
  await db.query(
    `UPDATE time_slots
     SET lock_status = 'free', locked_by = NULL, lock_socket_id = NULL, lock_expires_at = NULL
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

// ── Schedule auto-expiry ──────────────────────────────────────────────────
function scheduleExpiry(io, turfId, slotId, ms) {
  clearTimer(turfId, slotId)
  timers[timerKey(turfId, slotId)] = setTimeout(async () => {
    await dbRelease(slotId)
    clearTimer(turfId, slotId)
    io.to(`turf:${turfId}`).emit('slot:released', { turfId, slotId, reason: 'expired' })
  }, ms)
}

// ── On server start: restore timers for locks still alive in DB ───────────
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
  } catch (e) {
    console.error('[slotLock] Could not restore timers:', e.message)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
module.exports = function registerSlotLockSocket(io) {

  restoreTimers(io)

  io.on('connection', (socket) => {
    // userId comes from JWT decoded by Analytics.js middleware
    const userId = String(
      socket.user?.id ?? socket.user?.userId ?? socket.user?._id ?? socket.id
    )

    // ── JOIN: send current DB locks so joining user sees correct state ────
    socket.on('turf:join', async (turfId) => {
      socket.join(`turf:${turfId}`)
      try {
        const locks = await getActiveLocks(turfId)
        // Always emit — even empty array resets stale state on client
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
        // Check if slot is locked by someone else
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

        // Lock it (or renew own lock)
        const expiresAt = await dbLock(turfId, slotId, userId, socket.id)
        scheduleExpiry(io, turfId, slotId, LOCK_DURATION_MS)

        socket.emit('slot:lock:ack', {
          ok: true, turfId, slotId,
          expiresAt: expiresAt.getTime(),
        })
        // Broadcast to everyone ELSE in the room
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
        // Only the user who locked it can release it
        if (!rows.length || rows[0].locked_by !== userId) return

        await dbRelease(slotId)
        clearTimer(turfId, slotId)
        // Broadcast to ALL in room (including the releaser)
        io.to(`turf:${turfId}`).emit('slot:released', { turfId, slotId, reason: 'released' })
      } catch (e) {
        console.error('[slotLock] slot:release error', e.message)
      }
    })

    // ── CONFIRM ────────────────────────────────────────────────────────────
    socket.on('slot:confirm', async ({ turfId, slotId }) => {
      try {
        await dbBook(slotId)
        clearTimer(turfId, slotId)
        io.to(`turf:${turfId}`).emit('slot:booked', { turfId, slotId })
      } catch (e) {
        console.error('[slotLock] slot:confirm error', e.message)
      }
    })

    // ── DISCONNECT ─────────────────────────────────────────────────────────
    // DO NOT release locks on disconnect — user may just be refreshing.
    // Locks expire naturally via their server-side timer.
    // On reconnect, turf:join will send them back their active locks.
    socket.on('disconnect', () => {
      console.log(`[slotLock] ${userId} disconnected (locks preserved in DB)`)
    })
  })
}