/**
 * adminNotificationSocket.js
 *
 * Manages two admin socket rooms:
 *   admin:{turf_id}  — all admins for a turf (notifications + enquiries)
 *   user:{user_id}   — individual user (receives enquiry replies)
 *
 * Events emitted TO admin room:
 *   enquiry:new      — new enquiry from client
 *   booking:new      — new paid booking (emitted from paystackWebhook)
 *
 * Events emitted TO user room:
 *   enquiry:reply    — admin replied to their enquiry
 */

module.exports = function registerAdminNotificationSocket(io) {

  io.on('connection', (socket) => {
    const user    = socket.user   // set by your auth middleware on the socket
    const userId  = user?.id
    const turfId  = user?.turf_id // present for admin sockets, null for clients
    const role    = user?.role    // 'Manager' | 'Staff' | undefined (clients)

    // ── Admin joins their turf notification room ──────────────────────────
    if (turfId && (role === 'Manager' || role === 'Staff')) {
      socket.join(`admin:${turfId}`)
      console.log(`[adminSocket] Admin ${userId} joined admin:${turfId}`)
    }

    // ── Client joins their personal room for receiving replies ────────────
    if (userId && !turfId) {
      socket.join(`user:${userId}`)
      console.log(`[adminSocket] User ${userId} joined user:${userId}`)
    }

    // ── Admin requests unread counts + recent items on connect ──────────
    socket.on('admin:get-unread', async () => {
      if (!turfId) return
      try {
        const db = require('../config/db')

        // Only count enquiries from last 24h — so badge resets naturally each day
        // and doesn't confuse admin with old pending items on every refresh
        const [recentEnquiries] = await db.query(
          `SELECT 
    e.id,
    u.name,
    e.subject,
    e.message,
    e.status,
    e.created_at
FROM enquiries e
JOIN users u ON e.user_id = u.id
WHERE e.turf_id = ?
  AND e.status = 'pending'
  AND e.created_at > NOW() - INTERVAL 24 HOUR
ORDER BY e.created_at DESC
LIMIT 5`,
          [turfId]
        )

        const [recentBookings] = await db.query(
          `SELECT MIN(b.id) AS id, u.name, COUNT(*) AS slots,
                  SUM(b.amount) AS amount, b.booking_date AS date,
                  MAX(b.created_at) AS created_at
           FROM bookings b
           JOIN users u ON u.id = b.user_id
           WHERE b.turf_id = ? AND b.created_at > NOW() - INTERVAL 24 HOUR
             AND b.payment_status = 'paid'
           GROUP BY b.paystack_ref, u.name, b.booking_date
           ORDER BY MAX(b.created_at) DESC LIMIT 5`,
          [turfId]
        )

        // Send both the count AND the actual items
        // so the frontend can populate the dropdown on refresh
        socket.emit('admin:unread-counts', {
          enquiries:      recentEnquiries.length,
          bookings:       recentBookings.length,
          enquiryItems:   recentEnquiries.map(e => ({
            id:      e.id,
            name:    e.name,
            preview: e.message.slice(0, 80),
            time:    new Date(e.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          })),
          bookingItems:   recentBookings.map(b => ({
            id:     b.id,
            name:   b.name,
            slots:  parseInt(b.slots),
            amount: parseFloat(b.amount).toFixed(2),
            date:   b.date,
            time:   new Date(b.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          })),
        })
      } catch (err) {
        console.error('[adminSocket] get-unread error:', err.message)
      }
    })

    socket.on('disconnect', () => {
      console.log(`[adminSocket] disconnected userId=${userId}`)
    })
  })
}