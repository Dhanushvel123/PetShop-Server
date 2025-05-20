const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();
dotenv.config();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://dhanushvel123.github.io"
];

const allowedOrigins = [
  "https://dhanushvel123.github.io",
  "http://localhost:3000"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});



app.use(express.json());

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// JWT Middleware
function verifyToken(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
}

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb+srv://admin:admin@cluster0.eou5z.mongodb.net/petshop?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -------------------- Models --------------------
const UserModel = require("./models/User");
const FoodModel = require("./models/foodschema");
const FoodCartModel = require("./models/Cart");
const AccessoryModel = require("./models/Accessory");
const AccessoryCartModel = require("./models/AccessoryCart");
const OrderModel = require("./models/Order");

// -------------------- Routes --------------------
const accessoryRoutes = require("./routes/accessories");
const userRoutes = require("./routes/user");
const orderRoutes = require("./routes/order");

// -------------------- Auth Routes --------------------
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await UserModel.findOne({ username });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ username, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, username }, JWT_SECRET, {
      expiresIn: "12h",
    });
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await UserModel.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, username }, JWT_SECRET, {
      expiresIn: "12h",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// -------------------- User Profile Routes --------------------

// GET /profile - Return user profile info (protected)
app.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
});

// PUT /profile - Update user profile (username and optional email) (protected)
app.put("/profile", verifyToken, async (req, res) => {
  const { username, email } = req.body;

  if (username && !username.trim()) {
    return res.status(400).json({ message: "Username cannot be empty" });
  }

  try {
    if (username) {
      // Check if username is taken by someone else
      const existingUser = await UserModel.findOne({ username });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(409).json({ message: "Username already taken" });
      }
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) user.username = username.trim();
    if (email) user.email = email.trim();

    await user.save();

    res.json({ message: "Profile updated", username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

// -------------------- Order History Routes --------------------

// GET /orders/history - Get logged-in user's order history (protected)
app.get("/orders/history", verifyToken, async (req, res) => {
  try {
    const orders = await OrderModel.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order history", error: err.message });
  }
});

// -------------------- Food CRUD Routes --------------------
app.get("/petfoods", async (req, res) => {
  try {
    const foods = await FoodModel.find();
    res.status(200).json(foods);
  } catch (err) {
    res.status(500).json({ error: "Error fetching foods", details: err.message });
  }
});
app.get("/petfoods/admin", async (req, res) => {
  try {
    const admin = await FoodModel.find();
    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch food admin data", error: err.message });
  }
});
app.post("/petfoods", async (req, res) => {
  const { foodName, price, description, image, stock } = req.body;
  if (!foodName || !price || !description || !image || stock === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newFood = new FoodModel({ foodName, price, description, image, stock });
    await newFood.save();
    res.status(201).json(newFood);
  } catch (err) {
    res.status(500).json({ error: "Error adding food", details: err.message });
  }
});

app.put("/petfoods/:id", async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  if (stock === undefined) return res.status(400).json({ error: "Stock is required" });

  try {
    const updated = await FoodModel.findByIdAndUpdate(id, { stock }, { new: true });
    if (!updated) return res.status(404).json({ message: "Food item not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error updating stock", details: err.message });
  }
});

app.delete("/petfoods/:id", async (req, res) => {
  try {
    const deleted = await FoodModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Food item not found" });
    res.status(200).json({ message: "Food item deleted", deleted });
  } catch (err) {
    res.status(500).json({ error: "Error deleting food", details: err.message });
  }
});

// -------------------- Favorite & Cart Routes --------------------
app.post("/petfoods/favorite/:id", verifyToken, async (req, res) => {
  try {
    const food = await FoodModel.findById(req.params.id);
    if (!food) return res.status(404).json({ message: "Food not found" });

    food.favorite = !food.favorite;
    await food.save();
    res.status(200).json({ message: "Favorite toggled", favorite: food.favorite });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle favorite" });
  }
});

app.get("/petfoods/cart", verifyToken, async (req, res) => {
  try {
    const cart = await FoodCartModel.find({ user: req.user.id });
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart" });
  }
});

app.post("/petfoods/cart", verifyToken, async (req, res) => {
  const { foodId, quantity, price, image } = req.body;

  try {
    const food = await FoodModel.findById(foodId);
    if (!food) return res.status(404).json({ message: "Food not found" });

    const existing = await FoodCartModel.findOne({ user: req.user.id, food: foodId });

    if (existing) {
      if (food.stock < existing.quantity + quantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      existing.quantity += quantity;
      await existing.save();
    } else {
      if (food.stock < quantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      const cartItem = new FoodCartModel({
        user: req.user.id,
        food: foodId,
        foodName: food.foodName,
        quantity,
        price,
        image,
      });
      await cartItem.save();
    }

    food.stock -= quantity;
    await food.save();

    res.status(200).json({ message: "Added to cart" });
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart" });
  }
});

app.put("/petfoods/cart/:id", verifyToken, async (req, res) => {
  const { quantity } = req.body;
  try {
    const item = await FoodCartModel.findById(req.params.id);
    if (!item || item.user.toString() !== req.user.id)
      return res.status(404).json({ message: "Cart item not found" });

    const food = await FoodModel.findById(item.food);
    if (!food) return res.status(404).json({ message: "Food not found" });

    const quantityChange = quantity - item.quantity;
    if (quantityChange > 0 && food.stock < quantityChange) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    item.quantity = quantity;
    await item.save();

    food.stock -= quantityChange;
    await food.save();

    res.status(200).json({ message: "Quantity updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating cart item" });
  }
});

app.delete("/petfoods/cart/:id", verifyToken, async (req, res) => {
  try {
    const item = await FoodCartModel.findById(req.params.id);
    if (!item || item.user.toString() !== req.user.id)
      return res.status(404).json({ message: "Cart item not found" });

    const food = await FoodModel.findById(item.food);
    if (food) {
      food.stock += item.quantity;
      await food.save();
    }

    await item.deleteOne();
    res.status(200).json({ message: "Item removed and stock restored" });
  } catch (err) {
    res.status(500).json({ message: "Error removing item" });
  }
});

// -------------------- External Routes --------------------
app.use("/accessories", accessoryRoutes);
app.use("/user", userRoutes);
app.use("/orders", orderRoutes);

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
