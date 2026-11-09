const express = require("express");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
} = require("../controllers/orderController");

const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

// Create an order
router.post("/", protect, createOrder);

// View my orders
router.get("/my-orders", protect, getMyOrders);

// Admin: View all orders
router.get("/", protect, adminOnly, getAllOrders);

// Admin: Update order status
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;