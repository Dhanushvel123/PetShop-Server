// server/routes/accessories.js

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const Accessory = require("../models/Accessory");
const AccessoryCart = require("../models/AccessoryCart");
const Order = require("../models/Order");

// ✅ GET all accessories
router.get("/", async (req, res) => {
  try {
    const accessories = await Accessory.find();
    res.status(200).json(accessories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch accessories", error: err.message });
  }
});

// ✅ GET /accessories/admin - Admin access only
router.get("/admin", async (req, res) => {
  try {
    const accessories = await Accessory.find();
    res.status(200).json(accessories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch accessory admin data", error: err.message });
  }
});

// ✅ PUT /accessories/:id - Admin updates stock
router.put("/:id", async (req, res) => {
  try {
    const { stock } = req.body;
    if (typeof stock !== "number" || stock < 0) {
      return res.status(400).json({ message: "Invalid stock value" });
    }

    const updated = await Accessory.findByIdAndUpdate(
      req.params.id,
      { stockQuantity: stock },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Accessory not found" });

    res.status(200).json({ message: "Stock updated", accessory: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update accessory stock", error: err.message });
  }
});

// ✅ POST - Add accessory to cart
router.post("/cart", verifyToken, async (req, res) => {
  const { accessoryId, quantity, price, image } = req.body;
  const userId = req.user.id;

  if (!accessoryId || !quantity || !price || !image) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const accessory = await Accessory.findById(accessoryId);
    if (!accessory) return res.status(404).json({ message: "Accessory not found" });

    const requestedQty = Number(quantity);
    const existingItem = await AccessoryCart.findOne({ accessory: accessoryId, user: userId });

    if (accessory.stockQuantity < requestedQty) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    if (existingItem) {
      existingItem.quantity += requestedQty;
      await existingItem.save();
    } else {
      await new AccessoryCart({
        user: userId,
        accessory: accessory._id,
        accessoryName: accessory.accessoryName,
        price,
        image,
        quantity: requestedQty,
      }).save();
    }

    accessory.stockQuantity -= requestedQty;
    await accessory.save();

    res.status(200).json({ message: "Accessory added to cart" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add to cart", error: err.message });
  }
});

// ✅ GET - Get accessory cart
router.get("/cart", verifyToken, async (req, res) => {
  try {
    const cart = await AccessoryCart.find({ user: req.user.id });
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cart", error: err.message });
  }
});

// ✅ PUT - Update accessory quantity
router.put("/cart/:id", verifyToken, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "Quantity must be at least 1" });
  }

  try {
    const cartItem = await AccessoryCart.findById(req.params.id);
    if (!cartItem) return res.status(404).json({ message: "Cart item not found" });

    const accessory = await Accessory.findById(cartItem.accessory);
    if (!accessory) return res.status(404).json({ message: "Accessory not found" });

    const diff = quantity - cartItem.quantity;
    if (diff > 0 && accessory.stockQuantity < diff) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    accessory.stockQuantity -= diff;
    await accessory.save();

    res.status(200).json({ message: "Quantity updated", cartItem });
  } catch (err) {
    res.status(500).json({ message: "Failed to update quantity", error: err.message });
  }
});

// ✅ DELETE - Remove from cart
router.delete("/cart/:id", verifyToken, async (req, res) => {
  try {
    const cartItem = await AccessoryCart.findById(req.params.id);
    if (!cartItem) return res.status(404).json({ message: "Item not found" });

    const accessory = await Accessory.findById(cartItem.accessory);
    if (accessory) {
      accessory.stockQuantity += cartItem.quantity;
      await accessory.save();
    }

    await cartItem.deleteOne();
    res.status(200).json({ message: "Accessory removed from cart" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

// ✅ POST - Toggle favorite
router.post("/favorite/:id", verifyToken, async (req, res) => {
  try {
    const accessory = await Accessory.findById(req.params.id);
    if (!accessory) return res.status(404).json({ message: "Accessory not found" });

    accessory.favorite = !accessory.favorite;
    await accessory.save();

    res.status(200).json({
      message: accessory.favorite ? "Marked as favorite" : "Removed from favorites",
      favoriteStatus: accessory.favorite,
    });
  } catch (err) {
    res.status(500).json({ message: "Favorite toggle failed", error: err.message });
  }
});

module.exports = router;
