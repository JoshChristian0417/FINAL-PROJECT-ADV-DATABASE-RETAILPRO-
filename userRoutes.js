
const express = require("express");
const router = express.Router();

const { getUsers } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Admin only: Get all users
router.get("/", protect, adminOnly, getUsers);

module.exports = router;
