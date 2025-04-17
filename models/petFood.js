const mongoose = require("mongoose");

const PetFoodSchema = new mongoose.Schema(
  {
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      maxlength: [100, "Food name can't exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Description can't exceed 300 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price can't be negative"],
    },
    image: {
      type: String,
      default: "",
      validate: {
        validator: (v) =>
          !v || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/.test(v),
        message: "Image must be a valid URL",
      },
    },
  },
  { timestamps: true }
);

const PetFoodModel = mongoose.model("PetFood", PetFoodSchema);

module.exports = PetFoodModel;
