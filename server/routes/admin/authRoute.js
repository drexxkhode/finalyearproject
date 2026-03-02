const express = require("express");
const {
  register,
  login,
  updateUser,
  deleteUser,
  getAdminDetails,
  getAllAdmins
} = require("../../controllers/authController");
const protect = require("../../middleware/auth");
const router = express.Router();

router.post("/register",protect, register);
router.post("/login", login);
router.put("/update/:id", protect, updateUser);
router.delete("/delete/:id", protect, deleteUser);
router.get("/details/:id", protect, getAdminDetails);
router.get("/admins", protect, getAllAdmins);

module.exports = router;