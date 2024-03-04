const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  productId:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true
  },
  review:{
    type:String,
    required:true
  }
  
});

module.exports = mongoose.model("review", reviewSchema);