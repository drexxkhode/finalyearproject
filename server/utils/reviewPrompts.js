const cron = require('node-cron');
const db = require('../config/db'); // assumes a mysql2 pool with .execute() — adjust to your actual db module

async function markCompletedBookings() {
  const [result] = await db.execute(`
    UPDATE bookings b
    JOIN time_slots ts ON b.time_slot_id = ts.id
    SET b.status = 'completed'
    WHERE b.status = 'confirmed'
      AND b.is_deleted = 0
      AND TIMESTAMP(b.booking_date, ts.end_time) <= NOW()
  `);
  if (result.affectedRows > 0) {
    console.log(`[reviewPrompts] marked ${result.affectedRows} slot(s) completed`);
  }
}

async function createPendingPrompts() {
  // A "visit" (user_id, turf_id, booking_date) is eligible once it has
  // at least one completed slot AND no slot still sitting at 'confirmed'.
  // Cancelled/deleted slots are excluded so a partial cancellation
  // doesn't block the prompt.
  const [result] = await db.execute(`
    INSERT INTO review_prompts (user_id, turf_id, booking_date, status)
    SELECT user_id, turf_id, booking_date, 'pending'
    FROM (
      SELECT
        user_id, turf_id, booking_date,
        SUM(status = 'confirmed') AS still_confirmed,
        SUM(status = 'completed') AS done_count
      FROM bookings
      WHERE is_deleted = 0
        AND status IN ('confirmed', 'completed')
      GROUP BY user_id, turf_id, booking_date
    ) visit_summary
    WHERE still_confirmed = 0 AND done_count > 0
    ON DUPLICATE KEY UPDATE review_prompts.id = review_prompts.id
  `);
  if (result.affectedRows > 0) {
    console.log(`[reviewPrompts] created prompt row(s)`);
  }
}

function startReviewPromptCron() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await markCompletedBookings();
      await createPendingPrompts();
    } catch (err) {
      console.error('[reviewPrompts] cron error:', err);
    }
  });
}

module.exports = { startReviewPromptCron };