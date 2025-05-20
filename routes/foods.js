const express = require("express");
const router = express.Router();
const Food = require("../models/foodschema");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const { verifyToken } = require("../middleware/auth");

// 📦 Get all food items (for users)
router.get("/", async (req, res) => {
  try {
    const foods = await Food.find();
    res.status(200).json(foods);
  } catch (err) {
    res.status(500).json({ message: "Error fetching foods", error: err.message });
  }
});

// ✅ GET /petfoods/admin - Admin access to all pet foods
router.get("/admin", async (req, res) => {
  try {
    const foods = await Food.find();
    res.status(200).json(foods);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch food admin data", error: err.message });
  }
});

// ✅ PUT /petfoods/:id - Admin updates stock
router.put("/:id", async (req, res) => {
  try {
    const { stock } = req.body;
    if (typeof stock !== "number" || stock < 0) {
      return res.status(400).json({ message: "Invalid stock value" });
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true }
    );

    if (!food) return res.status(404).json({ message: "Food item not found" });

    res.status(200).json({ message: "Stock updated", food });
  } catch (err) {
    res.status(500).json({ message: "Failed to update stock", error: err.message });
  }
});

// ❤️ Toggle favorite
router.post("/favorite/:id", verifyToken, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: "Food not found" });

    food.favorite = !food.favorite;
    await food.save();
    res.status(200).json({ message: "Favorite toggled", favorite: food.favorite });
  } catch (err) {
    res.status(500).json({ message: "Toggle failed", error: err.message });
  }
});

// 🛒 Get user's food cart
router.get("/cart", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.find({ user: req.user.id });
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart", error: err.message });
  }
});

// ➕ Add to cart
router.post("/cart", verifyToken, async (req, res) => {
  const { foodId, quantity, price, image } = req.body;
  try {
    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ message: "Food not found" });

    const existing = await Cart.findOne({ user: req.user.id, food: foodId });

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

      const cartItem = new Cart({
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

    res.status(200).json({ message: "Food added to cart" });
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart", error: err.message });
  }
});

// ✏️ Update cart quantity
router.put("/cart/:id", verifyToken, async (req, res) => {
  const { quantity } = req.body;
  try {
    const item = await Cart.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    if (item.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    const food = await Food.findById(item.food);
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
    res.status(500).json({ message: "Error updating cart", error: err.message });
  }
});

// ❌ Remove from cart + restock
router.delete("/cart/:id", verifyToken, async (req, res) => {
  try {
    const item = await Cart.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    if (item.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    const food = await Food.findById(item.food);
    if (food) {
      food.stock += item.quantity;
      await food.save();
    }

    await item.deleteOne();
    res.status(200).json({ message: "Item removed from cart and stock restored" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

// 🧾 Place food order (sub-route)
router.post("/place-order", verifyToken, async (req, res) => {
  try {
    const cartItems = await Cart.find({ user: req.user.id });
    if (!cartItems.length) return res.status(400).json({ message: "Cart is empty" });

    const orderItems = cartItems.map(item => ({
      foodId: item.food,
      foodName: item.foodName,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    }));

    const totalPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = new Order({
      user: req.user.id,
      type: "food",
      items: orderItems,
      totalPrice,
      date: new Date(),
    });

    await order.save();

    await Cart.deleteMany({ user: req.user.id });

    res.status(200).json({ message: "Order placed successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Order failed", error: err.message });
  }
});

module.exports = router;
