const express = require("express");

const {
  register,
  login,
  updateUser,
  deleteUser,
  deleteUserFromSystem,
  getAllUsers,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} = require("../../controllers/userController");

const { upload }               = require('../../middleware/upload');
const { uploadProfilePhoto,
        deleteProfilePhoto }   = require('../../controllers/userPhotoController');


const protect = require("../../middleware/auth");
const RateLimit  = require("../../middleware/RateLimit");

const router = express.Router();

/* AUTH ROUTES */

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", protect, verifyEmail);             // verify 6-digit OTP
router.post("/resend-verification", protect, resendVerification);  // resend OTP

/* USER ROUTES */

router.put("/update-user/:id", protect, updateUser);
router.delete("/delete-user", protect, deleteUser);
router.delete("/del-user/:id", protect, deleteUserFromSystem);
router.get("/all-users", protect, getAllUsers);
router.put("/change-password/:id", protect, changePassword);


// Upload profile photo — single file, field name must be 'photo'
router.put('/profile/photo',  protect, upload.single('photo'), uploadProfilePhoto);

// Remove profile photo
router.delete('/profile/photo', protect, deleteProfilePhoto);

/* PASSWORD RESET */

router.post("/forgot-password", RateLimit, forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;