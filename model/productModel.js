const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types;

const ProductSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Category"
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
    date:{
        type:Date,
    },
    offer:{
        type:ObjectId,
        ref:'Offer',
        
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

module.exports= mongoose.model("Product",ProductSchema)