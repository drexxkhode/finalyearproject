const db = require('../config/db');

// ── GET /api/enquiries?turf_id=1 — public, loads enquiries for a turf ──────

const getReviews = async (req, res) => {
  try {
    const { turf_id } = req.query;
    if (!turf_id)
      return res.status(400).json({ message: 'turf_id is required' });

    const [rows] = await db.query(
      `SELECT
    r.id,
    u.name,
    r.comment,
    r.rating,
    r.created_at
FROM reviews r
LEFT JOIN users u ON r.user_id = u.id
WHERE r.turf_id = ?
ORDER BY r.created_at DESC`,
      [turf_id]
    );

    res.json({ reviews: rows });
  } catch (err) {
    console.error('getEnquiries error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
// ── POST /api/enquiries — client submits turf review (now tied to a visit) ─
const createReview = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const { turf_id, booking_date, message, rating } = req.body;
    if (!turf_id || !booking_date || !message?.trim() || !rating)
      return res.status(400).json({ message: 'turf_id, booking_date, message and rating are required' });

    // Must correspond to a real, eligible visit
    const [prompts] = await db.query(
      `SELECT id, status FROM review_prompts
       WHERE user_id = ? AND turf_id = ? AND booking_date = ?`,
      [user_id, turf_id, booking_date]
    );
    if (!prompts.length) {
      return res.status(400).json({ message: 'No completed visit found for this booking.' });
    }
    if (prompts[0].status === 'reviewed') {
      return res.status(400).json({ message: 'You already reviewed this visit.' });
    }
    const dateOnly = String(booking_date).slice(0, 10);
    const [result] = await db.query(
      `INSERT INTO reviews (turf_id, user_id, booking_date, comment, rating)
       VALUES (?, ?, ?, ?, ?)`,
      [turf_id, user_id, dateOnly, message.trim(), rating]
    );

    await db.query(
      `UPDATE review_prompts SET status = 'reviewed' WHERE id = ?`,
      [prompts[0].id]
    );

    const review = {
      id: result.insertId,
      turf_id: parseInt(turf_id),
      user_id,
      booking_date,
      comment: message.trim(),
      rating,
      created_at: new Date(),
    };

    res.status(201).json({ message: 'Review submitted', review });
  } catch (err) {
    console.error('createReview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/turf-reviews/pending — one pending prompt for the logged-in user ─
const getPendingReview = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const [rows] = await db.query(
      `SELECT rp.turf_id, rp.booking_date, t.name AS turf_name
       FROM review_prompts rp
       JOIN turfs t ON t.id = rp.turf_id
       WHERE rp.user_id = ? AND rp.status = 'pending'
       ORDER BY rp.created_at ASC
       LIMIT 1`,
      [user_id]
    );

    if (!rows.length) return res.json({ pending: false });

    res.json({
      pending: true,
      turf_id: rows[0].turf_id,
      booking_date: String(rows[0].booking_date).slice(0, 10),
      turf_name: rows[0].turf_name,
    });
  } catch (err) {
    console.error('getPendingReview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/turf-reviews/dismiss — user tapped Skip ──────────────────────
const dismissReview = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const { turf_id, booking_date } = req.body;
    if (!turf_id || !booking_date)
      return res.status(400).json({ message: 'turf_id and booking_date are required' });
    const dateOnly = String(booking_date).slice(0, 10);
    await db.query(
      `UPDATE review_prompts
       SET status = 'dismissed'
       WHERE user_id = ? AND turf_id = ? AND booking_date = ? AND status = 'pending'`,
      [user_id, turf_id, dateOnly]
    );

    res.json({ message: 'Dismissed' });
  } catch (err) {
    console.error('dismissReview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/reviews — client submits System review ───────────────────────────
const createSystemReview =async (req, res ) =>{
// controllers/systemReviewController.js

    try {

        const userId = req.user.id;

        const {
            paystack_ref,
            rating,
            comment
        } = req.body;

        if (!rating) {
            return res.status(400).json({
                success:false,
                message:"Rating is required."
            });
        }

        // Check duplicate
        const [exist] = await db.query(
            "SELECT id FROM system_reviews WHERE paystack_ref=?",
            [paystack_ref]
        );

        if (exist.length) {
            return res.status(400).json({
                success:false,
                message:"Review already submitted."
            });
        }

        await db.query(
            `INSERT INTO system_reviews
            (
                user_id,
                paystack_ref,
                rating,
                comment
            )
            VALUES(?,?,?,?)`,
            [
                userId,
                paystack_ref,
                rating,
                comment || null
            ]
        );

        res.status(201).json({
            success:true,
            message:"Thank you for your feedback."
        });

    } catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            message:"Server Error"
        });

    }
};
// ── GET /api/reviews —  gets System review for Super Admin───────────────────────────
const getAllSystemReviews = async(req,res)=>{

    try{

        const [reviews] = await db.query(

            `SELECT

                s.id,
                s.rating,
                s.comment,
                s.would_recommend,
                s.created_at,

                u.name,
                u.email

            FROM system_reviews s

            JOIN users u

            ON s.user_id=u.id

            ORDER BY s.created_at DESC`

        );

        res.json(reviews);

    }catch(err){

        console.log(err);

        res.status(500).json({
            success:false
        });

    }

};
// ── GET /api/reviews —  gets System review stats for Super Admin───────────────────────────

const getSystemReviewStats = async(req,res)=>{

    try{

        const [[stats]] = await db.query(

            `SELECT

            COUNT(*) total_reviews,

            ROUND(AVG(rating),1) average_rating,

            SUM(would_recommend=1) recommends,

            SUM(would_recommend=0) not_recommend

            FROM system_reviews`

        );

        const [distribution] = await db.query(

            `SELECT

            rating,

            COUNT(*) total

            FROM system_reviews

            GROUP BY rating

            ORDER BY rating DESC`

        );

        res.json({

            stats,
            distribution

        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            success:false
        });

    }

};

module.exports = {
  getReviews,
  createReview,
  createSystemReview,
  getPendingReview,
  dismissReview,
  getAllSystemReviews,
  getSystemReviewStats,
};