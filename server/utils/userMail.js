const nodemailer = require("nodemailer");
const db = require("../config/db");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  // 1️⃣ Get user + turf in ONE query
  const [rows] = await db.execute(
    `SELECT 
        id, name FROM users WHERE email = ?`,
    [to]
  );

  if (!rows.length) {
    throw new Error("User not found");
  }

  // 2️⃣ Send email using turf info
  await transporter.sendMail({
    from: `"TURFARENA" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;