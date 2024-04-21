const Cart = require("../model/cartModel");
const Product = require("../model/productModel");
const User = require("../model/userModel");
const Address = require("../model/addressModel");
const Offer = require("../model/offerModel");
const Coupon = require("../model/couponModel");
const { couponAmount } = require("./couponController");

async function calculateTotalAmountWithOffers(cartData) {
  let productOfferAmounts = [];

  for (const item of cartData.products) {
    if (!item.productId || !item.productId.price || !item.count) {
      console.error("Missing product data for item:", item);
      continue; // Skip to the next item
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
    let productOfferAmount = {
      productId: item.productId._id,
      discount: discount,
    };
    productOfferAmounts.push(productOfferAmount);
  }

  return {
    productOfferAmounts,
  };
}

const addToCart = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    if (!user_id) {
      return res.json({ login: true });
    }

    const product_id = req.body.productId;
    let quantity = req.body.quantity;
    let cart = await Cart.findOne({ user: user_id }).populate(
      "products.productId"
    );

    const productData = await Product.findById(product_id);
    const userData = await User.findOne({ _id: user_id });

    let count = 1;
    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
      count = parseInt(quantity);
    }

    if (count > 5) {
      return res.json({ limit: true });
    }

    if (productData.quantity < count) {
      return res.json({ stock: true });
    }

    const existCartData = await Cart.findOne({ user: user_id });

    if (existCartData) {
      const existProductIndex = existCartData.products.findIndex(
        (p) => p.productId == product_id
      );

      console.log("eso", existProductIndex);

      if (existProductIndex !== -1) {
        return res.json({
          exist: true,
        });
      }
    }

    let productDetails = {
      productId: product_id,
      count: count,
    };

    if (!cart) {
      cart = await Cart.create({
        user: user_id,
        products: [productDetails],
      });
      return res.json({ success: true, newProduct: true });
    }

    cart.products.push(productDetails);
    const updated = await cart.save();
    console.log("updated", updated);

    return res.json({ success: true, newProduct: true });
  } catch (e) {
    console.log("Error while adding to cart", e);
    res.status(500).json({ error: "An error occurred while adding to cart." });
  }
};

const cartLoad = async (req, res) => {
  try {
    const user_id = req.session.user_id;

    const cartData = await Cart.findOne({ user: user_id }).populate({
      path: "products.productId",
      model: "Product",
      is_block: 0,
    });

    if (cartData && cartData.products && cartData.products.length > 0) {
      const { productOfferAmounts } = await calculateTotalAmountWithOffers(
        cartData
      );

      let subTotal = 0;
      cartData.products.forEach((product, index) => {
        const offerAmount = productOfferAmounts.find(
          (offer) =>
            offer.productId.toString() === product.productId._id.toString()
        );
        console.log("offerama", offerAmount);
        if (offerAmount) {
          product.totalPrice =
            product.productId.price * product.count - offerAmount.discount;
          subTotal += product.totalPrice;
        } else {
          product.totalPrice = product.productId.price * product.count;
          subTotal += product.totalPrice;
        }
      });
      const shippingCharge = subTotal > 1500 ? 0 : 90;
      const grandTotal = subTotal + shippingCharge;
      console.log(
        "dataaaaaaaas",
        cartData,
        subTotal,
        grandTotal,
        shippingCharge
      );
      res.render("cart", {
        cart: cartData,
        subTotal,
        user: user_id,
        grandTotal,
        shippingCharge,
      });
    } else {
      res.render("cart", {
        user: user_id,
        cart: null,
        message: "No products available in your cart.",
      });
    }
  } catch (e) {
    console.log("error while loading cart", e);
    res.status(500).send("Error loading cart");
  }
};

const removeCartItem = async (req, res) => {
  try {
    console.log("remove");
    const userId = req.session.user_id;
    const productId = req.body.product;
    console.log(userId, "user", productId, "product");
    const cartData = await Cart.findOne({ user: userId });
    console.log(cartData, "cartdata");
    if (cartData) {
      await Cart.findOneAndUpdate(
        { user: userId },
        {
          $pull: { products: { productId: productId } },
        }
      );
      res.json({ success: true });
    }
    console.log(cartData);
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).render("500");
  }
};

