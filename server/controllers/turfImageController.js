// controllers/turfImageController.js
const db                  = require('../config/db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// ── GET /api/turf/:id/images ──────────────────────────────────────────────
// Returns all images for a turf ordered by sort_order
const getTurfImages = async (req, res) => {
  try {
    const turf_id = parseInt(req.params.id);
    const [rows] = await db.query(
      `SELECT id, url, public_id, is_cover, sort_order
       FROM turf_images
       WHERE turf_id = ?
       ORDER BY is_cover DESC, sort_order ASC`,
      [turf_id]
    );
    return res.json({ images: rows });
  } catch (err) {
    console.error('getTurfImages error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/turf/:id/images ─────────────────────────────────────────────
// Upload one or more images for a turf (multipart/form-data, field: images)
// First upload auto-sets is_cover = 1 if turf has no cover yet
const uploadTurfImages = async (req, res) => {
  try {
    const turf_id = parseInt(req.params.id);

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: 'No images provided' });

    // Check if turf already has a cover image
    const [existing] = await db.query(
      `SELECT COUNT(*) AS total, SUM(is_cover) AS covers
       FROM turf_images WHERE turf_id = ?`,
      [turf_id]
    );
    let hasCover   = existing[0].covers > 0;
    const uploaded = [];

    for (let i = 0; i < req.files.length; i++) {
      const file     = req.files[i];
      const publicId = `turf_${turf_id}_${Date.now()}_${i}`;

      const result = await uploadToCloudinary(
        file.buffer,
        'turfarena/turfs',
        publicId
      );

      // First image becomes cover if none exists
      const isCover = (!hasCover && i === 0) ? 1 : 0;
      if (isCover) hasCover = true;

      const [insertResult] = await db.query(
        `INSERT INTO turf_images (turf_id, url, public_id, is_cover, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [turf_id, result.secure_url, result.public_id, isCover, existing[0].total + i]
      );

      uploaded.push({
        id:         insertResult.insertId,
        url:        result.secure_url,
        public_id:  result.public_id,
        is_cover:   isCover,
        sort_order: existing[0].total + i,
      });

      console.log(`[turf-image] uploaded turf=${turf_id} public_id=${result.public_id} cover=${isCover}`);
    }

    return res.status(201).json({ message: 'Images uploaded', images: uploaded });
  } catch (err) {
    console.error('uploadTurfImages error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /api/turf/:id/images/:imageId/cover ───────────────────────────────
// Set a specific image as the cover (unsets all others for this turf)
const setTurfCover = async (req, res) => {
  try {
    const turf_id  = parseInt(req.params.id);
    const image_id = parseInt(req.params.imageId);

    // Verify image belongs to this turf
    const [rows] = await db.query(
      `SELECT id FROM turf_images WHERE id = ? AND turf_id = ? LIMIT 1`,
      [image_id, turf_id]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Image not found for this turf' });

    // Unset all covers for this turf then set the new one
    await db.query(
      `UPDATE turf_images SET is_cover = 0 WHERE turf_id = ?`, [turf_id]
    );
    await db.query(
      `UPDATE turf_images SET is_cover = 1 WHERE id = ?`, [image_id]
    );

    console.log(`[turf-image] cover set turf=${turf_id} image=${image_id}`);
    return res.json({ message: 'Cover image updated' });
  } catch (err) {
    console.error('setTurfCover error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE /api/turf/:id/images/:imageId ──────────────────────────────────
// Delete one image — also deletes from Cloudinary
// If deleted image was the cover, promotes the next image to cover
const deleteTurfImage = async (req, res) => {
  try {
    const turf_id  = parseInt(req.params.id);
    const image_id = parseInt(req.params.imageId);

    // Fetch the image to get public_id and is_cover
    const [rows] = await db.query(
      `SELECT id, public_id, is_cover FROM turf_images
       WHERE id = ? AND turf_id = ? LIMIT 1`,
      [image_id, turf_id]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Image not found for this turf' });

    const image = rows[0];

    // Delete from Cloudinary first
    await deleteFromCloudinary(image.public_id);

    // Delete from DB
    await db.query(`DELETE FROM turf_images WHERE id = ?`, [image_id]);

    // If deleted image was the cover, promote the next image
    if (image.is_cover) {
      const [remaining] = await db.query(
        `SELECT id FROM turf_images WHERE turf_id = ? ORDER BY sort_order ASC LIMIT 1`,
        [turf_id]
      );
      if (remaining.length) {
        await db.query(
          `UPDATE turf_images SET is_cover = 1 WHERE id = ?`, [remaining[0].id]
        );
      }
    }

    console.log(`[turf-image] deleted turf=${turf_id} image=${image_id} public_id=${image.public_id}`);
    return res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error('deleteTurfImage error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE /api/turf/:id/images ───────────────────────────────────────────
// Delete ALL images for a turf (used when deleting the turf itself)
const deleteAllTurfImages = async (turf_id) => {
  try {
    const [rows] = await db.query(
      `SELECT public_id FROM turf_images WHERE turf_id = ?`, [turf_id]
    );
    // Delete all from Cloudinary in parallel
    await Promise.all(rows.map(r => deleteFromCloudinary(r.public_id)));
    // DB rows deleted automatically via ON DELETE CASCADE on turfs table
    console.log(`[turf-image] deleted all ${rows.length} images for turf=${turf_id}`);
  } catch (err) {
    console.error('deleteAllTurfImages error:', err);
  }
};

module.exports = {
  getTurfImages,
  uploadTurfImages,
  setTurfCover,
  deleteTurfImage,
  deleteAllTurfImages,
};