const Order = require('../model/orderModel')
const User = require('../model/userModel')
const Address = require('../model/addressModel')
const Cart = require('../model/cartModel')
const Product = require('../model/productModel')
const crypto = require("crypto")

const ejs = require('ejs')
const path = require('path')
const fs = require('fs')




const decrementProductQuantities = async (products) => {
  for (let i = 0; i < products.length; i++) {
    let product = products[i].productId;
    let count = products[i].count;
    await Product.updateOne(
      { _id: product },
      { $inc: { quantity: -count } },
    );
  }
};

const placeOrder = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    console.log(user_id);

    const cartData = await Cart.findOne({ user: user_id });
    if (!cartData) {
      res.status(404).json({ error: "Cart data not found" });
      return;
    }

    console.log(cartData.products, 'suuuuuuuuuuuooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo');
    const paymentMethod = req.body.formData.payment;
    const status = paymentMethod === 'COD' ? 'Placed' : 'Pending';
    console.log(paymentMethod, "method", req.body.formData.address, "address");

    const address = req.body.formData.address;

    // Calculating subtotal amount
    const subtotalAmount = cartData.products.reduce(
      (acc, val) => acc + (val.totalPrice || 0),
      0,
    );
    console.log('hhalallllllllllllllllllllllllllll', subtotalAmount);

    // Total amount calculation
    let totalAmount = subtotalAmount;
    const uniqId = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .slice(0, 8)

    // Fetching product details
    const productIds = cartData.products.map(product => product.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // Creating product data for the order
    const productData = cartData.products.map(cartProduct => {
      const productDetails = products.find(p => p._id.toString() === cartProduct.productId.toString());
      return {
        
        productId: cartProduct.productId,
        count: cartProduct.count,
        productPrice: productDetails ? productDetails.price : 0,
        image: productDetails ? productDetails.images.image1 : '',
        totalPrice: cartProduct.totalPrice,
        status: status,
        productName: productDetails ? productDetails.name : '',
      };
    });
console.log('halpppppppppppppppppp',productData);
    // Shipping amount calculation
    let shippingAmount = 0;
    const shipingTotalAmount = 1300;



    // Creating new order instance
    const order = new Order({
      user: user_id,
      orderId : uniqId,
      deliveryDetails: address,
      products: productData,
      Date: new Date(),
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      shippingMethod: cartData.shippingMethod,
      shippingAmount: shippingAmount,
    });
console.log('dhfcksdfckjsdzjfcbsjkdfcbskjdfc',order);
    // Saving the order
    const orderData = await order.save();
    const orderId = orderData._id;
    await decrementProductQuantities(cartData.products);


    if (orderData.paymentMethod === 'COD') {
      await Cart.deleteOne({ user: user_id });
      return res.json({ codsuccess: true, orderId });
    } 
  } catch (error) {
    console.error(error.message);
    res.status(500).render('500');
  }
}



  module.exports = {
    placeOrder
  }