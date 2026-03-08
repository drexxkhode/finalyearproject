const db = require("../config/db");

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