const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,ref: "User",
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,ref: "Product",required: true,
      },
      count: {
        type: Number,required: true,
      },
    },
  ],
  appliedCoupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
}
});

module.exports = mongoose.model("Cart", cartSchema);
