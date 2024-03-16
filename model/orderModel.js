const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    user:{
        type:mongoose.Types.ObjectId
    },
    deliveryDetails:{
        type:Object,
        required:true
    },
    products:[
        {
        productId:{
            type:String,
            required:true,
            ref:"product"
        },
        count:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            required:true
        },
        totalPrice:{
            type:Number,
            required:true
        },
        status:{
            type:string
        }
    }
    
    ],
    totalAmount:{
        type:Number,
        required:true
    },
    date:{
        type:Date
    },
    status:{
        type:string
    },
    paymentMethod:{
        type:String
    },
    orderId:{
        type:String
    },
    shippingMethod:{
        type:String
    },
    shippingAmount:{
        type:Number
    }

})

module.exports = mongoose.model("Order",orderSchema)