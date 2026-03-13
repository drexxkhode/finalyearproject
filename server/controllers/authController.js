const db           = require("../config/db");
const bcrypt       = require("bcryptjs");
const crypto       = require("crypto");
const generateToken = require("../config/jwt");
const sendEmail    = require("../utils/sendMail");
const { uploadToCloudinary, deleteFromCloudinary } = require("../middleware/upload");

const URL = process.env.REACT_APP_URL;
/* ================= PASSWORD VALIDATION ================= */
const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

/* ================= HELPER: extract Cloudinary public_id from URL ========= */
const extractPublicId = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const afterUpload = url.split("/upload/")[1];
    if (!afterUpload) return null;
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

/* ================= REGISTER ================= */
// Route must use: upload.single('photo') middleware before this handler
exports.register = async (req, res) => {
  try {
    if (req.user?.role !== "Manager")
      return res.status(403).json({ message: "Not authorized" });

    const turf_id = req.user?.turf_id;
    if (!turf_id)
      return res.status(403).json({ message: "No turf assigned" });

    const {
      firstName, middleName, lastName, dob,
      contact, gender, address, nationalId,
      email, maritalStatus, role, password,
    } = req.body;

    const [exists] = await db.query(
      "SELECT id FROM admins WHERE email = ?", [email]
    );
    if (exists.length)
      return res.status(400).json({ message: "Email already exists" });

    if (!validatePassword(password))
      return res.status(400).json({ message: "Weak password" });

    const hashed = await bcrypt.hash(password, 10);

    // Upload photo to Cloudinary if provided
    let photoUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "turfarena/admins",
        `admin_${turf_id}_${Date.now()}`
      );
      photoUrl = result.secure_url;
    }

    await db.query(
      `INSERT INTO admins
       (turf_id, firstName, middleName, lastName, dob,
        contact, gender, address, nationalId, email,
        maritalStatus, role, password, photo)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        turf_id, firstName, middleName, lastName, dob,
        contact, gender, address, nationalId,
        email, maritalStatus, role, hashed, photoUrl,
      ]
    );

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM admins WHERE email = ?", [email]
    );
    if (!rows.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({
      id:      user.id,
      role:    user.role,
      turf_id: user.turf_id,
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id:           user.id,
        firstName:    user.firstName,
        middleName:   user.middleName,
        lastName:     user.lastName,
        email:        user.email,
        role:         user.role,
        turf_id:      user.turf_id,
        photo:        user.photo ?? null,  // already a Cloudinary URL or null
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE ADMIN ============================================
   Handles text fields + optional photo in one FormData request.
   Route: PUT /api/auth/update/:id  (upload.single('photo') middleware)       */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params?.id;

    // Verify admin exists + get current photo for cleanup
    const [rows] = await db.query(
      "SELECT id, photo FROM admins WHERE id = ?", [userId]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Record not found" });

    const fields = [];
    const values = [];

    // Text fields
    [
      "firstName", "middleName", "lastName", "dob",
      "contact", "gender", "address", "nationalId",
      "email", "maritalStatus", "role",
    ].forEach((key) => {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    });

    // Photo — only if a new file was uploaded
    let newPhotoUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "turfarena/admins",
        `admin_${userId}_${Date.now()}`
      );
      newPhotoUrl = result.secure_url;
      fields.push("photo = ?");
      values.push(newPhotoUrl);
    }

    if (!fields.length)
      return res.json({ message: "Nothing to update" });

    await db.query(
      `UPDATE admins SET ${fields.join(", ")} WHERE id = ?`,
      [...values, userId]
    );

    // Delete old photo from Cloudinary AFTER successful DB save
    if (req.file && rows[0].photo) {
      const oldPublicId = extractPublicId(rows[0].photo);
      if (oldPublicId) await deleteFromCloudinary(oldPublicId).catch(() => {});
    }

    // Return updated admin so frontend can sync immediately
    const [updated] = await db.query(
      `SELECT id, turf_id, firstName, middleName, lastName,
              email, role, photo, contact, gender,
              address, dob, maritalStatus, nationalId
       FROM admins WHERE id = ?`,
      [userId]
    );

    res.json({ message: "Record updated successfully", admin: updated[0] });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ error: "Server Error ⚠️" });
  }
};

/* ================= UPLOAD ADMIN PHOTO =====================================
   PUT /api/auth/admins/:id/photo
   Expects: upload.single('photo') middleware on the route               */
exports.uploadAdminPhoto = async (req, res) => {
  try {
    const userId = req.params?.id;
    if (!req.file)
      return res.status(400).json({ message: "No image provided" });

    // Get current photo to delete from Cloudinary after upload
    const [rows] = await db.query(
      "SELECT photo FROM admins WHERE id = ? LIMIT 1", [userId]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Admin not found" });

    const oldPublicId = extractPublicId(rows[0].photo);

    // Upload new photo
    const result = await uploadToCloudinary(
      req.file.buffer,
      "turfarena/admins",
      `admin_${userId}_${Date.now()}`
    );

    // Save new URL
    await db.query(
      "UPDATE admins SET photo = ? WHERE id = ?",
      [result.secure_url, userId]
    );

    // Delete old from Cloudinary after successful DB save
    if (oldPublicId) await deleteFromCloudinary(oldPublicId);

    // Return updated admin
    const [updated] = await db.query(
      `SELECT id, turf_id, firstName, middleName, lastName,
              email, role, photo, contact
       FROM admins WHERE id = ? LIMIT 1`,
      [userId]
    );

    console.log(`[admin-photo] uploaded admin=${userId} public_id=${result.public_id}`);
    res.json({ message: "Photo updated", admin: updated[0] });
  } catch (err) {
    console.error("uploadAdminPhoto error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE ADMIN PHOTO =====================================
   DELETE /api/auth/admins/:id/photo                                      */
exports.deleteAdminPhoto = async (req, res) => {
  try {
    const userId = req.params?.id;

    const [rows] = await db.query(
      "SELECT photo FROM admins WHERE id = ? LIMIT 1", [userId]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Admin not found" });

    const publicId = extractPublicId(rows[0].photo);

    // Clear from DB first
    await db.query("UPDATE admins SET photo = NULL WHERE id = ?", [userId]);

    // Then delete from Cloudinary
    if (publicId) await deleteFromCloudinary(publicId);

    const [updated] = await db.query(
      `SELECT id, turf_id, firstName, middleName, lastName,
              email, role, photo, contact
       FROM admins WHERE id = ? LIMIT 1`,
      [userId]
    );

    console.log(`[admin-photo] removed admin=${userId}`);
    res.json({ message: "Photo removed", admin: updated[0] });
  } catch (err) {
    console.error("deleteAdminPhoto error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE ADMIN ========================================== */
exports.deleteUser = async (req, res) => {
  try {
    // Delete photo from Cloudinary before deleting the admin
    const [rows] = await db.query(
      "SELECT photo FROM admins WHERE id = ?", [req.user.id]
    );
    if (rows.length && rows[0].photo) {
      await deleteFromCloudinary(extractPublicId(rows[0].photo));
    }

    await db.query("DELETE FROM admins WHERE id = ?", [req.user.id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ADMIN BY ID ======================================= */
exports.getAdminDetails = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, turf_id, firstName, middleName, lastName,
              email, role, photo, contact, gender,
              address, dob, maritalStatus, nationalId
       FROM admins WHERE id = ?`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Admin not found" });

    res.json(rows[0]); // photo is already a Cloudinary URL or null
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ALL ADMINS ======================================== */
exports.getAllAdmins = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, turf_id, firstName, middleName, lastName,
              email, role, photo, contact, gender,
              address, dob, maritalStatus, nationalId
       FROM admins WHERE turf_id = ?`,
      [req.user.turf_id]
    );
    res.json(rows); // photos are already Cloudinary URLs or null
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ME ================================================ */
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT id, turf_id, firstName, middleName, lastName,
              email, role, photo, address, dob, contact,
              gender, maritalStatus, nationalId
       FROM admins WHERE id = ?`,
      [userId]
    );

    if (!rows.length)
      return res.status(404).json({ message: "User not found" });

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
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: "All fields are required" });

    const [rows] = await db.execute(
      "SELECT password FROM admins WHERE id = ?", [userId]
    );
    if (!rows.length)
      return res.status(404).json({ message: "We couldn't find an account associated with this user." });

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    const isSame = await bcrypt.compare(newPassword, rows[0].password);
    if (isSame)
      return res.status(400).json({ message: "New password cannot be same as old password" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute(
      "UPDATE admins SET password = ? WHERE id = ?", [hashed, userId]
    );

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

    const [rows] = await db.execute(
      "SELECT id FROM admins WHERE email = ?", [email]
    );
    if (!rows.length)
      return res.status(404).json({ message: "We couldn't find an account associated with that email." });

    const user       = rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry     = new Date(Date.now() + 15 * 60 * 1000);

    await db.execute(
      "UPDATE admins SET reset_token = ?, reset_token_expiry = ?, reset_request_time = NOW() WHERE id = ? AND email = ?",
      [resetToken, expiry, user.id, email]
    );

    const [findOne] = await db.execute(
      "SELECT lastName FROM admins WHERE id = ? AND email = ?", [user.id, email]
    );
    const lastName = findOne[0].lastName;

    const resetLink = `${URL}/reset-password/${resetToken}`;

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
               alt="Company Logo" width="120" style="display: block; margin: 0 auto;" />
        </td>
      </tr>
      <tr>
        <td style="background-color: #1e88e5; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Password Reset Request</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px 30px 15px 30px; color: #333333;">
          <p style="font-size: 16px; margin: 0 0 15px 0;">Hello, <span style="color: #2563eb; font-weight: bold">${lastName}!</span></p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
            We received a request to reset your password. Click the button below to set a new password.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="background: #ffffff; border-radius: 12px; border: 1px solid #e6edf5; margin: 20px 0;">
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
        message: "Password must be at least 8 characters long and include uppercase, lowercase, and a number.",
      });

    const [rows] = await db.execute(
      "SELECT id FROM admins WHERE reset_token = ? AND reset_token_expiry > NOW()",
      [token]
    );
    if (!rows.length)
      return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute(
      `UPDATE admins SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`,
      [hashed, rows[0].id]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};