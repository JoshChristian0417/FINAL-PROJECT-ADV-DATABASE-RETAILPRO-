
import { useState, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

// ==============================
// LOGIN
// ==============================

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5002/api/auth/login",
        { email, password }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>RetailPro</h1>
        <p>Retail Management System</p>

        <form onSubmit={handleLogin}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {message && (
            <p className="login-message">{message}</p>
          )}

          <button type="submit">Sign In</button>
        </form>

        <p className="login-footer">
          RetailPro Management System
        </p>
      </div>
    </div>
  );
}

// ==============================
// SIDEBAR
// ==============================


function Sidebar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside className="sidebar">
      <h2>RetailPro</h2>

      <nav>
        <Link
          to="/dashboard"
          className={location.pathname === "/dashboard" ? "active" : ""}
        >
          Dashboard
        </Link>

        <Link
          to="/products"
          className={location.pathname === "/products" ? "active" : ""}
        >
          Products
        </Link>

        <Link
          to="/categories"
          className={location.pathname === "/categories" ? "active" : ""}
        >
          Categories
        </Link>

        <Link
          to="/orders"
          className={location.pathname === "/orders" ? "active" : ""}
        >
          Orders
        </Link>

        {user.role === "admin" && (
          <Link
            to="/users"
            className={location.pathname === "/users" ? "active" : ""}
          >
            Users
          </Link>
        )}
      </nav>

      <button onClick={handleLogout}>Logout</button>
    </aside>
  );
}


// ==============================
// DASHBOARD
// ==============================



