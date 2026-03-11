const { Resend } = require("resend");
const db = require("../config/db");

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { turf_name, turf_email } = rows[0];

  // 2️⃣ Send email using Resend
  await resend.emails.send({
    from: `${turf_name} <onboarding@resend.dev>`,
    to: to,
    reply_to: turf_email,
    subject: subject,
    html: html,
  });
};

module.exports = sendEmail;