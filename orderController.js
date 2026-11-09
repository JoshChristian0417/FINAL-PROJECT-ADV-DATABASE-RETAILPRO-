const Order = require("../models/Order");
const Product = require("../models/Product");

// Create Order
const createOrder = async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add products to your order."
      });
    }

    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found."
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity."
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}.`
        });
      }

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // Reduce product stock
    for (const item of orderProducts) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    const order = await Order.create({
      customer: req.user._id,
      products: orderProducts,
      totalAmount
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully!",
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get My Orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id
    }).populate("products.product", "name price");

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Orders (Admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email")
      .populate("products.product", "name price");

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Order Status (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "processing",
      "completed",
      "cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status."
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully!",
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
};