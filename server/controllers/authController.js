const db = require("../config/db");
const multer = require('multer');
const path = require('path');
const bcrypt = require("bcryptjs");
const fs = require("fs").promises;
const generateToken = require("../config/jwt");

// ================== Multer Setup ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // folder to save uploaded files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png) are allowed'));
    }
  }
});

// ================== Password Validator ==================
const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};

// ================== Register ==================
exports.register = [
  upload.single('photo'), // multer middleware
  async (req, res) => {
    const {
      firstName,
      middleName,
      lastName,
      dob,
      contact,
      gender,
      address,
      nationalId,
      email,
      maritalStatus,
      role,
      password
    } = req.body;

    try {
      const turf_id = req.user.turf_id;
      if (!turf_id) {
        return res.status(403).json({ message: "No turf assigned to this account" });
      }

      if (req.user.role !== 'staff') {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [existing] = await db.query(
        "SELECT id FROM admins WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({ message: "Password must be at least 8 chars with uppercase, lowercase, and number" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const photo = req.file ? req.file.filename : null;

      const sql = `
        INSERT INTO admins (
          turf_id, firstName, middleName, lastName, dob,
          contact, gender, address, nationalId, email,
          maritalStatus, role, password, photo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        turf_id,
        firstName,
        middleName,
        lastName,
        dob,
        contact,
        gender,
        address,
        nationalId,
        email,
        maritalStatus,
        role,
        hashedPassword,
        photo
      ];

      const [result] = await db.query(sql, values);

      res.status(201).json({
        message: "Registration successful",
        userId: result.insertId
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
];

/* LOGIN */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Get user by email
    const [users] = await db.query(
      "SELECT * FROM admins WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
  
    // 2️⃣ Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3️⃣ Generate JWT
    const token = generateToken({
      id: user.id,
      role: user.role,
      name: user.firstName,
      lastName: user.lastName,
      turf_id: user.turf_id  // ✅ include turf_id for auth
    });
    // 4️⃣ Respond with token and user info
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
        turf_id: user.turf_id  // include turf info
      }
      
    });
   
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
};

/* UPDATE USER */

exports.updateUser = [
  upload.single('photo'), // optional photo
  async (req, res) => {
    const {
      firstName,
      middleName,
      lastName,
      dob,
      contact,
      gender,
      address,
      nationalId,
      email,
      maritalStatus,
      role
    } = req.body;

    const userId = req.user.id;

    try {
      // 1️⃣ Get existing user data
      const [existingRows] = await db.query("SELECT photo FROM admins WHERE id = ?", [userId]);
      if (!existingRows.length) {
        return res.status(404).json({ message: "User not found" });
      }
      const oldPhoto = existingRows[0].photo;

      // 2️⃣ Build dynamic query
      const fields = [
        "firstName = ?",
        "middleName = ?",
        "lastName = ?",
        "dob = ?",
        "contact = ?",
        "gender = ?",
        "address = ?",
        "nationalId = ?",
        "email = ?",
        "maritalStatus = ?",
        "role = ?"
      ];
      const values = [
        firstName,
        middleName,
        lastName,
        dob,
        contact,
        gender,
        address,
        nationalId,
        email,
        maritalStatus,
        role
      ];

      // 3️⃣ Only update photo if uploaded
      if (req.file) {
        fields.push("photo = ?");
        values.push(req.file.filename);

        // Delete old photo from storage if it exists
        if (oldPhoto) {
          const filePath = path.join(__dirname, '..', 'uploads', oldPhoto);
          try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            console.log(`Deleted old photo: ${oldPhoto}`);
          } catch (err) {
            console.warn(`Old photo not deleted (may not exist): ${oldPhoto}`, err.message);
          }
        }
      }

      const sql = `UPDATE admins SET ${fields.join(", ")} WHERE id = ?`;
      values.push(userId);

      await db.query(sql, values);

      res.json({ message: "User updated successfully" });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
];

/* DELETE USER */
exports.deleteUser = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query("DELETE FROM admins WHERE id = ?", [userId]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminDetails = async (req, res) => {
  const userId = req.params.id; // <-- fix here

  try {
    const [rows] = await db.query(
      `SELECT id, firstName, middleName, lastName, dob, contact, gender,
              address, nationalId, email, maritalStatus, role, photo
       FROM admins
       WHERE id = ?`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Convert photo filename to full URL
    const admins = rows.map(admin => ({
      ...admin,
      photo: admin.photo ? `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${admin.photo}` : null
    }));

    res.json(admins[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

exports.getAllAdmins = async (req, res) => {
  try {
    const turf_id = req.user.turf_id; // comes from JWT

    if (!turf_id) {
      return res.status(403).json({ message: "No turf assigned to this account" });
    }

    const [rows] = await db.query(
      `
      SELECT id, turf_id, firstName, middleName, lastName, dob, contact, gender,
             address, nationalId, email, maritalStatus, role, photo
      FROM admins
      WHERE turf_id = ?
      `,
      [turf_id]
    );
    

    // Convert photo filename to full URL
    const admins = rows.map(admin => ({
      ...admin,
      photo: admin.photo ? `${BASE_URL}/uploads/${admin.photo}` : null
    }));

    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};