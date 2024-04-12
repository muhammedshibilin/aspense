const Coupon = require("../model/couponModel")



const couponLoad = async (req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search ? req.query.search : '';
        let query = {};

        const totalcoupons = await Coupon.countDocuments(query);
        const totalPages = Math.ceil(totalcoupons / limit);

        const couponData = await Coupon.find(query).skip(skip).limit(limit);

        res.render('coupon',{
            couponData,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: searchQuery,
        })
    } catch (e) {
        console.log('while loading coupon',e);
    }
}


const addCouponLoad = async (req,res) => {
    try {
        res.render('addCoupon')
    } catch (e) {
        console.log('while loading add coupon',e);
    }
}


const codeGenerator = async (req,res) => {
    try {
        console.log('geuuuuuuuuuuuuuu');
        const couponCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        res.json({ couponCode: couponCode });  
    } catch (error) {
      console.log('while generating coupon code ',error);  
    }
}

const addCoupon = async(req, res ) => {
    try {
        console.log('!!!!!!!!! reached save coupons !!!!!!!!!!!!');

        const {couponName,couponCode,discount,expiryDate,criteriaAmount}=req.body;
        console.log('expiryDate:',expiryDate);
       

        const newCoupon = new Coupon({
            couponName: couponName,
            couponCode: couponCode,
            discountAmount: discount,
            activationDate: new Date(),
            expireDate: expiryDate, 
            criteriaAmount: criteriaAmount,
        });

        newCoupon.save();
        res.json({success:true})
    } catch (e) {
        console.log('while adding coupon',e);
    }
}

const deleteCoupon = async (req,res) => {
    try {
        const couponId = req.body.couponId
        console.log('ciy',couponId);
        const couponToDelete = await Coupon.findById(couponId);
        console.log('sdfasa',couponToDelete);
        await couponToDelete.deleteOne();
        res.json({success:true})
        
    } catch (e) {
        console.log('while deleting the coupon',e);
    }
}


const editCouponLoad = async (req,res) => {
    try {
        const couponData = await Coupon.findById({_id:req.query.id})

        res.render("editCoupon",{coupon:couponData})
    } catch (e) {
        console.log('while editing the coupon',e);
    }
}

const editCoupon = async (req,res) =>{
    try {
        const {couponName,couponCode,discount,expireDate,criteriaAmount}=req.body;
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            req.body.couponId,
            {
                couponName: couponName,
                couponCode: couponCode,
                discountAmount: discount,
                expireDate: expireDate,
                criteriaAmount: criteriaAmount,
            },
            { new: true } 
        );
        res.json({success:true})
        
        
    } catch (error) {
        console.log('while editing the coupon',error);
    }
}


module.exports = {
    couponLoad,
    addCouponLoad,
    codeGenerator,
    addCoupon,
    deleteCoupon,
    editCouponLoad,
    editCoupon
    
}