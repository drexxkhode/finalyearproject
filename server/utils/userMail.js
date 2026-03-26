const axios = require("axios");
const db = require("../config/db");

const sendEmail = async (to, subject, html) => {
  // 1️⃣ Get user in ONE query
  const [rows] = await db.execute(
    `SELECT id, name FROM users WHERE email = ?`,
    [to]
  );

  if (!rows.length) {
    throw new Error("Email sent if account exist!");
  }

  const { name } = rows[0];

  // 2️⃣ Send email
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        email: process.env.SENDER_EMAIL,
        name: process.env.SENDER_NAME,
      },
      to: [{ email: to, name: name }],
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