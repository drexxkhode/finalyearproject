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
        admins.email AS user_email,
        turfs.name AS turf_name,
        turfs.email AS turf_email
     FROM admins
     JOIN turfs ON admins.turf_id = turfs.id
     WHERE admins.email = ?`,
    [to]
  );

  if (!rows.length) {
    throw new Error("User not found");
  }

  const {turf_name, turf_email } = rows[0];

  // 2️⃣ Send email using turf info
  await transporter.sendMail({
    from: `"${turf_name}" <${process.env.EMAIL_USER}>`,
    replyTo: turf_email,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;