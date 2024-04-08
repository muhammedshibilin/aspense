const Coupon = require("../model/couponModel")



const couponLoad = async (req,res) => {
    try {
        res.render('coupon')
    } catch (e) {
        console.log('while loading coupon',e);
    }
}



module.exports = {
    couponLoad,
    
}