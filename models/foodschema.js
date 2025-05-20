// server/models/foodschema.js

const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
      default: "", // URL or file path
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: "general", // Optionally useful for filtering
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true, // Useful for hiding inactive items
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Food", foodSchema);
