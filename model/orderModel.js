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
      productStatus: {
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
 orderStatus: { type: String },
 returnReason: {
    type: String,
 },
 paymentMethod: {
    type: String,
 },
 shippingAmount: {
    type: Number,
 },
}, {
 timestamps: true,
});

module.exports = mongoose.model("Order", orderSchema);
