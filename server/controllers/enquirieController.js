const db = require('../config/db');

// ── GET /api/enquiries?turf_id=1 — public, loads enquiries for a turf ──────
const getEnquiries = async (req, res) => {
  try {
    const { turf_id } = req.query;
    if (!turf_id)
      return res.status(400).json({ message: 'turf_id is required' });

    const [rows] = await db.query(
      `SELECT
    e.id,
    u.name,
    e.subject,
    e.message,
    e.status,
    e.created_at,
    er.reply,
    er.created_at AS replied_at
FROM enquiries e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN enquiry_replies er ON er.enquiry_id = e.id
WHERE e.turf_id = ?
ORDER BY e.created_at DESC`,
      [turf_id]
    );

    res.json({ enquiries: rows });
  } catch (err) {
    console.error('getEnquiries error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/enquiries — client submits enquiry ───────────────────────────
const createEnquiry = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const { turf_id, subject, message } = req.body;
    if (!turf_id || !message?.trim())
      return res.status(400).json({ message: 'turf_id and message are required' });

    const [result] = await db.query(
      `INSERT INTO enquiries (turf_id, user_id, subject, message, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [turf_id, user_id, subject ?? 'General Enquiry', message.trim()]
    );

    const enquiry = {
      id:         result.insertId,
      turf_id:    parseInt(turf_id),
      user_id,
      subject:    subject ?? 'General Enquiry',
      message:    message.trim(),
      status:     'pending',
      created_at: new Date(),
      reply:      null,
      replied_at: null,
    };

    // ── Emit to admin room so Navbar badge updates instantly ──────────────
    const io = req.app.get('io');
    if (io) {
      io.to(`admin:${turf_id}`).emit('enquiry:new', {
        enquiry,
        preview: message.trim().slice(0, 80),
      });
    }

    res.status(201).json({ message: 'Enquiry submitted', enquiry });
  } catch (err) {
    console.error('createEnquiry error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/enquiries/:id/reply — admin replies ─────────────────────────
const replyEnquiry = async (req, res) => {
  try {
    const turf_id    = req.user?.turf_id;
    const enquiry_id = parseInt(req.params.id);
    const { reply }  = req.body;

    if (!reply?.trim())
      return res.status(400).json({ message: 'Reply text is required' });

    // Verify enquiry belongs to this admin's turf
    const [rows] = await db.query(
      'SELECT id, turf_id, user_id FROM enquiries WHERE id = ? AND turf_id = ? LIMIT 1',
      [enquiry_id, turf_id]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Enquiry not found' });

    // Upsert reply (one reply per enquiry)
    await db.query(
      `INSERT INTO enquiry_replies (enquiry_id, admin_id, reply)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE reply = VALUES(reply), created_at = NOW()`,
      [enquiry_id, req.user.id, reply.trim()]
    );

    // Mark enquiry as resolved
    await db.query(
      `UPDATE enquiries SET status = 'resolved', updated_at = NOW() WHERE id = ?`,
      [enquiry_id]
    );

    // ── Emit reply to the user's socket room so they see it live ─────────
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${rows[0].user_id}`).emit('enquiry:reply', {
        enquiry_id,
        reply:      reply.trim(),
        replied_at: new Date(),
      });
    }

    res.json({ message: 'Reply sent' });
  } catch (err) {
    console.error('replyEnquiry error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/enquiries/admin — admin fetches all enquiries for their turf ──
const getAdminEnquiries = async (req, res) => {
  try {
    const turf_id = req.user?.turf_id;

    const [rows] = await db.query(
      `SELECT
    e.id,
    u.name,
    u.email,
    u.contact,
    e.subject,
    e.message,
    e.status,
    e.created_at,
    er.reply,
    er.created_at AS replied_at
FROM enquiries e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN enquiry_replies er ON er.enquiry_id = e.id
WHERE e.turf_id = ?
ORDER BY e.created_at DESC`,
      [turf_id]
    );

    res.json({ enquiries: rows });
  } catch (err) {
    console.error('getAdminEnquiries error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PATCH /api/enquiries/:id/read — mark as read (clears badge count) ──────
const markRead = async (req, res) => {
  try {
    const turf_id    = req.user?.turf_id;
    const enquiry_id = parseInt(req.params.id);

    await db.query(
      `UPDATE enquiries SET status = 'read', updated_at = NOW()
       WHERE id = ? AND turf_id = ? AND status = 'pending'`,
      [enquiry_id, turf_id]
    );

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getEnquiries, createEnquiry, replyEnquiry, getAdminEnquiries, markRead };