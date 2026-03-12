// controllers/userPhotoController.js
// Handles profile picture upload and deletion for users.
// Kept separate from bookingController — zero risk of touching payment logic.

const db = require('../config/db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// ── PUT /api/users/profile/photo ─────────────────────────────────────────
// Upload or replace the user's profile picture.
// Steps:
//   1. Upload new image to Cloudinary
//   2. Delete old image from Cloudinary (if exists)
//   3. Save new URL to users.photo
//   4. Return updated user object so AuthContext can update localStorage
const uploadProfilePhoto = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    if (!req.file)
      return res.status(400).json({ message: 'No image provided' });

    // Get current photo to delete it after successful upload
    const [rows] = await db.query(
      `SELECT photo FROM users WHERE id = ? LIMIT 1`, [user_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const oldPublicId = extractPublicId(rows[0].photo);

    // Upload new photo to Cloudinary
    const publicId = `user_${user_id}_${Date.now()}`;
    const result   = await uploadToCloudinary(
      req.file.buffer,
      'turfarena/profiles',
      publicId
    );

    // Save new URL to DB
    await db.query(
      `UPDATE users SET photo = ? WHERE id = ?`,
      [result.secure_url, user_id]
    );

    // Delete old photo from Cloudinary AFTER successful DB update
    if (oldPublicId) await deleteFromCloudinary(oldPublicId);

    // Fetch updated user to return full object
    const [updated] = await db.query(
      `SELECT id, name, email, contact, photo, created_at FROM users WHERE id = ? LIMIT 1`,
      [user_id]
    );

    console.log(`[profile-photo] updated user=${user_id} public_id=${result.public_id}`);
    return res.json({ message: 'Profile photo updated', user: updated[0] });
  } catch (err) {
    console.error('uploadProfilePhoto error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE /api/users/profile/photo ──────────────────────────────────────
// Remove profile picture — deletes from Cloudinary + sets users.photo = NULL
const deleteProfilePhoto = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await db.query(
      `SELECT photo FROM users WHERE id = ? LIMIT 1`, [user_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const publicId = extractPublicId(rows[0].photo);

    // Clear from DB first
    await db.query(`UPDATE users SET photo = NULL WHERE id = ?`, [user_id]);

    // Then delete from Cloudinary
    if (publicId) await deleteFromCloudinary(publicId);

    // Return updated user
    const [updated] = await db.query(
      `SELECT id, name, email, contact, photo, created_at FROM users WHERE id = ? LIMIT 1`,
      [user_id]
    );

    console.log(`[profile-photo] removed user=${user_id}`);
    return res.json({ message: 'Profile photo removed', user: updated[0] });
  } catch (err) {
    console.error('deleteProfilePhoto error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── Helper: extract Cloudinary public_id from a secure_url ───────────────
// e.g. https://res.cloudinary.com/demo/image/upload/v123/turfarena/profiles/user_3_abc.jpg
//      → turfarena/profiles/user_3_abc
function extractPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    // Strip everything before /upload/, then strip version (/v1234567890/)
    const afterUpload = url.split('/upload/')[1];
    if (!afterUpload) return null;
    // Remove version segment if present (v followed by digits)
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    return withoutVersion.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
}

module.exports = { uploadProfilePhoto, deleteProfilePhoto };