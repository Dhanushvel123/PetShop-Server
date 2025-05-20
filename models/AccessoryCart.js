const mongoose = require("mongoose");

const AccessoryCartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  accessory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Accessory",
    required: true
  },
  accessoryName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true
});

const AccessoryCart = mongoose.model("AccessoryCart", AccessoryCartSchema);
module.exports = AccessoryCart;
