require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const db = require("./config/db");
const authRoutes = require("./routes/admin/authRoute");
const turfRoutes = require("./routes/turf/turfRoute");
const meilisearchRoutes = require("./routes/turf/meilisearchRoute");
const mapRoutes = require("./routes/turf/mapRoute");
const userRoutes = require("./routes/client/authRoute");
const bookingRoute = require('./routes/client/bookingRoute');
const timeslotRoute = require('./routes/turf/timeslotRoute');
const setupAnalyticsSocket = require("./sockets/Analytics");
const registerSlotLockSocket = require('./sockets/slotLockSocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001",
    "http://192.168.43.99:3000",
    /\.ngrok-free\.app$/,
    /\.trycloudflare\.com$/
  ],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE"]
}));

app.use(express.json());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/turf", turfRoutes);
app.use("/api/turf", meilisearchRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/users", userRoutes);
app.use('/api/bookings', bookingRoute);
app.use('/api/slots', timeslotRoute);      

app.get("/", (req, res) => {
  res.send("Astro Turf API running");
});

// Initialize socket
setupAnalyticsSocket(io);
registerSlotLockSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT,"0.0.0.0", () => console.log(`Server running on port ${PORT}`));
