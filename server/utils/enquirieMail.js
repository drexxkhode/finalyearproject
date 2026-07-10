const axios = require("axios");
const db = require("../config/db");

const sendEmail = async (to, subject, html, turfId = null) => {
  let turf_name  = "TurfArena";
  let turf_email = process.env.SENDER_EMAIL;

  if (turfId) {
    // Recipient is a customer, not an admin — look up branding via turf id directly
    const [rows] = await db.execute(
      `SELECT name AS turf_name, email AS turf_email FROM turfs WHERE id = ?`,
      [turfId]
    );
    if (rows.length) {
      turf_name  = rows[0].turf_name;
      turf_email = rows[0].turf_email;
    }
  } else {
    // Original path — recipient is an admin, derive turf via their own record
    const [rows] = await db.execute(
      `SELECT
          turfs.name  AS turf_name,
          turfs.email AS turf_email
       FROM admins
       JOIN turfs ON admins.turf_id = turfs.id
       WHERE admins.email = ?`,
      [to]
    );
    if (!rows.length) {
      throw new Error("Email sent if user exist ");
    }
    turf_name  = rows[0].turf_name;
    turf_email = rows[0].turf_email;
  }

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        email: process.env.SENDER_EMAIL,
        name: turf_name,
      },
      to: [{ email: to }],
      replyTo: {
        email: turf_email,
        name: turf_name,
      },
      subject: subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
};

module.exports = sendEmail;