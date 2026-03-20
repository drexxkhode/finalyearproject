const db    = require("../config/db");
const redis = require("../config/RedisClient");

// Safely parse amenities — handles JSON array, comma string, or null
function parseAmenities(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return val.split(',').map(a => a.trim()).filter(Boolean);
  }
  return [];
}

// ── Admin: get own turf details (Settings page) ───────────────────────────
exports.getTurfDetails = async (req, res) => {
  try {
    const turf_id = req.user.turf_id;

    const [rows] = await db.query(
      `SELECT
         t.id, t.name, t.email, t.contact, t.district,
         t.latitude, t.longitude, t.location, t.price_per_hour, t.about,
         t.amenities, t.capacity,
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

    res.json({ ...rows[0], amenities: parseAmenities(rows[0].amenities) });
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
      amenities, capacity,
    } = req.body;

    if (!name || !district || !price_per_hour || !latitude || !longitude || !about)
      return res.status(400).json({ message: "Required fields missing" });

    // Normalise amenities — accept array or comma string, always store as JSON array
    let amenitiesJson = '[]';
    if (Array.isArray(amenities)) {
      amenitiesJson = JSON.stringify(amenities.map(a => String(a).trim()).filter(Boolean));
    } else if (typeof amenities === 'string' && amenities.trim()) {
      amenitiesJson = JSON.stringify(
        amenities.split(',').map(a => a.trim()).filter(Boolean)
      );
    }

    const [result] = await db.query(
      `UPDATE turfs
       SET name = ?, email = ?, contact = ?, district = ?,
           latitude = ?, longitude = ?, location = ?,
           price_per_hour = ?, about = ?,
           amenities = ?, capacity = ?
       WHERE id = ?`,
      [name, email, contact, district, latitude, longitude, location,
       price_per_hour, about, amenitiesJson, capacity ?? null,
       req.user.turf_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Turf not found or not updated" });

    // ── Invalidate cache for this turf and the all-turfs list ─────────────
    await redis.del(
      redis.KEYS.allTurfs,
      redis.KEYS.turf(req.user.turf_id)
    );
    console.log(`[cache] Invalidated turf ${req.user.turf_id} after update`);

    res.json({ message: "Turf details updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating Turf details" });
  }
};

// ── Client: all turfs for Home page + Map ─────────────────────────────────
exports.getTurfData = async (req, res) => {
  try {
    // ── Cache check ───────────────────────────────────────────────────────
    const cached = await redis.get(redis.KEYS.allTurfs);
    if (cached) {
      console.log('[cache] HIT turfs:all');
      return res.json(cached);
    }

    const [turfs] = await db.query(
      `SELECT
  t.id, t.name, t.email, t.contact, t.district,
  t.latitude, t.longitude, t.location,
  t.price_per_hour, t.about, t.rating, t.capacity,
  t.surface, t.amenities, t.distance,

  (
    SELECT url
    FROM turf_images
    WHERE turf_id = t.id AND is_cover = 1
    LIMIT 1
  ) AS cover_image,

  (
    SELECT COUNT(*)
    FROM time_slots s
    WHERE s.turf_id = t.id
  ) AS available_slots

FROM turfs t
ORDER BY t.name`
    );

    const payload = {
      data: turfs.map(t => ({
        ...t,
        amenities: parseAmenities(t.amenities),
      }))
    };

    // ── Cache store ───────────────────────────────────────────────────────
    await redis.set(redis.KEYS.allTurfs, payload, redis.TTL.allTurfs);
    console.log('[cache] MISS turfs:all — cached');

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Client: single turf detail (Gallery + full info) ─────────────────────
exports.getSingleTurf = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // ── Cache check ───────────────────────────────────────────────────────
    const cached = await redis.get(redis.KEYS.turf(id));
    if (cached) {
      console.log(`[cache] HIT turfs:${id}`);
      return res.json(cached);
    }

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

    const [images] = await db.query(
      `SELECT id, url, public_id, is_cover, sort_order
       FROM turf_images
       WHERE turf_id = ?
       ORDER BY is_cover DESC, sort_order ASC`,
      [id]
    );

    const payload = { ...turf, amenities: parseAmenities(turf.amenities), images };

    // ── Cache store ───────────────────────────────────────────────────────
    await redis.set(redis.KEYS.turf(id), payload, redis.TTL.turf);
    console.log(`[cache] MISS turfs:${id} — cached`);

    res.json(payload);
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

// ── Admin: dashboard stats ─────────────────────────────────────────────────
exports.getDashboardDetails = async (req, res) => {
  try {
    const turf_id = req.user?.turf_id;
    if (!turf_id) return res.status(403).json({ message: 'Admin access required' });
    const cacheKey = redis.KEYS.dashboard(turf_id);

    // ── Cache check ───────────────────────────────────────────────────────
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[cache] HIT dashboard:${turf_id}`);
      return res.json(cached);
    }

    const [rows] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM payments   WHERE turf_id = ?) AS total_payments,
         (SELECT COUNT(*) FROM bookings   WHERE turf_id = ?) AS total_bookings,
         (SELECT COUNT(*) FROM admins     WHERE turf_id = ?) AS total_admins,
         (SELECT COUNT(*) FROM enquiries  WHERE turf_id = ?) AS total_enquiries`,
      [turf_id, turf_id, turf_id, turf_id]
    );

    const payload = rows[0];

    // ── Cache store ───────────────────────────────────────────────────────
    await redis.set(cacheKey, payload, redis.TTL.dashboard);
    console.log(`[cache] MISS dashboard:${turf_id} — cached`);

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};