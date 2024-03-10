
const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    mobile:{
        type:String,
        required:true,
        minlength:10
    },
    password:{
        type:String,
        required:true,
        minlength:6
    },
    image:{
        type:String,
        required:false
    },
    is_verified:{
        type:Number,
        default:0
    },
    is_admin:{
        type:Number,
        default:0

    },
    is_block:{
        type:Number,
        default:0
    }
    
})

module.exports = mongoose.model("User",userSchema)