function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [stockSummary, setStockSummary] = useState({
  inStock: 0,
  lowStock: 0,
  outOfStock: 0,
});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const ordersUrl =
          user.role === "admin"
            ? "http://localhost:5002/api/orders"
            : "http://localhost:5002/api/orders/my-orders";

        const requests = [
          axios.get("http://localhost:5002/api/products", config),
          axios.get("http://localhost:5002/api/categories", config),
          axios.get(ordersUrl, config),
        ];

        // Only Admin can access the Low Stock API
        if (user.role === "admin") {
          requests.push(
            axios.get(
              "http://localhost:5002/api/products/low-stock",
              config
            )
          );
        }

        const responses = await Promise.all(requests);

        const productsRes = responses[0];
        const categoriesRes = responses[1];
        const ordersRes = responses[2];
        const orders = ordersRes.data.orders || [];

        setTotalProducts(productsRes.data.products?.length || 0);
        setTotalCategories(categoriesRes.data.categories?.length || 0);
        setTotalOrders(orders.length);
        setRecentOrders(orders.slice(0, 5));

        if (user.role === "admin") {
  const lowStock = responses[3].data.products || [];
  const allProducts = productsRes.data.products || [];

  setLowStockProducts(lowStock);

  setStockSummary({
    inStock: allProducts.filter((product) => product.stock > 10).length,
    lowStock: allProducts.filter(
      (product) => product.stock >= 1 && product.stock <= 10
    ).length,
    outOfStock: allProducts.filter((product) => product.stock === 0).length,
  });
}

        const completedSales = orders
          .filter((order) => order.status === "completed")
          .reduce(
            (total, order) => total + Number(order.totalAmount || 0),
            0
          );

        setTotalSales(completedSales);

        // Calculate sales for the last 6 months
        const monthlyData = [];

        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);

          const monthName = date.toLocaleString("en-US", {
            month: "short",
          });

          const monthSales = orders
            .filter((order) => {
              const orderDate = new Date(order.createdAt);

              return (
                order.status === "completed" &&
                orderDate.getMonth() === date.getMonth() &&
                orderDate.getFullYear() === date.getFullYear()
              );
            })
            .reduce(
              (total, order) => total + Number(order.totalAmount || 0),
              0
            );

          monthlyData.push({
            month: monthName,
            sales: monthSales,
          });
        }

        setMonthlySales(monthlyData);
      } catch (error) {
        console.error("Dashboard data error:", error);
      }
    };

    fetchDashboardData();
  }, [user.role]);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard Overview</h1>
            <p>Welcome back, {user.name}!</p>
          </div>

          <div className="admin-profile">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
        </header>

        <section className="dashboard-cards">
          <div className="stat-card">
            <h3>Total Products</h3>
            <h1>{totalProducts}</h1>
          </div>

          <div className="stat-card">
            <h3>Total Categories</h3>
            <h1>{totalCategories}</h1>
          </div>

          <div className="stat-card">
            <h3>Total Orders</h3>
            <h1>{totalOrders}</h1>
          </div>

          <div className="stat-card">
            <h3>Completed Sales</h3>
            <h1>
              ₱{totalSales.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </h1>
          </div>

          <div className="stat-card">
            <h3>Account Role</h3>
            <h1>{user.role || "Staff"}</h1>
          </div>
        </section>

        
{/* STOCK STATUS SUMMARY - ADMIN ONLY */}
{user.role === "admin" && (
  <section className="dashboard-cards stock-summary">
    <div className="stat-card">
      <h3>In Stock</h3>
      <h1>{stockSummary.inStock}</h1>
    </div>

    <div className="stat-card">
      <h3>Low Stock</h3>
      <h1>{stockSummary.lowStock}</h1>
    </div>

    <div className="stat-card">
      <h3>Out of Stock</h3>
      <h1>{stockSummary.outOfStock}</h1>
    </div>
  </section>
)}


        {/* LOW STOCK ALERTS - ADMIN ONLY */}
        {user.role === "admin" && (
          <section className="low-stock-section">
            <div className="orders-header">
              <h2>Low Stock Alerts</h2>
              <span>
                {lowStockProducts.length} products need attention
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="empty-orders">
                All products have sufficient stock.
              </p>
            ) : (
              <div className="table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Available Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lowStockProducts.map((product) => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>{product.sku}</td>
                        <td>
                          <strong>{product.stock} units</strong>
                        </td>
                        <td>
                          <span className="low-stock-badge">
                            {product.stock === 0
                              ? "Out of Stock"
                              : "Low Stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* MONTHLY SALES CHART */}
        <section className="sales-chart-section">
          <div className="orders-header">
            <h2>Monthly Sales Overview</h2>
            <span>Completed sales for the last 6 months</span>
          </div>

          <div className="sales-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    `₱${Number(value).toLocaleString("en-PH")}`
                  }
                />
                <Bar
                  dataKey="sales"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* RECENT ORDERS */}
        <section className="recent-orders">
          <div className="orders-header">
            <h2>Recent Orders</h2>
            <span>Latest 5 transactions</span>
          </div>

          {recentOrders.length === 0 ? (
            <p className="empty-orders">No orders found.</p>
          ) : (
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        #{order._id.slice(-6).toUpperCase()}
                      </td>

                      <td>
                        {order.customer?.name || "Unknown Customer"}
                      </td>

                      <td>
                        ₱{Number(order.totalAmount || 0).toLocaleString(
                          "en-PH",
                          { minimumFractionDigits: 2 }
                        )}
                      </td>

                      <td>
                        <span className={`order-status ${order.status}`}>
                          {order.status}
                        </span>
                      </td>

                      <td>
                        {new Date(order.createdAt).toLocaleDateString("en-PH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ==============================
// PRODUCTS
// ==============================

function Products() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockingProduct, setRestockingProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  // SEARCH AND FILTER STATES
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("all");
const [stockFilter, setStockFilter] = useState("all");

  const emptyForm = {
    name: "",
    description: "",
    price: "",
    stock: "",
    sku: "",
    status: "active",
  };

  const [formData, setFormData] = useState(emptyForm);

  // FILTER PRODUCTS
const filteredProducts = products.filter((product) => {
  const matchesSearch =
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === "all" || product.status === statusFilter;

  const matchesStock =
    stockFilter === "all" ||
    (stockFilter === "in-stock" && product.stock > 10) ||
    (stockFilter === "low-stock" &&
      product.stock >= 1 &&
      product.stock <= 10) ||
    (stockFilter === "out-of-stock" && product.stock === 0);

  return matchesSearch && matchesStatus && matchesStock;
});

  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // FETCH PRODUCTS

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5002/api/products",
        getConfig()
      );

      setProducts(response.data.products || []);
      setError("");
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message || "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // HANDLE INPUTS

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ADD PRODUCT

  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5002/api/products",
        {
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
        },
        getConfig()
      );

      setFormData(emptyForm);
      setShowForm(false);
      setEditingProduct(null);

      await fetchProducts();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to add product."
      );
    }
  };

  // OPEN EDIT FORM

  const handleEditProduct = (product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      sku: product.sku || "",
      status: product.status || "active",
    });

    setShowForm(true);
    setError("");
  };

  // UPDATE PRODUCT

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (!editingProduct?._id) {
      setError("No product selected for editing.");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5002/api/products/${editingProduct._id}`,
        {
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
        },
        getConfig()
      );

      setFormData(emptyForm);
      setEditingProduct(null);
      setShowForm(false);

      await fetchProducts();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to update product."
      );
    }
  };


  
  // RESTOCK PRODUCT
  const handleRestockProduct = async (e) => {
    e.preventDefault();

    if (!restockingProduct) return;

    const quantity = Number(restockQuantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5002/api/products/${restockingProduct._id}/restock`,
        { quantity },
        getConfig()
      );

      setRestockingProduct(null);
      setRestockQuantity("");
      setError("");

      await fetchProducts();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to restock product."
      );
    }
  };


  // DELETE PRODUCT
