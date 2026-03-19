const db  = require('../config/db');
const jwt = require('jsonwebtoken');

function setupAnalyticsSocket(io) {

  // Global auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, '| role:', socket.user?.role ?? 'user');

    const turfId = socket.user?.turf_id;
    if (!turfId) return; // regular booking users — skip analytics

    emitMonthlyAnalytics(socket, turfId);

    const interval = setInterval(() => {
      emitMonthlyAnalytics(socket, turfId);
    }, 60000);

    socket.on('disconnect', () => {
      clearInterval(interval);
      console.log('Client disconnected:', socket.id);
    });
  });
}

async function emitMonthlyAnalytics(socket, turfId) {
  try {
    // payments.booking_ids is a JSON array e.g. [12,13,14]
    // We join via turf_id on payments — no need to unpack JSON for totals
    // For booking counts we use the bookings table directly
    const [rows] = await db.query(`
     SELECT
  DATE_FORMAT(b.booking_date, '%Y-%m') AS month,
  SUM(CASE WHEN b.status IN ('confirmed','completed') THEN 1 ELSE 0 END) AS accepted,
  SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
  SUM(CASE WHEN b.payment_status IN ('paid' ,'no_refund') THEN b.amount ELSE 0 END) AS payments
  SUM(CASE WHEN b.payment_status IN ('refunded', 'no_refund') THEN b.amount ELSE 0 END) AS refunds
FROM bookings b
WHERE b.turf_id = ?
GROUP BY month
ORDER BY month
    `, [turfId]);

    socket.emit('booking-analytics-monthly', rows.map(row => ({
      month:    row.month,
      accepted: Number(row.accepted),
      cancelled: Number(row.cancelled),
      payments: Number(row.payments),
      refunds: Number(row.refunds),
    })));

  } catch (error) {
    console.error('Analytics error:', error);
  }
}

module.exports = setupAnalyticsSocket;