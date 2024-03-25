const Order = require('../model/orderModel')
const User = require('../model/userModel')
const Address = require('../model/addressModel')
const Cart = require('../model/cartModel')

const Product = require('../model/productModel')
const crypto = require("crypto")
const path = require('path')
const fs = require('fs')


const decreaseProductQuantity = async (products) => {
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

 
    const paymentMethod = req.body.formData.payment;
    const status = paymentMethod === 'COD' ? 'Placed' : 'Pending';
    console.log(paymentMethod, "method", req.body.formData.address, "address");

    const address = req.body.formData.address;

   
    const subtotalAmount = cartData.products.reduce(
      (acc, val) => acc + (val.totalPrice || 0),
      0,
    );
    let totalAmount = subtotalAmount;
    console.log('hhalallllllllllllllllllllllllllll', subtotalAmount);

    let shippingAmount = totalAmount<1500?90:0

   
    
    const uniqId = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .slice(0, 8)

  
    const productIds = cartData.products.map(product => product.productId);
    const products = await Product.find({ _id: { $in: productIds } });

  
    const productData = cartData.products.map(cartProduct => {
      const productDetails = products.find(p => p._id.toString() === cartProduct.productId.toString());
      console.log('image',productDetails.images.image1);
      return {
        
        productId: cartProduct.productId,
        count: cartProduct.count,
        productPrice: productDetails ? productDetails.price : 0,
        image: productDetails.images.image1 ? productDetails.images.image1 : '',
        totalPrice: cartProduct.totalPrice,
        status: status,
        name: productDetails ? productDetails.name : '',
      };
    });
console.log('halpppppppppppppppppp',productData);
    
totalAmount += shippingAmount;




    const order = new Order({
      user: user_id,
      orderId : uniqId,
      deliveryDetails: address,
      products: productData,
      date: new Date(),
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      shippingMethod: cartData.shippingMethod,
      shippingAmount: shippingAmount,
    });
console.log('dhfcksdfckjsdzjfcbsjkdfcbskjdfc',order);
    
    const orderData = await order.save();
    const orderId = orderData._id;
    await decreaseProductQuantity(cartData.products);


    if (orderData.paymentMethod === 'COD') {
      await Cart.deleteOne({ user: user_id });
      return res.json({ codsuccess: true, orderId });
    } 
  } catch (error) {
    console.error(error.message);
    res.status(500).render('500');
  }
}



const orderSuccess = async (req,res) => {
  try {
    res.render('orderSuccess')
  } catch (error) {
    console.log(error);
  }
}

const orderDetails = async (req,res) => {
  try {

    const userId = req.body.user_id
    const orderDetails = await Order.find({_id:req.query._id}).populate("products.productId")
    console.log(orderDetails,"ooooooooooooooooooooooooooooooooooooooooooooooooooooooooo");
    res.render('orderDetails',{order:orderDetails})
  } catch (error) {
    console.log(error);
  }
}

const cancelOrder = async (req,res) => {
  try {
      const userId = req.session.user_id
      console.log(req.session.user_id)
      const orderId = req.body.orderId
      const productId = req.body.productId
      console.log(req.body);

      const orderedData = await Order.findOne({_id:orderId})
      console.log('ordeereddddddddd ssaaaaaaaaanam',orderedData);
      console.log('ordereddddproductsdetails',orderedData.products);
      const orderedProduct =  orderedData.products.find( product => {
        return product._id.toString() === productId;
      })
      console.log('ordereeeeeeeeeedpreoduct',orderedProduct);
      
      

      const updateOrder = await Order.findOneAndUpdate(
        { _id: orderId, 'products._id': productId }, 
        { $set: { 'products.$.status': 'Cancelled' } },
        { new: true } 
       );
       

      console.log('statuss',updateOrder);
   
      const updateProductQuantity = await Order.updateOne(
        { _id: orderedProduct.productId },
        { $inc: { quantity: orderedProduct.count } }
      )
    
      console.log('quantiryyyy',updateProductQuantity);
      return res.json({success:true})
    
  } catch (error) {
    console.log(error,"while cancelling the order");
  }
}
// ------------------user load

const orderLoad = async (req,res) => {
  try {
  
  

    const orderData = await Order.find({
      'products.status': { $nin: ['pending'] },
    })
      

      console.log("ordeeeeeeeerrrrrrrrrrrrrr",orderData)
    res.render("order",{orderData})
  } catch (error) {
    console.log(error,"while loading admin order");
  }
}






const orderdetailsLoad = async (req, res) => {
  try {
    const orderId = req.query._id;
    console.log(orderId, "Order ID");
    
   
    const orderData = await Order.findOne({ _id: orderId }).populate({
      path: 'products',
      populate: {
          path: 'productId',
          populate: { path: 'category' } 
      }
  }).sort({ date: -1 });
  
        
    
    
    if (orderData) {
      
      const totalItems = orderData.products.reduce((total, product) => total + product.count, 0);
      const subtotal = orderData.products.reduce((total, product) => total + product.totalPrice, 0);

      
      const tax = subtotal * 0.1; 
      
      
      res.render('orderManagment', { orderData, totalItems, subtotal, tax });
    } else {
      res.render('orderManagment', { userId: req.session.user_id });
    }
  } catch (error) {
    console.log('Error while loading orderManagement:', error);
    res.status(500).send('Internal Server Error');
  }
}

const updateOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const orderStatus = req.body.status;
    console.log('bodyyyyyyy',req.body);

    const orderData = await Order.findOne({ 'products._id': orderId });
    console.log('orderData:', orderData);
    
    const orderProductIndex = orderData.products.findIndex(
      (product) => product._id.toString() === orderId
    );
    console.log('orderProductindex:', orderProductIndex);
    

    orderData.products[orderProductIndex].status = orderStatus;
    
   
    orderData.products[orderProductIndex].statusChangeTime = new Date();
    
    
    await orderData.save();

    res.json({ success: true, orderData });
  } catch (error) {
    console.log('Error while updating order:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};


const returnOrder = async (req, res) => {
  try {
    console.log('body',req.body);
    const productId = req.body.id
    const orderId = req.body.order
    const returnReason = req.body.returnReason
    console.log('id',orderId);

    const order = await Order.findById(orderId).populate('products')
    console.log('orderrrr',order);
    const returnedProduct = order.products.find(
      (val) => val._id.toString() === productId,
    )

    console.log('retunedd prooooo',returnedProduct);
    const productTotalPrice = returnedProduct.totalPrice
    const newTotalAmount = order.totalAmount - productTotalPrice;
    const count = returnedProduct.count

    console.log('asdjfjdkljkljjfjfjjfjfjfjfj',productTotalPrice,newTotalAmount);
   



    const updatedOrder = await Order.updateOne(
      { _id: orderId, 'products._id': productId },
      {
        $set: {
          'products.$.status': 'requested',
          returnReason: returnReason 
        },
      },
    );

    const updatedProduct = await Product.findByIdAndUpdate(
      { _id: productId },
      { $inc: { quantity: count } },
    )

    const updatedOrderTotal = await Order.findByIdAndUpdate(
      orderId,
      { $set: { totalAmount: newTotalAmount } },
      { new: true },
     );

    res.json({ success: true })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}









  module.exports = {
    placeOrder,
    orderSuccess,
    cancelOrder,
    returnOrder,
    orderDetails,
    orderLoad,
    orderdetailsLoad,
    updateOrder,
    
    
  }