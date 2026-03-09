const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs").promises;
const generateToken = require("../config/jwt");
// controllers/authController.js
const crypto = require("crypto");
const sendEmail = require("../utils/sendMail");

/* ================= BASE URL ================= */
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

/* ================= PHOTO URL HELPER ================= */
const photoUrl = (photo) => {
  return photo ? `${BASE_URL}/uploads/${photo}` : null;
};

/* ================= MULTER SETUP ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Only image files allowed"));
  }
});

/* ================= PASSWORD VALIDATION ================= */
const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

/* ================= REGISTER ================= */
exports.register = [
  upload.single("photo"),
  async (req, res) => {
    try {
      if (req.user.role !== "Manager")
        return res.status(403).json({ message: "Not authorized" });

      const turf_id = req.user.turf_id;
      if (!turf_id)
        return res.status(403).json({ message: "No turf assigned" });

      const {
        firstName, middleName, lastName, dob,
        contact, gender, address, nationalId,
        email, maritalStatus, role, password
      } = req.body;

      const [exists] = await db.query(
        "SELECT id FROM admins WHERE email = ?",
        [email]
      );
      if (exists.length)
        return res.status(400).json({ message: "Email already exists" });

      if (!validatePassword(password))
        return res.status(400).json({ message: "Weak password" });

      const hashed = await bcrypt.hash(password, 10);
      const photo = req.file ? req.file.filename : null;

      await db.query(
        `INSERT INTO admins
        (turf_id, firstName, middleName, lastName, dob,
         contact, gender, address, nationalId, email,
         maritalStatus, role, password, photo)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          turf_id, firstName, middleName, lastName, dob,
          contact, gender, address, nationalId,
          email, maritalStatus, role, hashed, photo
        ]
      );
      console.log(req.body);
      res.status(201).json({ message: "Registration successful" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
];

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM admins WHERE email = ?",
      [email]
    );
    if (!rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({
      id: user.id,
      role: user.role,
      turf_id: user.turf_id
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        turf_id: user.turf_id,
        photo: photoUrl(user.photo)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE USER ================= */
exports.updateUser = [
  upload.single("photo"),
  async (req, res) => {
    try {
      const userId = req.params.id;

      const [rows] = await db.query(
        "SELECT photo FROM admins WHERE id = ?",
        [userId]
      );
      if (!rows.length)
        return res.status(404).json({ message: "Record not found" });

      const oldPhoto = rows[0].photo;

      const fields = [];
      const values = [];

      [
        "firstName","middleName","lastName","dob",
        "contact","gender","address","nationalId",
        "email","maritalStatus","role"
      ].forEach((key) => {
        if (req.body[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(req.body[key]);
        }
      });

      if (req.file) {
        fields.push("photo = ?");
        values.push(req.file.filename);

        if (oldPhoto) {
          const oldPath = path.join(__dirname, "..", "uploads", oldPhoto);
          try { await fs.unlink(oldPath); } catch {}
        }
      }

      if (!fields.length)
        return res.json({ message: "Nothing to update" });

      await db.query(
        `UPDATE admins SET ${fields.join(", ")} WHERE id = ?`,
        [...values, userId]
      );

      res.json({ message: "Record updated successful" });
    } catch (err) {
      res.status(500).json({ error: "Server Error ⚠️" });
    }
  }
];

/* ================= DELETE USER ================= */
exports.deleteUser = async (req, res) => {
  try {
    await db.query("DELETE FROM admins WHERE id = ?", [req.user.id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ADMIN BY ID ================= */
exports.getAdminDetails = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM admins WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Admin not found" });

    const admin = rows[0];
    admin.photo = photoUrl(admin.photo);

    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ALL ADMINS ================= */
exports.getAllAdmins = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM admins WHERE turf_id = ?",
      [req.user.turf_id]
    );

    const admins = rows.map(a => ({
      ...a,
      photo: photoUrl(a.photo)
    }));

    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user comes from JWT middleware
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT 
        id,
        turf_id,
        firstName,
        middleName,
        lastName,
        email,
        role,
        photo,
        address,
        dob,
        contact,
        gender,
        maritalStatus,
        nationalId
       FROM admins
       WHERE id = ?`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    res.json({
      ...user,
      photo: user.photo
        ? `${BASE_URL}/uploads/${user.photo}`
        : null
    });

  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Failed to load user" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Get user from database
    const [rows] = await db.execute(
      "SELECT password FROM admins WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
  message: "We couldn't find an account associated with this user."
});
    }

    const user = rows[0];

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Prevent using same password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be same as old password",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.execute(
      "UPDATE admins SET password = ? WHERE id = ?",
      [hashedPassword, userId]
    );

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await db.execute(
      "SELECT id FROM admins WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
     return res.status(404).json({
        message: "We couldn't find an account associated with that email."});
       }

    const user = rows[0];

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.execute(
      "UPDATE admins SET reset_token = ?, reset_token_expiry = ?, reset_request_time = NOW() WHERE id = ? AND email= ?",
      [resetToken, expiry, user.id, email]
    );
const [findOne] = await db.execute(
"SELECT lastName FROM admins WHERE id = ? AND email = ?",
[user.id, email]
);
const lastName = findOne[0].lastName;

  const resetLink = `https://admindashboard-c220.onrender.com/reset-password/${resetToken}`;

await sendEmail(
  email,
  "Reset Your Password",
  `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 0;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" 
           style="max-width: 600px; background: #ffffff; border-radius: 8px; overflow: hidden;">

      <!-- LOGO SECTION -->
      <tr>
        <td style="text-align: center; padding: 30px 20px 10px 20px;">
          <img src="https://res.cloudinary.com/daionfxml/image/upload/v1/turfArena_oogeyt.png" 
               alt="Company Logo" 
               width="120"
               style="display: block; margin: 0 auto;" />
        </td>
      </tr>

      <!-- HEADER -->
      <tr>
        <td style="background-color: #1e88e5; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Password Reset Request</h2>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding: 30px 30px 15px 30px; color: #333333;">
          <p style="font-size: 16px; margin: 0 0 15px 0;">Hello, <span style="color: #2563eb;font-weight: bold">${lastName}!</span></p>

          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
            We received a request to reset your password. Click the button below to set a new password.
          </p>
          
          <!-- INFO CARD -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 12px; border: 1px solid #e6edf5; margin: 20px 0;">
            <tr>
              <td style="padding: 15px;">
                <p style="font-size: 14px; color: #1a1f36; margin: 0 0 8px 0; font-weight: bold;">🔐 Password requirements:</p>
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="padding: 2px 0; color: #5b6e8c; font-size: 13px;">• Minimum 8 characters</td></tr>
                  <tr><td style="padding: 2px 0; color: #5b6e8c; font-size: 13px;">• At least one uppercase letter</td></tr>
                  <tr><td style="padding: 2px 0; color: #5b6e8c; font-size: 13px;">• At least one number</td></tr>
                  <tr><td style="padding: 2px 0; color: #5b6e8c; font-size: 13px;">• At least one special character</td></tr>
                </table>
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" 
               style="
                 background-color: #1e88e5;
                 color: #ffffff;
                 padding: 12px 25px;
                 text-decoration: none;
                 border-radius: 5px;
                 font-size: 16px;
                 display: inline-block;
               ">
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

      <!-- FOOTER - No border-top to reduce visual gap -->
      <tr>
        <td style="background: #f8fafd; padding: 20px 20px; text-align: center;">
          <p style="font-size: 13px; color: #8a9bb5; margin: 0 0 8px 0;">
            © ${new Date().getFullYear()} <span style="color:#15803d;font-weight: bold">Turf</span><span style="color:#2563eb;font-weight: bold">Arena</span>. All rights reserved.
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

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!validatePassword(newPassword))
       return res.status(400).json({ message: "Password must be at least 8 characters long and include uppercase, lowercase, and a number." });

    const [rows] = await db.execute(
      "SELECT id FROM admins WHERE reset_token = ? AND reset_token_expiry > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = rows[0];

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      `UPDATE admins 
       SET password = ?, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
