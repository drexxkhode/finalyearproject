const db  = require("../config/db");
const jwt = require("jsonwebtoken");

function setupAnalyticsSocket(io) {

  // ── Global auth middleware — runs for ALL socket connections ────────────
  io.use((socket, next) => {
    try {
      const token = socket?.handshake?.auth?.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const turfId = socket.user?.turf_id;

    // Analytics only apply to turf admin/owner accounts that have a turf_id.
    // Regular booking users connect here too (for slot locking) — skip analytics for them.
    if (!turfId) return;

    emitMonthlyAnalytics(socket, turfId);

    const interval = setInterval(() => {
      emitMonthlyAnalytics(socket, turfId);
    }, 60000);

    socket.on("disconnect", () => {
      clearInterval(interval);
      console.log("Client disconnected:", socket.id);
    });
  });
}

async function emitMonthlyAnalytics(socket, turfId) {
  try {
    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(b.booking_date, '%b %Y') AS month,
        SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS rejected,
        COALESCE(SUM(p.amount), 0) AS payments
      FROM bookings b
      LEFT JOIN payments p
        ON b.id = p.booking_id
        AND p.payment_status = 'completed'
      WHERE b.turf_id = ?
      GROUP BY YEAR(b.booking_date), MONTH(b.booking_date)
      ORDER BY YEAR(b.booking_date), MONTH(b.booking_date)
    `, [turfId]);

    socket.emit("booking-analytics-monthly", rows.map((row) => ({
      month:    row.month,
      accepted: Number(row.accepted),
      rejected: Number(row.rejected),
      payments: Number(row.payments),
    })));

  } catch (error) {
    console.error("Analytics error:", error);
  }
}

module.exports = setupAnalyticsSocket;