const mongoose = require ('mongoose')

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    is_block:{
        type:Number,
        required:true,
        default:0
    }
})


const category = mongoose.model('category',categorySchema)

module.exports = category