require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const db = require("./config/db");
const authRoutes = require("./routes/admin/authRoute");
const turfRoutes = require("./routes/turf/turfRoute");
const setupAnalyticsSocket = require("./sockets/Analytics");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://abcd1234.ngrok.io'],
  credentials: true
}));

app.use(express.json());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/turf", turfRoutes);

app.get("/", (req, res) => {
  res.send("Astro Turf API running");
});

// Initialize socket
setupAnalyticsSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));