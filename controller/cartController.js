const Cart = require("../model/cartModel");
const Product = require("../model/productModel");
const User = require("../model/userModel");
const Address = require("../model/addressModel");
const Offer = require('../model/offerModel')


async function calculateTotalAmountWithOffers(cartData) {
  let totalAmount = 0;
  let totalAmountBeforeDiscounts = 0;
  let totalDiscount=0
  let discount=0
  let productOfferAmount =0
 
  for (const item of cartData.products) {
    if (!item.productId || !item.productId.price || !item.count) {
      console.error("Missing product data for item:", item);
    }else{
      let itemPrice = item.productId.price * item.count;
      totalAmountBeforeDiscounts += item.productId.price * item.count;
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
 
      if (mostSignificantOffer) {
        if (itemPrice === 0) {
          totalAmount += 0; 
        } else {
           discount = Math.floor(itemPrice * (mostSignificantOffer.discountAmount / 100));
           console.log('discscscscxcscscscs',discount);
           itemPrice -= discount;
           totalDiscount += discount;
           console.log('type',typeof totalDiscount,totalDiscount);
           console.log(`Product: ${item.productId.name}, Price: ${item.productId.price}, Count: ${item.count}, Discount: ${discount}`);
        }        
      }
      totalAmount += itemPrice;
      productOfferAmount = Math.floor(item.productId.price*(mostSignificantOffer.discountAmount/100))
      console.log('ooofofofofofoof', productOfferAmount );
  }
} 


console.log('Total Amount After Discount:', totalAmount);
console.log('Total Amount Before Discount:', totalAmountBeforeDiscounts);
console.log('total discout',totalDiscount);
console.log('ooofofofofofoof', productOfferAmount );

  return {totalAmount,totalAmountBeforeDiscounts,totalDiscount,discount,productOfferAmount}
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
      return res.json({limit:true});
    }

    if (productData.quantity < quantity) {
      return res.json({ stock: true });
    }

    const existCartData = await Cart.findOne({ user: user_id });

    if (existCartData) {
      const existProductIndex = existCartData.products.findIndex(
        (p) => p.productId == product_id
      );

      console.log('eso',existProductIndex);

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
       path: 'products.productId',
       model: 'Product',
       is_block:0
     });
 
    
 
     if (cartData && cartData.products && cartData.products.length > 0) {
      const {discount} = await calculateTotalAmountWithOffers(cartData)
       let subTotal = 0;
       cartData.products.forEach(product => {     
         product.totalPrice = (product.productId.price * product.count)-discount;
         subTotal += product.totalPrice;
         console.log('sfa',product.productId.images);
       });
       const shippingCharge = subTotal > 1500 ? 0 : 90;
 
       const grandTotal = subTotal + shippingCharge;
 
       console.log('dataa', grandTotal, shippingCharge);
 
       res.render("cart", {
         cart: cartData,
         subTotal,
         user: user_id,
         grandTotal,
         shippingCharge,
       });
     } else {
       res.render("cart", { user: user_id, cart: null, message: "No products available in your cart." });
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
 
     const cartData = await Cart.findOne({ user: user_id }).populate({
      path: 'products.productId',
      model: 'Product',
      is_block:0
    });
    
     const product = cartData.products.find(
       (obj) => obj.productId.toString() === product_id
     );
     const productData = await Product.findById(product_id);  
     if (product && (product.count + increment > 5)) {
       return res.json({ limit: true });
     }
     const { totalAmount, productOffertAmount } = await calculateTotalAmountWithOffers(cartData);
     console.log('productofer',productOffertAmount,calculateTotalAmountWithOffers(cartData));

     if (!totalAmount && !productOffertAmount) { // Handle empty response (likely due to all missing data)
       console.error('Error calculating offer amounts: All cart items might have missing data');
       return res.json({ error: 'Error calculating discounts' }); // Inform user of an error
     }

    
 
     if (
       product &&
       ((increment > 0 && product.count + increment <= productData.quantity) ||
         increment < 0)
     ) {
       const update = await Cart.findOneAndUpdate(
         { user: user_id, "products.productId": product_id },
         { $inc: { "products.$.count": increment } }
       );
 
       const updatedCartData = await Cart.findOne({ user: user_id });
       
 
       let updatedCount = product.count + increment;
       let totalPrice = ((productData.price) * updatedCount);
 
       let newSubTotal = 0;
       for (const product of updatedCartData.products) {
         const productData = await Product.findById(product.productId);
         const productPrice = parseFloat(productData.price);
         const productCount = parseFloat(product.count);
 
         if (!isNaN(productPrice) && !isNaN(productCount)) {
           newSubTotal += productPrice * productCount;
         } else {
           console.log('Invalid product price or count:', productPrice, productCount);
         }
       }
 
   
       let shippingCharge = newSubTotal > 1500 ? 0 : 90;
       let grandTotal = newSubTotal + shippingCharge;

      
 
       res.json({
         newQuantity: updatedCount,
         newTotalPrice: totalPrice,
         newSubTotal: newSubTotal,
         newShippingCharge: shippingCharge,
         newGrandTotal: grandTotal,
         productId: product_id
       });
     } else {
       return res.json({ stock: true });
     }
  } catch (error) {
     console.log(error.message);
     res.status(500).send("Error updating cart");
  }
 };
 
 
 
const checkoutLoad = async (req, res) => {
  try {
     const user_id = req.session.user_id;
     const cartData = await Cart.findOne({ user: user_id }).populate("products.productId");
 
     if (cartData) {
       let addressData = await Address.findOne({ user: user_id });
       console.log('addressData', addressData);
 
       const subTotal = cartData.products.reduce((acc, val) => {
         if (val && val.productId && val.productId.price && val.count) {
           return acc + (val.productId.price * val.count);
         }
         return acc;
       }, 0);
 
       console.log("subtotal", subTotal);
       let totalAmount = subTotal;
 
       let shippingAmount = subTotal < 1500 ? 90 : 0;
       if (shippingAmount > 0) {
         totalAmount += shippingAmount;
       }
 
       console.log(totalAmount);
 
       const eachTotal = cartData.products.map(val => {
         if (val && val.productId && val.productId.price && val.count) {
           return val.productId.price * val.count;
         }
         return 0;
       });
 
   
       res.render("checkout", {
         addressData,
         cart: cartData,
         subTotal,
         total: totalAmount,
         user: user_id,
         shippingAmount,
         eachTotal, 
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
