// server/models/Cart.js

const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // make sure you have a User model
      required: true,
    },
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "foodschema", // make sure you have a Food model
      required: true,
    },
    foodName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String, // store image URL or path
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
