const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();

dotenv.config();

// Models
const UserModel = require("./models/User");
const PetFoodModel = require("./models/Cart");
const AccessoryModel = require("./models/Accessory");

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb+srv://admin:admin@cluster0.eou5z.mongodb.net/petshop?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// JWT middleware
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

// -------------------- Auth Routes --------------------

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ username, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, username }, JWT_SECRET, { expiresIn: "1h" });
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await UserModel.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// -------------------- Pet Food CRUD --------------------
app.get("/get", verifyToken, async (req, res) => {
  try {
    const items = await PetFoodModel.find();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: "Error fetching pet food", details: err.message });
  }
});

app.post("/insert", verifyToken, async (req, res) => {
  const { foodName, price, image } = req.body;
  if (!foodName || !price || !image) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const food = new PetFoodModel({ foodName, price, image });
    await food.save();
    res.status(201).json(food);
  } catch (err) {
    res.status(500).json({ error: "Error adding pet food", details: err.message });
  }
});

app.put("/update", verifyToken, async (req, res) => {
  const { id, newFood } = req.body;
  try {
    const updated = await PetFoodModel.findByIdAndUpdate(id, { foodName: newFood }, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update failed", details: err.message });
  }
});

app.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await PetFoodModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.status(200).json({ message: "Deleted", deleted });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

// -------------------- Accessory CRUD --------------------

// GET all accessories
app.get("/accessories/get", verifyToken, async (req, res) => {
  try {
    const accessories = await AccessoryModel.find();
    res.status(200).json(accessories);
  } catch (err) {
    res.status(500).json({ error: "Error fetching accessories", details: err.message });
  }
});

// POST insert new accessory
app.post("/accessories/insert", verifyToken, async (req, res) => {
  const { accessoryName, description, price, stockQuantity, imageUrl } = req.body;
  if (!accessoryName || !description || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const newAccessory = new AccessoryModel({
      accessoryName,
      description,
      price,
      stockQuantity,
      imageUrl
    });
    await newAccessory.save();
    res.status(201).json(newAccessory);
  } catch (err) {
    res.status(500).json({ error: "Error adding accessory", details: err.message });
  }
});

// PUT update accessory name
app.put("/accessories/update", verifyToken, async (req, res) => {
  const { id, newName } = req.body;
  if (!id || !newName) return res.status(400).json({ error: "Missing id or newName" });

  try {
    const updated = await AccessoryModel.findByIdAndUpdate(
      id,
      { accessoryName: newName },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Accessory not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Accessory update failed", details: err.message });
  }
});

// DELETE accessory
app.delete("/accessories/delete/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await AccessoryModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Accessory not found" });
    res.status(200).json({ message: "Accessory deleted", deleted });
  } catch (err) {
    res.status(500).json({ error: "Accessory deletion failed", details: err.message });
  }
});

// -------------------- Server --------------------
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
