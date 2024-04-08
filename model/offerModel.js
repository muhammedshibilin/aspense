const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    categoryId:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Category',required:false }],
    productId:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Product',required:false }],
    discountAmount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    is_block: { type:Number, default: 0 }
});

    
module.exports = mongoose.model("Offer", offerSchema);