require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./config/db"); // PostgreSQL
const authRoutes = require("./routes/admin/authRoute");
const turfRoutes = require("./routes/turf/turfData");
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors(
  {
    origin: ['http://localhost:3000', 'https://abcd1234.ngrok.io'],
  credentials: true
  }
));
app.use(express.json());
// Serve uploads folder as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/turf", turfRoutes);

app.get("/", (req, res) => {
  res.send("Astro Turf API running");
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Client connected");

  // Emit analytics immediately on connection
  emitMonthlyAnalytics();

  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Emit monthly analytics function
async function emitMonthlyAnalytics() {
  try {
    const [rows] = await db.query(`
     SELECT
    DATE_FORMAT(b.booking_date, '%b %Y') AS month,
    SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS accepted,
    SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS rejected,
    COALESCE(SUM(p.amount), 0) AS payments
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id AND p.payment_status = 'completed'
GROUP BY YEAR(b.booking_date), MONTH(b.booking_date)
ORDER BY YEAR(b.booking_date), MONTH(b.booking_date);
    `);

    // rows now contains the actual results
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
// Emit every 10 minutes (optional)
setInterval(emitMonthlyAnalytics, 60000);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));