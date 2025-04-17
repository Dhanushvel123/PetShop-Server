const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
    foodName: String,
    price: Number,
    image: String
});

module.exports = mongoose.model("Cart", CartSchema);
