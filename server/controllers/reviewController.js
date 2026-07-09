const db = require('../config/db');

// ── GET /api/enquiries?turf_id=1 — public, loads enquiries for a turf ──────

const getReviews = async (req, res) => {
  try {
    const { turf_id } = req.query;
    if (!turf_id)
      return res.status(400).json({ message: 'turf_id is required' });

    const [rows] = await db.query(
      `SELECT
    r.r_id,
    u.name,
    r.message,
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

// ── POST /api/enquiries — client submits review ───────────────────────────
const createReview = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const { turf_id, message, rating } = req.body;
    if (!turf_id || !message?.trim())
      return res.status(400).json({ message: 'turf_id and message are required' });

    const [result] = await db.query(
      `INSERT INTO enquiries (turf_id, user_id, message, rating)
       VALUES (?, ?, ?,?)`,
      [turf_id, user_id, message.trim(),rating]
    );

    const review = {
      id:         result.insertId,
      turf_id:    parseInt(turf_id),
      user_id,
      message:    message.trim(),
      created_at: new Date(),
    };

    res.status(201).json({ message: 'Review submitted', review });
  } catch (err) {
    console.error('createReview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/reviews — client submits review ───────────────────────────
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

exports.getAllSystemReviews = async(req,res)=>{

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

exports.getSystemReviewStats = async(req,res)=>{

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

module.exports= {getReviews, createReview, createSystemReview};