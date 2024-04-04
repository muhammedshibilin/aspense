const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
  },
  deliveryDetails: {
    type: Object,
    required: true,
  },
  orderId: {
    type: String,
  },
  products: [
    {
      productId: {
        type: String,
        required: true,
        ref: "Product",
      },
      name: {
        type: String,
      },
      count: {
        type: Number,
        default: 1,
      },
      image: [
        {
          type: String,
          required: true,
        },
      ],
      productPrice: {
        type: Number,
        required: true,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
  },
  returnReason: {
    type: String,
  },
  paymentMethod: {
    type: String,
  },
  shippingMethod: {
    type: String,
  },
  shippingAmount: {
    type: Number,
  },
});

module.exports = mongoose.model("Order", orderSchema);
