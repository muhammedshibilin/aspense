const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types;

const ProductSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    category:{
        type:ObjectId,
        required:true,
        ref:"category"
    },
    quantity:{
        type:Number,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    size:{
        type:String,
        required:true
    },
    images:{
       image1:{
        type:String,
        required:true
       },
       image2:{
        type:String,
        required:true
       },
       image3:{
        type:String,
        required:true
       },
       image4:{
        type:String,
        required:true
       }
    },
    offer:{
        type:Number,
        ref:'offer',
        required:true
       
    },
    discription:{
        type:String,
        requird:true
    },
    is_block:{
        type:Number,        
        default:0
    }
    
})

module.exports= mongoose.model("product",ProductSchema)