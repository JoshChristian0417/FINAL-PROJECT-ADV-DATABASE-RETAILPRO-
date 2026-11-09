
const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getLowStockProducts,
  restockProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// VIEW PRODUCTS - Logged-in users
router.get("/", protect, getProducts);

// VIEW LOW STOCK PRODUCTS - Admin only
router.get("/low-stock", protect, adminOnly, getLowStockProducts);

// RESTOCK PRODUCT - Admin only
router.put("/:id/restock", protect, adminOnly, restockProduct);

// ADD PRODUCT - Admin only
router.post("/", protect, adminOnly, createProduct);

// UPDATE PRODUCT - Admin only
router.put("/:id", protect, adminOnly, updateProduct);

// DELETE PRODUCT - Admin only
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
