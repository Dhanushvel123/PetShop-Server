const mongoose = require('mongoose');

const AccessorySchema = new mongoose.Schema({
  accessoryName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  imageUrl: {
    type: String,
    default: "",
    trim: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const AccessoryModel = mongoose.model("Accessory", AccessorySchema);
module.exports = AccessoryModel;
