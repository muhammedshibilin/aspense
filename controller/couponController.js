const Coupon = require("../model/couponModel")
const Cart = require("../model/cartModel")
const Offer = require("../model/offerModel")



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

async function calculateTotalAmountWithOffers(cartData) {

    const productOfferAmounts = [];
   
    for (const item of cartData.products) {
       if (!item.productId || !item.productId.price || !item.count) {
         console.error("Missing product data for item:", item);
         continue; 
       }
   
    
   
       let applicableOffers = await Offer.find({
         $or: [
           { productId: item.productId._id },
           { categoryId: item.productId.category }
         ],
         startDate: { $lte: new Date() },
         endDate: { $gte: new Date() },
         is_block: 0
       });
   
       let mostSignificantOffer = null;
       const productOffer = applicableOffers.find(offer => offer.productId.some(id => id.equals(item.productId._id)));
       const categoryOffer = applicableOffers.find(offer => offer.categoryId.some(id => id.equals(item.productId.category)));
       if (productOffer && categoryOffer) {
         mostSignificantOffer = productOffer.discountAmount > categoryOffer.discountAmount ? productOffer : categoryOffer;
       } else if (productOffer) {
         mostSignificantOffer = productOffer;
       } else if (categoryOffer) {
         mostSignificantOffer = categoryOffer;
       }
   
       let discount = 0;
       if (mostSignificantOffer) {
         discount = Math.floor(item.productId.price * (mostSignificantOffer.discountAmount / 100));
       }
       const productOfferAmount = {
         productId: item.productId._id, 
         discount: discount,
       };
       productOfferAmounts.push(productOfferAmount);
    }
   
    return {
       productOfferAmounts
    };
   }

   const couponAmount = async (req, res) => {
    try {
        console.log('boudy',req.body);
        const user_id = req.session.user_id;
        const cartData = await Cart.findOne({ user: user_id }).populate("products.productId");
       

        if (cartData) {
            const couponData = await Coupon.findById({_id: req.body.couponId});
            console.log('couponData',couponData);
            const { productOfferAmounts } = await calculateTotalAmountWithOffers(cartData);
            let subTotal = 0;
            const eachTotal = cartData.products.map(val => {
                if (val && val.productId && val.productId.price && val.count) {
                    const offerAmount = productOfferAmounts.find(offer => offer.productId.toString() === val.productId._id.toString());
                    let discount = offerAmount ? offerAmount.discount : 0;
                    let totalPrice = val.productId.price - discount * val.count;
                    subTotal += totalPrice;
                    return totalPrice;
                }
                return 0;
            });
            let totalAmount = subTotal;
            let shippingAmount = subTotal < 1500 ? 90 : 0;
            if (shippingAmount > 0) {
                totalAmount += shippingAmount;
            }
            console.log('total',totalAmount,eachTotal);
            console.log('couponData.discoutAmount',couponData.discountAmount);
            const couponOfferAmount = Math.floor(totalAmount * (couponData.discountAmount / 100));
            console.log('amount',couponOfferAmount);
            res.json({ success: true, couponOfferAmount });
        } else {
            res.json({ success: false, message: "No cart data found." });
        }
    } catch (error) {
        console.log("error while calculating coupon amount", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



module.exports = {
    couponLoad,
    addCouponLoad,
    codeGenerator,
    addCoupon,
    deleteCoupon,
    editCouponLoad,
    editCoupon,
    couponAmount
    
}