const Coupon = require("../model/couponModel");
const Cart = require("../model/cartModel");
const Offer = require("../model/offerModel");

const couponLoad = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search ? req.query.search : "";
    let query = {};

    const totalcoupons = await Coupon.countDocuments(query);
    const totalPages = Math.ceil(totalcoupons / limit);

    const couponData = await Coupon.find(query).skip(skip).limit(limit);

    res.render("coupon", {
      couponData,
      currentPage: page,
      totalPages: totalPages,
      searchQuery: searchQuery,
    });
  } catch (e) {
    console.log("while loading coupon", e);
  }
};

const addCouponLoad = async (req, res) => {
  try {
    res.render("addCoupon");
  } catch (e) {
    console.log("while loading add coupon", e);
  }
};

const codeGenerator = async (req, res) => {
  try {
    console.log("geuuuuuuuuuuuuuu");
    const couponCode =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    res.json({ couponCode: couponCode });
  } catch (error) {
    console.log("while generating coupon code ", error);
  }
};

const addCoupon = async (req, res) => {
  try {


    const { couponName, couponCode, discount, expiryDate, criteriaAmount } =
      req.body;
      const existingCoupon = await Coupon.findOne({ couponName: { $regex: new RegExp(couponName, 'i') } });
      if (existingCoupon) {
        return res.json({exist:true});
      }
    const newCoupon = new Coupon({
      couponName: couponName,
      couponCode: couponCode,
      discountAmount: discount,
      activationDate: new Date(),
      expireDate: expiryDate,
      criteriaAmount: criteriaAmount,
    });

    newCoupon.save();
    res.json({ success: true });
  } catch (e) {
    console.log("while adding coupon", e);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.body.couponId;
    console.log("ciy", couponId);
    const couponToDelete = await Coupon.findById(couponId);
    console.log("sdfasa", couponToDelete);
    await couponToDelete.deleteOne();
    res.json({ success: true });
  } catch (e) {
    console.log("while deleting the coupon", e);
  }
};

const editCouponLoad = async (req, res) => {
  try {
    const couponData = await Coupon.findById({ _id: req.query.id });

    res.render("editCoupon", { coupon: couponData });
  } catch (e) {
    console.log("while editing the coupon", e);
  }
};

const editCoupon = async (req, res) => {
  try {
    console.log('khfkshdfjhahdfjh');
    const { couponName, couponCode, discount, expireDate, criteriaAmount } =
      req.body;
      const existingCoupon = await Coupon.findOne({ couponName: { $regex: new RegExp(couponName, 'i') } });

      if (existingCoupon) {
        if (existingCoupon._id.equals(req.body.couponId)) {
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
          return res.json({ success: true });
        } else {
          return res.json({exist: true });
        }
      }
      

   
  } catch (error) {
    console.log("while editing the coupon", error);
  }
};

async function calculateTotalAmountWithOffers(cartData) {
  const productOfferAmounts = [];
  let totalAmount = 0
  let totalAmountAfter = 0

  for (const item of cartData.products) {
    if (!item.productId || !item.productId.price || !item.count) {
      console.error("Missing product data for item:", item);
      continue;
    }

    let applicableOffers = await Offer.find({
      $or: [
        { productId: item.productId._id },
        { categoryId: item.productId.category },
      ],
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      is_block: 0,
    });

    let mostSignificantOffer = null;
    const productOffer = applicableOffers.find((offer) =>
      offer.productId.some((id) => id.equals(item.productId._id))
    );
    const categoryOffer = applicableOffers.find((offer) =>
      offer.categoryId.some((id) => id.equals(item.productId.category))
    );
    if (productOffer && categoryOffer) {
      mostSignificantOffer =
        productOffer.discountAmount > categoryOffer.discountAmount
          ? productOffer
          : categoryOffer;
    } else if (productOffer) {
      mostSignificantOffer = productOffer;
    } else if (categoryOffer) {
      mostSignificantOffer = categoryOffer;
    }

    let discount = 0;
    if (mostSignificantOffer) {
      discount = Math.floor(
        item.productId.price * (mostSignificantOffer.discountAmount / 100)
      );
    }
    totalAmount +=(item.productId.price-discount)*item.count;
    console.log('totalllllllllllllllllamotun offerr calluvlllllllll',totalAmount);
  }

  totalAmountAfter += totalAmount

  return {
    totalAmountAfter
  };
}

const couponAmount = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const couponId = req.body.couponId;
    console.log('vidtttttyyy',req.body);
    const cartData = await Cart.findOne({ user: user_id }).populate("products.productId");
    const couponData = await Coupon.findById({ _id: couponId });
    console.log("coupon and cart Dataaaas", couponData, cartData);
    if (cartData.appliedCoupon) {
      return res.json({
        success: false,
        message: "you applied a coupon you can add after removing the added one",
      });
    }

    if (cartData) {
      const couponData = await Coupon.findById({ _id: req.body.couponId });
      console.log("couponData", couponData);
      let {totalAmountAfter} = await calculateTotalAmountWithOffers(cartData);
      console.log("couponData.discoutAmount", couponData.discountAmount,totalAmountAfter);
      const couponOfferAmount = Math.floor(
        totalAmountAfter * (couponData.discountAmount / 100)
      );
      console.log("amount", couponOfferAmount);

      totalAmountAfter -= couponOfferAmount

      console.log("amountaftercoupon", totalAmountAfter);

      let shippingAmount = totalAmountAfter < 1500 ? 90 : 0;
      if (shippingAmount > 0) {
        totalAmountAfter += shippingAmount;
      }

      await Cart.findOneAndUpdate(
        { user: user_id },
        { $set: { appliedCoupon: couponId } },
      )
    
      res.json({
        success: true,
        couponOfferAmount,
        grandTotal: totalAmountAfter,
        shippingAmount,
        couponData
      });
    }
  } catch (error) {
    console.log("error while calculating coupon amount", error);
    res.status(500).render("500");
  }
};

const removeCoupon = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const couponId = req.body.couponId
    const cartData = await Cart.findOne({ user: user_id });

    if (!cartData) {
      return res.json({ success: false, message: "No cart data found." });
    }else{
      const updateResult = await Cart.findOneAndUpdate(
        { user: user_id },
        { $unset: { appliedCoupon: "" } }, 
        { new: true } 
      );
      console.log('updated result',updateResult);
    res.json({ success: true, message: "Coupon removed successfully." });
    }
  } catch (error) {
    console.error("Error removing coupon:", error);
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
  couponAmount,
  removeCoupon,
};
