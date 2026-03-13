const db = require('../config/db')

// ── GET /api/payments/admin — admin payment history with summary ───────────
const getAdminPayments = async (req, res) => {
  try {
    const turf_id   = req.user?.turf_id
    const { status, date_from, date_to } = req.query

    // ── Build WHERE clause dynamically ──────────────────────────────────
    const conditions = ['p.turf_id = ?']
    const params     = [turf_id]

    if (status && status !== 'all') {
      conditions.push('p.payment_status = ?')
      params.push(status)
    }
    if (date_from) {
      conditions.push('DATE(p.paid_at) >= ?')
      params.push(date_from)
    }
    if (date_to) {
      conditions.push('DATE(p.paid_at) <= ?')
      params.push(date_to)
    }

    const WHERE = conditions.join(' AND ')

    // ── Main query — join users for name/email ───────────────────────────
    const [payments] = await db.query(
      `SELECT
         p.id, p.paystack_ref, p.paystack_event,
         p.booking_ids, p.amount, p.payment_status,
         p.paid_at, p.created_at,
         u.name  AS user_name,
         u.email AS user_email,
         u.contact AS user_contact,
         -- Get booking date from first booking in booking_ids
         (SELECT b.booking_date FROM bookings b
          WHERE b.paystack_ref = p.paystack_ref
          LIMIT 1) AS booking_date,
         -- Total refund for this ref
         (SELECT COALESCE(SUM(b.refund_amount), 0)
          FROM bookings b
          WHERE b.paystack_ref = p.paystack_ref
            AND b.status = 'cancelled') AS refund_amount
       FROM payments p
       JOIN users u ON u.id = p.user_id
       WHERE ${WHERE}
       ORDER BY p.paid_at DESC`,
      params
    )

    // Parse booking_ids JSON
    const parsed = payments.map(p => ({
      ...p,
      booking_ids: (() => {
        try { return typeof p.booking_ids === 'string' ? JSON.parse(p.booking_ids) : p.booking_ids }
        catch { return [] }
      })(),
    }))

    // ── Summary — always scoped to turf, ignores date/status filters ────
    const [[totals]] = await db.query(
      `SELECT
         COUNT(*)                                          AS count,
         COALESCE(SUM(amount), 0)                         AS total,
         COALESCE(SUM(CASE WHEN payment_status = 'refunded'  THEN amount ELSE 0 END), 0) AS refunded,
         SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) AS completed
       FROM payments
       WHERE turf_id = ?`,
      [turf_id]
    )

    res.json({
      payments: parsed,
      summary: {
        count:     parseInt(totals.count),
        total:     parseFloat(totals.total),
        refunded:  parseFloat(totals.refunded),
        completed: parseInt(totals.completed),
      },
    })
  } catch (err) {
    console.error('getAdminPayments error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAdminPayments }