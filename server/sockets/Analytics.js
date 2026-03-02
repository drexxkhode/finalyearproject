// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const db= require("../config/db"); // PostgreSQL example

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Emit monthly analytics
async function emitMonthlyAnalytics() {
  try {
    const res = await db.query(`
      SELECT
    TO_CHAR(b.booking_date, 'Mon YYYY') AS month,
    SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS accepted,
    SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS rejected,
    COALESCE(SUM(p.amount), 0) AS payments
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'completed'
WHERE b.booking_date > NOW() - INTERVAL '12 months'
GROUP BY month
ORDER BY MIN(b.booking_date);
    `);

    // Send all months at once
    const data = res.rows.map((row) => ({
      month: row.month,
      accepted: parseInt(row.accepted),
      rejected: parseInt(row.rejected),
      payments: parseFloat(row.payments),
    }));
    
    io.emit("booking-analytics-monthly", data);
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

// Emit every 10 minutes for demo (or call after DB updates)
setInterval(emitMonthlyAnalytics, 600000);

server.listen(4000, () => console.log("Server running on 4000"));