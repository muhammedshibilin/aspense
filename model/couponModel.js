const mongoose=require('mongoose');

const couponSchema=mongoose.Schema({
    couponName:{
        type:String,
        required:true
    },
    couponCode:{
        type:String,
        required:true
    },
    discountAmount:{
        type:String,
        required:true
    },
    activationDate:{
        type:Date,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true
    },
    criteriaAmount:{
        type:String,
        required:true
    },
    usedUser:{
        type:Array,
        ref:'User',
        default:[]
    },
     
},
    {
        timestamps:true
    }
)
module.exports=mongoose.model('Coupon',couponSchema);