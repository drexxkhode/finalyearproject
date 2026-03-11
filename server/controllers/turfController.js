const db = require("../config/db");

exports.getTurfDetails = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, contact, district, latitude, longitude, location, price_per_hour, about FROM turfs WHERE id = ?",
      [req.user.turf_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Turf not found" });
    }

    res.json(rows[0]); // return single turf object
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateTurfDetails = async (req, res) => {
  try {
    const {
      name,
      email,
      contact,
      district,
      latitude,
      longitude,
      location,
      price_per_hour,
      about,
    } = req.body;

    // Basic validation
    if (!name || !district || !price_per_hour ||!latitude ||!longitude ||!about ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const [result] = await db.query(
      `UPDATE turfs 
       SET name = ?, 
           email = ?, 
           contact = ?, 
           district = ?, 
           latitude = ?, 
           longitude = ?, 
           location = ?, 
           price_per_hour = ?, 
           about = ?
       WHERE id = ?`,
      [
        name,
        email,
        contact,
        district,
        latitude,
        longitude,
        location,
        price_per_hour,
        about,
        req.user.turf_id,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Turf not found or not updated" });
    }

    res.json({ message: "Turf details updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating Turf details" });
  }
};

exports.getTurfName = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name FROM turfs WHERE id = ?",
      [req.user.turf_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Turf not found" });
    }

    res.json(rows[0]); // return single turf object
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

 exports.getDashboardDetails = async (req, res) => {
  try {
    const turf_id = req.user?.turf_id;

    const [rows] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM payments 
         WHERE payment_status = 'completed' AND turf_id = ?) AS total_payments,

        (SELECT COUNT(*) FROM bookings 
         WHERE status = 'completed' AND turf_id = ?) AS total_bookings,

        (SELECT COUNT(*) FROM admins WHERE turf_id = ?) AS total_admins,

        (SELECT COUNT(*) FROM enquiries 
         WHERE status = 'resolved' AND turf_id = ?) AS total_enquiries
    `, [turf_id, turf_id, turf_id,turf_id]);

    res.json(rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};