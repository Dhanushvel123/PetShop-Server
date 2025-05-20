const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDb } = require("../utils/db");

// 🔐 GET - All orders (admin view), optional user filter
router.get("/admin/orders", async (req, res) => {
  const { userId } = req.query;

  try {
    const db = await getDb();
    const filter = userId ? { userId: new ObjectId(userId) } : {};

    const orders = await db
      .collection("orders")
      .find(filter)
      .sort({ date: -1 }) // newest first
      .toArray();

    res.status(200).json(orders);
  } catch (err) {
    console.error("Admin fetch orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

module.exports = router;
