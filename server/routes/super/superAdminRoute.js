const express = require("express");
const {
  register,
  updateUser,
  deleteUser,
  getAdminDetails,
  getAllAdmins,
  getMe,
  changePassword,
  forgotPassword,
  uploadAdminPhoto,
  deleteAdminPhoto,
  resetPassword
} = require("../../controllers/superAdminController");
const {
  getAllSystemReviews,
  deleteSystemReview
} = require('../../controllers/reviewController');

const protect = require("../../middleware/auth");
const passwordResetRateLimit  = require("../../middleware/passwordResetRateLimit");
const {upload} =require('../../middleware/upload');
const router = express.Router();

router.post("/register",protect, upload.single('photo'), register);
router.put("/update/:id", protect, upload.single('photo'), updateUser);
router.delete("/delete/:id", protect, deleteUser); 
router.get("/details/:id", protect, getAdminDetails);
router.get("/admins", protect, getAllAdmins);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", passwordResetRateLimit , forgotPassword);
router.post("/reset-password", resetPassword);
router.delete('/:id/photo', protect,                         deleteAdminPhoto);
router.get("/get-reviews", protect,   getAllSystemReviews);
router.delete("/del-review/:id", protect,   deleteSystemReview);

module.exports = router;