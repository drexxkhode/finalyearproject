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
  resetPassword,
  getAllTurfAdmins,
  getTurf,
  registerOwner,
  getDashboardDetails
} = require("../../controllers/superAdminController");
const {
  getAllSystemReviews,
  deleteSystemReview
} = require('../../controllers/reviewController');

const {
  registerTurf,
  changeTurfStatus
} = require('../../controllers/turfController');

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
router.get("/turf-mag", protect, getAllTurfAdmins);
router.put("/change-password", protect, changePassword);
router.put("/change-status/:id", protect, changeTurfStatus);
router.post("/forgot-password", passwordResetRateLimit , forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/reg-turfowner", protect, registerOwner);
router.post("/reg-turf", protect, registerTurf);
router.delete('/:id/photo', protect,                         deleteAdminPhoto);
router.get("/get-reviews", protect,   getAllSystemReviews);
router.delete("/del-review/:id", protect,   deleteSystemReview);
router.get("/get-turf", protect, getTurf);
router.get("/dashboard", protect, getDashboardDetails);

module.exports = router;