const updateCart = async (req, res) => {
  try {
    const product_id = req.body.productId;
    const user_id = req.session.user_id;
    const increment = req.body.count;
    console.log("bpdu", req.body);

    const cartData = await Cart.findOne({ user: user_id }).populate({
      path: "products.productId",
      model: "Product",
      is_block: 0,
    });

    console.log("cartData", cartData);

    const product = cartData.products.find(
      (obj) => obj.productId._id.toString() === product_id
    );

    console.log("producteyyyyyyyyyyy", product);

    if (!product) {
      return res.json({ error: "Product not found in cart" });
    }

    const productData = await Product.findById(product_id);

    if (product && product.count + increment > productData.quantity) {
      return res.json({ stock: true });
    }
    const { productOfferAmounts } = await calculateTotalAmountWithOffers(
      cartData
    );
    console.log("product", productOfferAmounts);

    const updatedProductOffer = productOfferAmounts.find(
      (offer) => offer.productId.toString() === product_id
    );
    console.log("updatedoffeerr", updatedProductOffer);

    if (!updatedProductOffer) {
      console.error("No offer found for updated product:", product_id);
      return res.json({ error: "Offer information unavailable" });
    }

    // Update cart item quantity
    const update = await Cart.findOneAndUpdate(
      { user: user_id, "products.productId": product_id },
      { $inc: { "products.$.count": increment } }
    );

    // Fetch updated cart data
    const updatedCartData = await Cart.findOne({ user: user_id });

    let updatedCount = product.count + increment;
    let totalPrice =
      updatedCount * (productData.price - updatedProductOffer.discount);
    console.log("total of product", totalPrice, updatedCount);

    let newSubTotal = 0;
    for (const product of updatedCartData.products) {
      const productData = await Product.findById(product.productId);
      const productPrice = parseFloat(productData.price);
      const productCount = parseFloat(product.count);

      if (!isNaN(productPrice) && !isNaN(productCount)) {
        const offeredPrice =
          productPrice -
          (productOfferAmounts.find(
            (offer) =>
              offer.productId.toString() === product.productId._id.toString()
          )?.discount || 0); // Use optional chaining for potential missing offers
        newSubTotal += offeredPrice * productCount;
      } else {
        console.log(
          "Invalid product price or count:",
          productPrice,
          productCount
        );
      }
    }
    console.log("new subeyyyyyyyyyyyyyyy", newSubTotal);

    let shippingCharge = newSubTotal > 1500 ? 0 : 90;
    let grandTotal = newSubTotal + shippingCharge;

    // Include offer details in the response
    res.json({
      newQuantity: updatedCount,
      newTotalPrice: totalPrice,
      newSubTotal: newSubTotal,
      newShippingCharge: shippingCharge,
      newGrandTotal: grandTotal,
      productId: product_id,
      updatedProductOffer, // This includes discount, offeredPrice, etc.
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error updating cart");
  }
};

const checkoutLoad = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const cartData = await Cart.findOne({ user: user_id }).populate(
      "products.productId"
    );

    const allCoupons = await Coupon.find();

    if (cartData) {
      let addressData = await Address.findOne({ user: user_id });
      const { productOfferAmounts } = await calculateTotalAmountWithOffers(
        cartData
      );
      console.log("productofferAmounts", productOfferAmounts);

      let subTotal = 0;
      const eachTotal = cartData.products.map((val) => {
        if (val && val.productId && val.productId.price && val.count) {
          const offerAmount = productOfferAmounts.find(
            (offer) =>
              offer.productId.toString() === val.productId._id.toString()
          );
          let discount = offerAmount ? offerAmount.discount : 0;
          console.log("discoutn,", discount);
          console.log("count", val.count);
          let totalPrice = (val.productId.price - discount) * val.count;
          console.log("totaaaaaaaaaaaaaaaal", totalPrice);
          subTotal += totalPrice;

          return totalPrice;
        }
        return 0;
      });
      let totalAmount = subTotal;
      const currentDate = new Date();

      const eligibleCoupons = allCoupons.filter((coupon) => {
        const isActive = currentDate >= coupon.activationDate;
        const isNotExpired = currentDate <= coupon.expireDate;
        const isCriteriaMet = subTotal >= parseFloat(coupon.criteriaAmount);

        return isActive && isNotExpired && isCriteriaMet;
      });

      if (cartData.appliedCoupon) {
        const appliedCouponData = await Coupon.findById(cartData.appliedCoupon);
        let discount = Math.floor(totalAmount*(appliedCouponData.discountAmount/100))
        totalAmount-=discount
      }

      let shippingAmount = totalAmount < 1500 ? 90 : 0;
      if (shippingAmount > 0) {
        totalAmount += shippingAmount;
      }
      
      res.render("checkout", {
        addressData,
        cart: cartData,
        subTotal,
        total: totalAmount,
        user: user_id,
        shippingAmount,
        eachTotal,
        couponData: eligibleCoupons,
      });
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  cartLoad,
  addToCart,
  updateCart,
  checkoutLoad,
  removeCartItem,
};
