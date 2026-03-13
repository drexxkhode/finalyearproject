const db = require("../config/db");

// ── Admin: get own turf details (Settings page) ───────────────────────────
exports.getTurfDetails = async (req, res) => {
  try {
    const turf_id = req.user.turf_id;

    const [rows] = await db.query(
      `SELECT
         t.id, t.name, t.email, t.contact, t.district,
         t.latitude, t.longitude, t.location, t.price_per_hour, t.about,
         (
           SELECT url FROM turf_images
           WHERE turf_id = t.id AND is_cover = 1
           LIMIT 1
         ) AS cover_image
       FROM turfs t
       WHERE t.id = ?`,
      [turf_id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Turf not found" });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Admin: update own turf details ───────────────────────────────────────
exports.updateTurfDetails = async (req, res) => {
  try {
    const {
      name, email, contact, district,
      latitude, longitude, location, price_per_hour, about,
    } = req.body;

    if (!name || !district || !price_per_hour || !latitude || !longitude || !about)
      return res.status(400).json({ message: "Required fields missing" });

    const [result] = await db.query(
      `UPDATE turfs
       SET name = ?, email = ?, contact = ?, district = ?,
           latitude = ?, longitude = ?, location = ?,
           price_per_hour = ?, about = ?
       WHERE id = ?`,
      [name, email, contact, district, latitude, longitude, location,
       price_per_hour, about, req.user.turf_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Turf not found or not updated" });

    res.json({ message: "Turf details updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating Turf details" });
  }
};

// ── Client: all turfs for Home page + Map (includes cover_image) ──────────
exports.getTurfData = async (req, res) => {
  try {
    const [turfs] = await db.query(
      `SELECT
         t.id, t.name, t.email, t.contact, t.district,
         t.latitude, t.longitude, t.location,
         t.price_per_hour, t.about, t.rating, t.capacity,
         t.surface, t.amenities, t.distance,
         (
           SELECT url FROM turf_images
           WHERE turf_id = t.id AND is_cover = 1
           LIMIT 1
         ) AS cover_image
       FROM turfs t
       ORDER BY t.name`
    );

    res.json({ data: turfs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Client: single turf detail (includes full images array for Gallery) ───
exports.getSingleTurf = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [[turf]] = await db.query(
      `SELECT
         t.id, t.name, t.email, t.contact, t.district,
         t.latitude, t.longitude, t.location,
         t.price_per_hour, t.about, t.rating, t.capacity,
         t.surface, t.amenities, t.distance,
         (
           SELECT url FROM turf_images
           WHERE turf_id = t.id AND is_cover = 1
           LIMIT 1
         ) AS cover_image
       FROM turfs t
       WHERE t.id = ?`,
      [id]
    );

    if (!turf)
      return res.status(404).json({ message: "Turf not found" });

    // Full images array for the Gallery component
    const [images] = await db.query(
      `SELECT id, url, public_id, is_cover, sort_order
       FROM turf_images
       WHERE turf_id = ?
       ORDER BY is_cover DESC, sort_order ASC`,
      [id]
    );

    res.json({ ...turf, images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Admin: get turf name only (Navbar/header) ─────────────────────────────
exports.getTurfName = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name FROM turfs WHERE id = ?",
      [req.user.turf_id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Turf not found" });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Admin: dashboard stats ────────────────────────────────────────────────
exports.getDashboardDetails = async (req, res) => {
  try {
    const turf_id = req.user?.turf_id;

    const [rows] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM payments
          WHERE turf_id = ?) AS total_payments,
         (SELECT COUNT(*) FROM bookings 
         WHERE turf_id = ?) AS total_bookings,
         (SELECT COUNT(*) FROM admins
          WHERE turf_id = ?)  AS total_admins,
         (SELECT COUNT(*) FROM enquiries 
         WHERE turf_id = ?) AS total_enquiries`,
      [turf_id, turf_id, turf_id, turf_id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};