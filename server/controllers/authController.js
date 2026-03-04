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
        photo
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
    const userId = req.user.id;
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
      return res.status(404).json({ message: "User not found" });
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
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.execute(
      "UPDATE admins SET reset_token = ?, reset_token_expiry = ?, reset_request_time = NOW() WHERE id = ? AND email= ?",
      [resetToken, expiry, user.id, email]
    );

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
   
     await sendEmail(
      email,
      "Password Reset",
      `<p>Click here to reset password:</p><a href="${resetLink}">${resetLink}</a><p>This link expires in 15 minutes.</p>`
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