// middleware/passwordResetRateLimit.js
const db = require("../config/db"); // MySQL connection

// Set your cooldown period here (in seconds)
const RESET_COOLDOWN = 1 * 60; // 5 minutes

const passwordResetRateLimit = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Get last reset request time from users table
    const [rows] = await db.execute(
      "SELECT reset_request_time FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const lastRequest = rows[0].reset_request_time;

    if (lastRequest) {
      const now = new Date();
      const diffSeconds = (now - new Date(lastRequest)) / 1000;

      if (diffSeconds < RESET_COOLDOWN) {
        const minutesLeft = Math.ceil((RESET_COOLDOWN - diffSeconds) / 60);
        return res.status(429).json({
          message: `You can request a password reset again in ${minutesLeft} minute(s)`,
          minutesLeft
        });
      }
    }

    // Pass through if allowed
    next();
  } catch (error) {
    console.error("Rate-limit middleware error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = passwordResetRateLimit;