const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema({
  user: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      product: {
        type: ObjectId,
        ref: "Product",
        required: true,
      },    
    },
  ],
});

module.exports = mongoose.model("Wishlist", WishlistSchema);
