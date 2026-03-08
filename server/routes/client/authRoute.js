const express = require("express");

const {
  register,
  login,
  updateUser,
  deleteUser,
  changePassword,
  forgotPassword,
  resetPassword
} = require("../../controllers/userController");

const protect = require("../../middleware/auth");
const RateLimit  = require("../../middleware/RateLimit");

const router = express.Router();

/* AUTH ROUTES */

router.post("/register", register);
router.post("/login", login);

/* USER ROUTES */

router.put("/update-user/:id", protect, updateUser);
router.delete("/delete-user", protect, deleteUser);
router.put("/change-password/:id", protect, changePassword);

/* PASSWORD RESET */

router.post("/forgot-password", RateLimit, forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;