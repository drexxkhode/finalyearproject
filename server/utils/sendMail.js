const axios = require("axios");
const db = require("../config/db");

const sendEmail = async (to, subject, html) => {
  
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
    throw new Error("Email sent if user exist ");
  }

  const { turf_name, turf_email } = rows[0];
  console.log("BREVO KEY:", process.env.BREVO_API_KEY);

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