
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

connectDB();

app.get("/", (req, res) => {
  res.send("Welcome to RetailPro API!");
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`RetailPro Server running on port ${PORT}`);
});
