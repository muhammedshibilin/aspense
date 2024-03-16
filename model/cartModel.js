const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        ref: "User"
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Product"
            },productName:{
                type:String,
                required:true
            }, count: {
                type: Number,
                default: 1
            }, price: {
                type: Number,
                required: true
            },image:{
                type:String,
                required:true
            },
             totalPrice: {
                type: Number,
                default: 0
            }
        }],
           shippingMethod:{
            type:String,
            default:"free-shipping"
        },shippingAmount:{
            type:Number,
            default:0
        }
})

module.exports = mongoose.model("cart",cartSchema)