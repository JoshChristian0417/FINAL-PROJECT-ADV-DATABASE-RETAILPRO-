const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");

const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

// Get all categories
router.get("/", protect, getCategories);

// Create category
router.post("/", protect, adminOnly, createCategory);

// Update category
router.put("/:id", protect, adminOnly, updateCategory);

// Delete category
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;