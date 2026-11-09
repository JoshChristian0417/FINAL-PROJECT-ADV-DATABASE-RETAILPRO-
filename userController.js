
const User = require("../models/User");

// Get all registered users
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users.",
      error: error.message
    });
  }
};

module.exports = {
  getUsers
};
