const mongoose = require ('mongoose')

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    is_block:{
        type:Number,
        default:0
    }
})


const category = mongoose.model('Category',categorySchema)

module.exports = category