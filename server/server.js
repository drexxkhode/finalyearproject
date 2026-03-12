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
const bookingsRoute = require('./routes/admin/bookingsRoute');
const dashbaordRoute = require('./routes/admin/dashboardRoute');
const turfImageRoute = require('./routes/turf/turfImageRoute');
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
    "https://turfarena.onrender.com",
    "https://admindashboard-c220.onrender.com",
    /\.ngrok-free\.app$/,
    /\.trycloudflare\.com$/,
  ],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE"]
}));
// ── 2. Webhook FIRST — raw body, before express.json() ────────────────────
const { paystackWebhook } = require('./controllers/bookingController')
app.post(
  '/api/bookings/webhook',
  express.raw({ type: 'application/json' }),  // keeps body as Buffer
  paystackWebhook
);

app.use(express.json());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/images", express.static(path.join(__dirname, "images")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/turf", turfRoutes);
app.use("/api/turf", meilisearchRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/users", userRoutes);
app.use('/api/bookings', bookingRoute);
app.use('/api/slots', timeslotRoute);      
app.use('/api/admin', bookingsRoute);  
app.use('/api/admin', dashbaordRoute); 
app.use('/api/turf/:id/images', turfImageRoute); 

app.get("/", (req, res) => {
  res.send("Astro Turf API running");
});

// Initialize socket
setupAnalyticsSocket(io);
registerSlotLockSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT,"0.0.0.0", () => console.log(`Server running on port ${PORT}`));
