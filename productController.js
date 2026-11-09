
const Product = require("../models/Product");

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET LOW STOCK PRODUCTS
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      stock: { $lte: 10 },
      status: "active"
    }).sort({ stock: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// RESTOCK PRODUCT
const restockProduct = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid restock quantity."
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: quantity } },
      { returnDocument: "after", runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product restocked successfully!",
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after", runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully!"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getLowStockProducts,
  restockProduct,
  updateProduct,
  deleteProduct
};
