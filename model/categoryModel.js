const mongoose = require ('mongoose')

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    is_block:{
        type:Boolean,
        required:true,
        default:true
    }
})


const category = mongoose.model('category',categorySchema)

module.exports = category