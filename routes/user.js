const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // Should be stored securely

// ✅ Soft Admin Login (used in Admin.js)
router.post("/admin-login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  // Simple logic: any non-empty username with correct admin password is allowed
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  res.json({ message: "Admin authenticated successfully" });
});

// ✅ GET /profile: Get current user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile", error: err.message });
  }
});

// ✅ PUT /profile: Update username or request admin role
router.put("/profile", verifyToken, async (req, res) => {
  const { username, isAdmin, adminPassword } = req.body;

  if (username !== undefined && (!username || username.trim() === "")) {
    return res.status(400).json({ message: "Username cannot be empty" });
  }

  const updates = {};
  if (username !== undefined) updates.username = username.trim();

  if (isAdmin === true) {
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return res.status(403).json({ message: "Invalid admin password" });
    }
    updates.isAdmin = true;
  }

  try {
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

// ✅ PUT /profile/update-credentials: Change email and/or password
router.put("/profile/update-credentials", verifyToken, async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    return res.status(400).json({ message: "Email or password is required" });
  }

  const updates = {};
  if (email) updates.email = email;

  if (password) {
    try {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    } catch (err) {
      return res.status(500).json({ message: "Password hashing failed", error: err.message });
    }
  }

  try {
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Credentials updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update credentials", error: err.message });
  }
});

// ✅ GET /user/admin: Get all users (for admin dashboard)
router.get("/admin", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

// ✅ PUT /user/:id/role: Admin toggles user role
router.put("/:id/role", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    const { isAdmin } = req.body;
    if (typeof isAdmin !== "boolean") {
      return res.status(400).json({ message: "isAdmin must be a boolean" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { isAdmin }, { new: true }).select("-password");
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User role updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user role", error: err.message });
  }
});

module.exports = router;
