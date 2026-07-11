const db = require('../config/db');
const sendEmail = require("../utils/enquirieMail");

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

    const [rows] = await db.query(
      'SELECT id, turf_id, user_id FROM enquiries WHERE id = ? AND turf_id = ? LIMIT 1',
      [enquiry_id, turf_id]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Enquiry not found' });

    await db.query(
      `INSERT INTO enquiry_replies (enquiry_id, admin_id, reply)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE reply = VALUES(reply), created_at = NOW()`,
      [enquiry_id, req.user.id, reply.trim()]
    );

    const [[enquiryDetail]] = await db.query(
      `SELECT e.id, u.name, u.email, e.message
       FROM enquiries e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = ?
       LIMIT 1`,
      [enquiry_id]
    );

    if (enquiryDetail?.email) {
      try {
        await sendEmail(
          enquiryDetail.email,
          'Reply to your enquiry',
          `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#e8edf2;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#e8edf2;padding:20px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #d0d7e2;">
        <tr>
          <td style="background-color:#1565c0;padding:16px 24px 0 24px;text-align:center;">
            <img src="https://res.cloudinary.com/daionfxml/image/upload/v1773645071/turfArena_transparent_kqf2ru.png"
                 alt="TurfArena" width="90" style="display:block;margin:0 auto;" />
            <h2 style="color:#ffffff;margin:8px 0 14px 0;font-size:17px;font-weight:600;">
              Reply to Your Enquiry
            </h2>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px 16px 24px;">
            <p style="font-size:14px;color:#222;margin:0 0 10px 0;">
              Hello, <strong style="color:#1565c0;">${enquiryDetail.name}!</strong>
            </p>
            <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 16px 0;">
              ${reply}
            </p>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #eaecf0;padding:12px 24px;text-align:center;background:#ffffff;">
            <p style="font-size:12px;color:#aaa;margin:0 0 4px 0;">
              &copy; ${new Date().getFullYear()}
              <span style="color:#15803d;font-weight:bold;">Turf</span><span style="color:#1565c0;font-weight:bold;">Arena</span>.
              All rights reserved.
            </p>
            <p style="font-size:11px;margin:0;">
              <a href="#" style="color:#999;text-decoration:underline;">Privacy Policy</a>
              &nbsp;&middot;&nbsp;
              <a href="#" style="color:#999;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
          turf_id   // ← this is the key addition
        );
        return res.json({message: "Reply sent!"})
      } catch (mailErr) {
        console.error('replyEnquiry sendEmail error:', mailErr);
        // Reply already saved — don't fail the request just because mail failed
      }
    }

    await db.query(
      `UPDATE enquiries SET status = 'resolved', updated_at = NOW() WHERE id = ?`,
      [enquiry_id]
    );

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

module.exports = { createEnquiry, replyEnquiry, getAdminEnquiries, markRead };