const handleDeleteProduct = async (productId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this product?"
  );

  if (!confirmDelete) return;

  try {
    await axios.delete(
      `http://localhost:5002/api/products/${productId}`,
      getConfig()
    );

    await fetchProducts();

    setError("");
  } catch (error) {
    setError(
      error.response?.data?.message || "Failed to delete product."
    );
  }
};

  // CANCEL FORM

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData(emptyForm);
    setError("");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Products</h1>
            <p>Manage your retail products</p>
          </div>

          <div className="admin-profile">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
        </header>

        <section className="recent-orders">
          <div className="orders-header">
            <div>
              <h2>Product Inventory</h2>
              <span>{products.length} products available</span>
            </div>



            {user.role === "admin" && (
              <button
                type="button"
                className="add-product-btn"
                onClick={() => {
                  if (showForm) {
                    handleCancelForm();
                  } else {
                    setEditingProduct(null);
                    setFormData(emptyForm);
                    setShowForm(true);
                    setError("");
                  }
                }}
              >
                {showForm ? "Cancel" : "+ Add Product"}
              </button>
            )}
          </div>

          <div className="product-filters">
  <input
    type="text"
    placeholder="Search by product name or SKU..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="all">All Statuses</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>

  <select
    value={stockFilter}
    onChange={(e) => setStockFilter(e.target.value)}
  >
    <option value="all">All Stock Levels</option>
    <option value="in-stock">In Stock</option>
    <option value="low-stock">Low Stock (1–10)</option>
    <option value="out-of-stock">Out of Stock</option>
  </select>
</div>

          {showForm && (
            <form
              className="product-form"
              onSubmit={
                editingProduct
                  ? handleUpdateProduct
                  : handleAddProduct
              }
            >
              <h3>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>

              <div className="product-form-grid">
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />

                <input
                  type="text"
                  name="sku"
                  placeholder="SKU"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                />

                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />

                <input
                  type="number"
                  name="stock"
                  placeholder="Stock Quantity"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <textarea
                name="description"
                placeholder="Product Description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />

              <button type="submit" className="save-product-btn">
                {editingProduct ? "Update Product" : "Save Product"}
              </button>
            </form>
          )}

          
{restockingProduct && (
  <form
    className="product-form"
    onSubmit={handleRestockProduct}
  >
    <h3>Restock Product: {restockingProduct.name}</h3>

    <p>
      Current Stock: <strong>{restockingProduct.stock} units</strong>
    </p>

    <input
      type="number"
      placeholder="Enter additional quantity"
      min="1"
      step="1"
      value={restockQuantity}
      onChange={(e) => setRestockQuantity(e.target.value)}
      required
    />

    <button type="submit" className="save-product-btn">
      Confirm Restock
    </button>

    <button
  type="button"
  className="cancel-restock-btn"
  onClick={() => {
    setRestockingProduct(null);
    setRestockQuantity("");
    setError("");
  }}
>
  Cancel
</button>


  </form>
)}


          {error && <p className="product-error">{error}</p>}

          {loading ? (
            <p>Loading products...</p>
          ) : filteredProducts.length === 0 ? (
  <p className="empty-orders">
    {products.length === 0
      ? "No products found."
      : "No products match your search or filters."}
  </p>
          ) : (
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td>
                        ₱{Number(product.price).toLocaleString("en-PH")}
                      </td>
                      <td>{product.stock}</td>
                      <td>{product.status}</td>

                      <td>
                        {user.role === "admin" && (
                         <div className="product-actions">
  {/* EDIT BUTTON */}
  <button
    type="button"
    className="edit-product-btn"
    onClick={() => {
      setRestockingProduct(null);
      setRestockQuantity("");
      handleEditProduct(product);
    }}
  >
    Edit
  </button>

  {/* RESTOCK BUTTON */}
  <button
    type="button"
    className="restock-product-btn"
    onClick={() => {
      setRestockingProduct(product);
      setRestockQuantity("");
      setShowForm(false);
      setEditingProduct(null);
      setError("");
    }}
  >
    Restock
  </button>

  {/* DELETE BUTTON */}
  <button
    type="button"
    className="delete-product-btn"
    onClick={() => handleDeleteProduct(product._id)}
  >
    Delete
  </button>
</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Categories() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const emptyForm = {
    name: "",
    description: "",
    status: "Active",
  };

  const [formData, setFormData] = useState(emptyForm);

  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "http://localhost:5002/api/categories",
        getConfig()
      );

      setCategories(response.data.categories || []);
      setError("");
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5002/api/categories",
        formData,
        getConfig()
      );

      setFormData(emptyForm);
      setShowForm(false);
      await fetchCategories();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to add category."
      );
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);

    setFormData({
      name: category.name,
      description: category.description || "",
      status: category.status || "Active",
    });

    setShowForm(true);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:5002/api/categories/${editingCategory._id}`,
        formData,
        getConfig()
      );

      setFormData(emptyForm);
      setEditingCategory(null);
      setShowForm(false);
      await fetchCategories();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to update category."
      );
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `http://localhost:5002/api/categories/${categoryId}`,
        getConfig()
      );

      await fetchCategories();
      setError("");
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to delete category."
      );
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData(emptyForm);
    setError("");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
  <div>
    <h1>Categories</h1>
    <p>Manage your product categories</p>
  </div>

  <div className="categories-header-actions">
    <button
      type="button"
      className="add-product-btn"
      onClick={() => {
        setEditingCategory(null);
        setFormData(emptyForm);
        setShowForm(!showForm);
        setError("");
      }}
    >
      {showForm ? "Close Form" : "+ Add Category"}
    </button>
  </div>
