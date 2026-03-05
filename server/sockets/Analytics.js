const db = require("../config/db");

function setupAnalyticsSocket(io) {

  io.on("connection", (socket) => {
    console.log("Client connected");

    emitMonthlyAnalytics(io);

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  // Emit every minute
  setInterval(() => emitMonthlyAnalytics(io), 60000);
}

async function emitMonthlyAnalytics(io) {
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
      GROUP BY YEAR(b.booking_date), MONTH(b.booking_date)
      ORDER BY YEAR(b.booking_date), MONTH(b.booking_date);
    `);

    const data = rows.map((row) => ({
      month: row.month,
      accepted: parseInt(row.accepted),
      rejected: parseInt(row.rejected),
      payments: parseFloat(row.payments),
    }));

    io.emit("booking-analytics-monthly", data);

  } catch (err) {
    console.error("Error fetching monthly analytics:", err);
  }
}

module.exports = setupAnalyticsSocket;