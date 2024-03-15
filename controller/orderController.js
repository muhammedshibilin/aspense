const Order = require('../models/orderModel')
const User = require('../models/userModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const Product = require('../models/productsModel')
const ejs = require('ejs')
const path = require('path')
const fs = require('fs')


const placeOrder = async (req, res) => {
    try {
      const user_id = req.session.user_id
      console.log('cartdata',cartData);
      const paymentMethod = req.body.formData.payment
      const status = paymentMethod === 'COD' ? 'Placed' : 'Pending'
      const userData = await User.findById(user_id)
      
      const address = req.body.formData.address
      const subtotalAmount = cartData.product.reduce(
        (acc, val) => acc + (val.totalPrice || 0),
        0,
      )
     
  
      let totalAmount = subtotalAmount
  
   
  
      
      const productIds = cartData.product.map((product) => product.productId)
      const products = await Product.find({ _id: { $in: productIds } })
  
      const productData = cartData.product.map((cartProduct) => {
        const productDetails = products.find(
          (p) => p._id.toString() === cartProduct.productId.toString(),
        )
        return {
          productId: cartProduct.productId,
          count: cartProduct.count,
          productPrice: productDetails ? productDetails.price : 0,
          image: productDetails ? productDetails.images.image1 : '',
          totalPrice: cartProduct.totalPrice,
          status: status,
          productName: productDetails ? productDetails.name : '',
        }
      })
  
      const purchaseDate = new Date()
      let shippingAmount = 0
      const shipingTotalAmount = 1300
  
      
      if (paymentMethod === 'COD' && totalAmount > shipingTotalAmount) {
        res.json({ maxAmount: true })
        return
      } else if (totalAmount < shipingTotalAmount) {
        shippingAmount = 90
        totalAmount += shippingAmount
      }
  
      const order = new Order({
        user: user_id,
        orderId: uniqId,
        deliveryDetails: address,
        orderProducts: productData,
        purchaseDate: purchaseDate,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        shippingMethod: cartData.shippingMethod,
        shippingAmount: shippingAmount,
      })
  
      const orderData = await order.save()
      const orderId = orderData._id
  
      if (orderData.paymentMethod === 'COD') {
        await decrementProductQuantities(cartData.product);
  
        await Cart.deleteOne({ userId: user_id })
        return res.json({ codsuccess: true, orderId })
      } else if (orderData.paymentMethod == 'onlinePayment') {
        await decrementProductQuantities(cartData.product);
        var options = {
          amount: orderData.totalAmount * 100,
          currency: 'INR',
          receipt: '' + orderId,
        }
        instance.orders.create(options, async function (err, order) {
  
          const update = await Order.findByIdAndUpdate(
            { _id: orderId },
            { $set: { status: status } },
          )
  
          return res.json({ razorpay: true, order })
        })
      } else if (orderData.paymentMethod === 'wallet') {
  
        await decrementProductQuantities(cartData.product);
        const totalAmount = orderData.totalAmount
        const TransactuonDate = new Date()
  
        if (walletBalance >= totalAmount) {
          const wallet = await User.findOneAndUpdate(
            { _id: user_id },
            {
              $inc: { wallet: -totalAmount },
              $push: {
                walletHistory: {
                  transactionDate: TransactuonDate,
                  amount: totalAmount,
                  direction: 'Debited',
                },
              },
            },
            { new: true },
          )
  
          if (wallet) {
            for (let i = 0; i < cartData.product.length; i++) {
              let product = cartData.product[i].productId
              await Order.updateOne(
                { _id: orderId, 'orderProducts.productId': product },
                { $set: { 'orderProducts.$.status': 'placed' } },
              )
            }
  
            const orderUpdate = await Order.findByIdAndUpdate(
              { _id: orderId },
              { $set: { status: 'placed' } },
            )
            await Cart.deleteOne({ userId: user_id })
            return res.json({ placed: true, orderId })
          } else {
            return res.json({ walletFailed: true })
          }
        } else {
          return res.json({ walletFailed: true })
        }
      }
    } catch (error) {
      console.error(error.message)
      res.status(500).render('500')
    }
  }



  module.exports = {
    placeOrder
  }