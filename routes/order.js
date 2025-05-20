const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const FoodCart = require("../models/Cart");
const AccessoryCart = require("../models/AccessoryCart");
const Food = require("../models/foodschema");
const Accessory = require("../models/Accessory");
const Order = require("../models/Order");
const User = require("../models/User");

// ✅ POST /orders/checkout: Place a new order
router.post("/checkout", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const foodCart = await FoodCart.find({ user: userId });
    const accCart = await AccessoryCart.find({ user: userId });

    const foodItems = await Promise.all(
      foodCart.map(async (item) => {
        const food = await Food.findById(item.food);
        return {
          productType: "food",
          name: food?.foodName || "Unnamed Food",
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        };
      })
    );

    const accItems = await Promise.all(
      accCart.map(async (item) => {
        const acc = await Accessory.findById(item.accessory);
        return {
          productType: "accessory",
          name: acc?.accessoryName || "Unnamed Accessory",
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        };
      })
    );

    const allItems = [...foodItems, ...accItems];
    const totalPrice = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrder = new Order({
      user: userId,
      items: allItems,
      totalPrice,
      status: "Pending",
      date: new Date(),
    });

    await newOrder.save();
    await FoodCart.deleteMany({ user: userId });
    await AccessoryCart.deleteMany({ user: userId });

    res.status(200).json({ message: "✅ Order placed", order: newOrder });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    res.status(500).json({ message: "Checkout failed", error: err.message });
  }
});

// ✅ GET /orders: Fetch current user's orders
router.get("/", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Fetch orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// ✅ GET /orders/admin: Admin access to all orders
router.get("/admin", async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "username email");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order admin data", error: err.message });
  }
});

// ✅ PUT /orders/:id - Edit (user-level)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // User can edit only their own pending order
    if (order.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    if (order.status !== "Pending")
      return res.status(400).json({ message: "Only pending orders can be edited" });

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Invalid items" });

    order.items = items;
    order.totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await order.save();
    res.status(200).json({ message: "✅ Order updated", order });
  } catch (err) {
    console.error("❌ Update order error:", err);
    res.status(500).json({ message: "Failed to update order", error: err.message });
  }
});

// ✅ PUT /orders/admin/:id - Admin can update status
router.put("/admin/:id", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Delivered", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    res.status(200).json({ message: `Order marked as ${status}`, order });
  } catch (err) {
    console.error("❌ Admin update error:", err);
    res.status(500).json({ message: "Failed to update order status", error: err.message });
  }
});

// ✅ DELETE /orders/:id: Cancel a pending order (user)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    if (order.status !== "Pending")
      return res.status(400).json({ message: "Only pending orders can be cancelled" });

    for (const item of order.items) {
      if (item.productType === "food") {
        const food = await Food.findOne({ foodName: item.name });
        if (food) {
          food.stock += item.quantity;
          await food.save();
        }
      } else if (item.productType === "accessory") {
        const acc = await Accessory.findOne({ accessoryName: item.name });
        if (acc) {
          acc.stockQuantity += item.quantity;
          await acc.save();
        }
      }
    }

    order.status = "Cancelled";
    await order.save();

    res.status(200).json({ message: "✅ Order cancelled", order });
  } catch (err) {
    console.error("❌ Cancel order error:", err);
    res.status(500).json({ message: "Failed to cancel order", error: err.message });
  }
});

module.exports = router;
