const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productType: {
          type: String,
          enum: ["food", "accessory"],
          required: true,
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: false, // If you want to reference the original product
        },
        name: { type: String, required: true },
        image: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Delivered", "Cancelled"],
      default: "Pending",
    },
    date: {
      type: Date,
      default: Date.now,
    },

    // Optional delivery tracking fields (for future use)
    deliveryAddress: {
      type: String,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("Order", orderSchema);
