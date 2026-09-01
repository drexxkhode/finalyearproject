const db = require("../config/db");
const axios = require("axios");

// ================= GET ALL TURFS FOR MAP =================
exports.getMapDetails = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM turfs ");

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No turfs found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Map Details Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ================= GET SINGLE TURF FOR DIRECTIONS =================
exports.getDirections = async (req, res) => {
  try {
    const turfId = Number(req.params.id);

    if (!turfId) {
      return res.status(400).json({
        success: false,
        message: "Invalid turf id",
      });
    }

    const [rows] = await db.query(
      "SELECT id, name, district, latitude, longitude FROM turfs WHERE id = ?",
      [turfId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Turf not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.error("Directions Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// The client supplies only its current position; the server owns the provider key
// and fetches the destination coordinates from the trusted turf record.
exports.getRoute = async (req, res) => {
  try {
    const turfId = Number(req.params.id);
    const suppliedPoint = Array.isArray(req.query.point) ? req.query.point[0] : req.query.point;
    const [queryLat, queryLng] = String(suppliedPoint || "").split(",");
    const latitude = Number(req.body?.latitude ?? queryLat);
    const longitude = Number(req.body?.longitude ?? queryLng);
    if (!turfId || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return res.status(400).json({ message: "A valid current location is required." });
    }
    if (!process.env.GRAPHHOPPER_API_KEY) return res.status(503).json({ message: "Routing is not configured." });

    const [rows] = await db.query("SELECT latitude, longitude FROM turfs WHERE id = ?", [turfId]);
    const turf = rows[0];
    const destLat = Number(turf?.latitude);
    const destLng = Number(turf?.longitude);
    if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) return res.status(404).json({ message: "This turf has no valid map location." });

    const response = await axios.get("https://graphhopper.com/api/1/route", {
      params: { point: [`${latitude},${longitude}`, `${destLat},${destLng}`], vehicle: "car", instructions: true, points_encoded: false, key: process.env.GRAPHHOPPER_API_KEY },
      paramsSerializer: ({ point, ...rest }) => `${new URLSearchParams({ ...rest, point: point[0] })}&point=${encodeURIComponent(point[1])}`,
      timeout: 10000,
    });
    const path = response.data.paths?.[0];
    if (!path) return res.status(502).json({ message: "No route could be found." });
    res.json({ data: { points: path.points.coordinates, instructions: path.instructions, time: path.time, distance: path.distance } });
  } catch (error) {
    console.error("Routing Error:", error.response?.data || error.message);
    res.status(502).json({ message: "Unable to calculate directions right now." });
  }
};
