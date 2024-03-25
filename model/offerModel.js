const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    discountAmount:{
        type:Number,
        required:true
    },
    startDate:{
        type:Date,
        requird:true
    },
    endDate:{
        type:Date,
        required:true
    },
    is_block:{
        type:Number,
        default:0
    }
})

module.exports = mongoose.model("Offer",offerSchema)