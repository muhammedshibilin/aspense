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
                type: String,
                required: true,
                ref: "product"
            }, count: {
                type: Number,
                default: 1
            }, price: {
                type: Number,
                required: true
            }, totalPrice: {
                type: Number,
                default: 0
            }
        }],couponDiscount:{
            type:String,
            ref:'coupon'
        },shippingMethod:{
            type:String,
            default:"free-shipping"
        },shippingAmount:{
            type:Number,
            default:0
        }
})

module.exports = mongoose.model("cart",cartSchema)