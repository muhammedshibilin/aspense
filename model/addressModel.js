const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: 'User'
    },
    address: [
        {
            fullName: {
                type: String,
                required: true,
                trim: true
            }, mobile: {
                type: Number,
                required: true,
                trim: true
            },email:{
                type:String,
                required:true,
                trim:true
            },houseName:{
                type:String
            },city:{
                type:String,
                required:true,
                trim:true

            },
            state:{
                type:String,
                required:true,
                trim:true
            },pin:{
                type:Number,
                required:true,
                trim:true

            }
        }
    ]
})

module.exports = mongoose.model('Address',addressSchema)