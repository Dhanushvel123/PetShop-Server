const mongoose = require("mongoose");

const AccessorySchema = new mongoose.Schema({
  accessoryName: {
    type: String,
    required: [true, "Accessory name is required"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price must be a positive number"]
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: [0, "Stock cannot be negative"]
  },
  imageUrl: {
    type: String,
    required: [true, "Image URL is required"],
    trim: true
  },
  favorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const AccessoryModel = mongoose.model("Accessory", AccessorySchema);
module.exports = AccessoryModel;
