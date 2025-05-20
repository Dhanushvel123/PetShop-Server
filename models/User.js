// server/models/User.js

const mongoose = require("mongoose");

// Schema for items within an order
const OrderItemSchema = new mongoose.Schema({
  foodName: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 1, default: 1 }
}, { _id: false });

// Schema for an order
const OrderSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  items: [OrderItemSchema],
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

// User schema with embedded order history and admin flag and adminPassword hash
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  // hashed admin password for that user (optional)
  adminPassword: {
    type: String,
    default: null,
    select: false // exclude by default from queries
  },
  orderHistory: {
    type: [OrderSchema],
    default: []
  }
  
}, { timestamps: true }); // Adds createdAt and updatedAt

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
