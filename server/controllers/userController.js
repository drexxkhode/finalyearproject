const db            = require("../config/db");
const bcrypt        = require("bcryptjs");
const crypto        = require("crypto");
const generateToken = require("../config/jwt");
const sendEmail     = require("../utils/userMail");

/* ================= PASSWORD VALIDATION ================= */
const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);


/* ================= REGISTER ================= */
exports.register = [
  async (req, res) => {
    try {
      const { name, email, contact, password } = req.body;

      const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
      if (exists.length)
        return res.status(400).json({ message: "Email already exists" });

      if (!validatePassword(password))
        return res.status(400).json({ message: "Weak password" });

      const hashed = await bcrypt.hash(password, 10);

      await db.query(
        `INSERT INTO users (name, email, contact, password) VALUES (?, ?, ?, ?)`,
        [name, email, contact, hashed]
      );
      res.status(201).json({ message: "Registration successful" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
];

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length)
      return res.status(401).json({ message: "Invalid email or password" });

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken({
      id:      user.id,
      name:    user.name,
      contact: user.contact,
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id:         user.id,
        email:      user.email,
        name:       user.name,
        contact:    user.contact,
        photo:      user.photo ?? null,   // Cloudinary URL already stored as-is
        created_at: user.created_at,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE USER (name / email / contact only) ============= */
// Photo is handled separately by uploadProfilePhoto / deleteProfilePhoto below
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    const [rows] = await db.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (!rows.length)
      return res.status(404).json({ message: "Record not found" });

    const fields = [];
    const values = [];

    ["email", "name", "contact"].forEach((key) => {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    });

    if (!fields.length) return res.json({ message: "Nothing to update" });

    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [
      ...values,
      userId,
    ]);

    // Return updated user so frontend can sync AuthContext immediately
    const [updated] = await db.query(
      `SELECT id, name, email, contact, photo, created_at FROM users WHERE id = ?`,
      [userId]
    );

    res.json({ message: "Profile updated successfully", user: updated[0] });
  } catch (err) {
    res.status(500).json({ error: "Server Error ⚠️" });
  }
};

/* ================= DELETE USER =========================================== */
exports.deleteUser = async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ?", [req.user.id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ME ================================================ */
exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id;

    const [rows] = await db.query(
      `SELECT id, name, email, contact, photo, created_at FROM users WHERE id = ?`,
      [userId]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Account not found" });

    res.json(rows[0]); // photo is already a Cloudinary URL or null
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Failed to load user" });
  }
};

/* ================= CHANGE PASSWORD ======================================= */
exports.changePassword = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { currentPassword, newPassword } = req.body;
    console.log(req.body, userId);

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "All fields are required" });

    const [rows] = await db.execute(
      "SELECT password FROM users WHERE id = ?", [userId]
    );

    if (!rows.length)
      return res.status(404).json({ message: "We couldn't find an account associated with this user." });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    const isSame = await bcrypt.compare(newPassword, rows[0].password);
    if (isSame)
      return res.status(400).json({ message: "New password cannot be same as old password" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [hashed, userId]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= FORGOT PASSWORD ======================================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (!rows.length)
      return res.status(404).json({ message: "We couldn't find an account associated with that email." });

    const user       = rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry     = new Date(Date.now() + 15 * 60 * 1000);

    await db.execute(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ?, reset_request_time = NOW() WHERE id = ? AND email = ?",
      [resetToken, expiry, user.id, email]
    );

    const [findOne] = await db.execute(
      "SELECT name FROM users WHERE id = ? AND email = ?", [user.id, email]
    );
    const name = findOne[0].name;

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    await sendEmail(
      email,
      "Reset Your Password",
      `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 0;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" 
           style="max-width: 600px; background: #ffffff; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="text-align: center; padding: 30px 20px 10px 20px;">
          <img src="https://res.cloudinary.com/daionfxml/image/upload/v1/turfArena_oogeyt.png" 
               alt="Company Logo" width="120"
               style="display: block; margin: 0 auto;" />
        </td>
      </tr>
      <tr>
        <td style="background-color: #1e88e5; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Password Reset Request</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px 30px 15px 30px; color: #333333;">
          <p style="font-size: 16px; margin: 0 0 15px 0;">Hello, <span style="color: #2563eb; font-weight: bold">${name}!</span></p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
            We received a request to reset your password. Click the button below to set a new password.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="background: #ffffff; border-radius: 12px; border: 1px solid #e6edf5; margin: 20px 0;">
            <tr>
              <td style="padding: 15px;">
                <p style="font-size: 14px; color: #1a1f36; margin: 0 0 8px 0; font-weight: bold;">🔐 Password requirements:</p>
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="padding: 2px 0; color: #5b6e8c; font-size: 13px;">• Minimum 6 characters</td></tr>
                  <tr><td style="padding: 2px 0; color: #5b6e8c; font-size: 13px;">• At least one uppercase letter</td></tr>
                  <tr><td style="padding: 2px 0; color: #5b6e8c; font-size: 13px;">• At least one number</td></tr>
                  <tr><td style="padding: 2px 0; color: #5b6e8c; font-size: 13px;">• At least one special character</td></tr>
                </table>
              </td>
            </tr>
          </table>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" 
               style="background-color: #1e88e5; color: #ffffff; padding: 12px 25px;
                      text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;">
            ⏱️ This link will expire in <strong>15 minutes</strong>.
          </p>
          <p style="font-size: 14px; color: #666; margin: 0;">
            If you did not request this, please ignore this email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background: #f8fafd; padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: #8a9bb5; margin: 0 0 8px 0;">
            © ${new Date().getFullYear()} <span style="color:#15803d; font-weight: bold">Turf</span><span style="color:#2563eb; font-weight: bold">Arena</span>. All rights reserved.
          </p>
          <p style="font-size: 12px; color: #a0b3cc; margin: 0;">
            <a href="#" style="color: #8a9bb5; text-decoration: underline; margin: 0 5px;">Privacy Policy</a> | 
            <a href="#" style="color: #8a9bb5; text-decoration: underline; margin: 0 5px;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
  `
    );

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD ======================================== */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!validatePassword(newPassword))
      return res.status(400).json({
        message: "Password must be at least 6 characters long and include uppercase, lowercase, and a number.",
      });

    const [rows] = await db.execute(
      "SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()",
      [token]
    );

    if (!rows.length)
      return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.execute(
      `UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`,
      [hashed, rows[0].id]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};