</header>

        {error && <p className="error-message">{error}</p>}

        {showForm && (
          <form
            className="product-form"
            onSubmit={
              editingCategory
                ? handleUpdateCategory
                : handleAddCategory
            }
          >
            <h2>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>

            <div className="product-form-grid">
              <div>
                <label>Category Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-buttons">
              <button type="submit" className="save-product-btn">
                {editingCategory ? "Update Category" : "Save Category"}
              </button>

              <button
                type="button"
                className="cancel-category-btn"
                onClick={handleCancelForm}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="categories-container">
          <div className="categories-heading">
            <h2>Category List</h2>
            <span>{categories.length} Categories</span>
          </div>

          {loading ? (
            <p>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="empty-orders">No categories found.</p>
          ) : (
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td>{category.name}</td>
                      <td>
                        {category.description || "No description"}
                      </td>
                      <td>
                        <span
                          className={`category-status ${
                            category.status === "Active"
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {category.status}
                        </span>
                      </td>
                      <td>
                        <div className="product-actions">
                          <button
                            className="edit-product-btn"
                            onClick={() =>
                              handleEditCategory(category)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-product-btn"
                            onClick={() =>
                              handleDeleteCategory(category._id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


function Orders() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "http://localhost:5002/api/orders",
        getConfig()
      );

      setOrders(response.data.orders || []);
      setError("");
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5002/api/orders/${orderId}/status`,
        { status: newStatus },
        getConfig()
      );

      await fetchOrders();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to update order status."
      );
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Orders Management</h1>
            <p>Monitor and manage customer transactions.</p>
          </div>

          <div className="admin-profile">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
        </header>

        <section className="recent-orders">
          <div className="orders-header">
            <div>
              <h2>All Orders</h2>
              <span>{orders.length} total orders</span>
            </div>
          </div>

          {error && <p className="product-error">{error}</p>}

          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="empty-orders">No orders found.</p>
          ) : (
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Products</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        #{order._id.slice(-6).toUpperCase()}
                      </td>

                      <td>
                        {order.customer?.name || "Unknown Customer"}
                      </td>

                      <td>
                        {order.products?.map((item, index) => (
                          <div key={index}>
                            {item.product?.name || "Product"} × {item.quantity}
                          </div>
                        ))}
                      </td>

                      <td>
                        ₱{Number(order.totalAmount || 0).toLocaleString(
                          "en-PH",
                          { minimumFractionDigits: 2 }
                        )}
                      </td>

                      <td>
                        {user.role === "admin" ? (
                          <select
                            className="order-status-select"
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value)
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span className={`order-status ${order.status}`}>
                            {order.status}
                          </span>
                        )}
                      </td>

                      <td>
                        {new Date(order.createdAt).toLocaleDateString("en-PH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


function Users() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "http://localhost:5002/api/users",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setUsers(response.data.users || []);
      setError("");
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Users Management</h1>
            <p>View and monitor registered accounts.</p>
          </div>

          <div className="admin-profile">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
        </header>

        <section className="recent-orders">
          <div className="orders-header">
            <div>
              <h2>Registered Users</h2>
              <span>{users.length} total users</span>
            </div>
          </div>

          {error && <p className="product-error">{error}</p>}

          {loading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <p>No registered users found.</p>
          ) : (
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Date Registered</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((item) => (
                    <tr key={item._id}>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>
                        <span className={`order-status ${item.role}`}>
                          {item.role}
                        </span>
                      </td>
                      <td>
                        {new Date(item.createdAt).toLocaleDateString("en-PH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}



// ==============================
// MAIN APP
// ==============================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
