const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const ProductSchema = new mongoose.Schema({
 name: {
    type: String,
    required: true,
 },
 category: {
    type: ObjectId,
    required: true,
    ref: "Category",
 },
 quantity: {
    type: Number,
    required: true,
 },
 price: {
    type: Number,
    required: true,
 },
 images: [
    {
      type: String,
      required: true,
    },
 ],
 date: {
    type: Date,
 },
 description: {
    type: String,
    required: true,
 },
 is_block: {
    type: Number,
    default: 0,
 },
}, {
 timestamps: true, 
});

module.exports = mongoose.model("Product", ProductSchema);
