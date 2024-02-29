const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    category:{
        type:String,
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
    discription:{
        type:String,
        requird:true
    },
    Is_blocked:{
        type:Boolean,        
        default:true
    }
    
})

module.exports= mongoose.model("product",ProductSchema)