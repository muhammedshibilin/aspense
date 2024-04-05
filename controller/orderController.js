const Order = require('../model/orderModel')
const Cart = require('../model/cartModel')

const Product = require('../model/productModel')
const crypto = require("crypto")
const path = require('path')
const easyInvoice = require("easyinvoice")
const PDFDocument = require('pdfkit');
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

    const cartData = await Cart.findOne({ user: user_id }).populate("products.productId");
    if (!cartData) {
      res.status(404).json({ error: "Cart data not found" });
      return;
    }


    const paymentMethod = req.body.formData.payment;
    const status = paymentMethod === 'COD' ? 'Placed' : 'Pending';
    const address = req.body.formData.address;


    const subtotalAmount = cartData.products.reduce(
      (acc, val) => acc + (val.productId.price * val.count || 0),
       0,
     );
    let totalAmount = subtotalAmount;
   

    let shippingAmount = totalAmount < 1500 ? 90 : 0



    const uniqId = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .slice(0, 8)


    const productIds = cartData.products.map(product => product.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productData = cartData.products.map(cartProduct => {
      const productDetails = products.find(p => p._id.toString() === cartProduct.productId._id.toString());
      console.log('log',productDetails);

    if (cartProduct.count > productDetails.quantity) {
      return res.status(400).json({ quantity:true});
  }
      console.log('image', productDetails.images);
      return {

        productId: cartProduct.productId._id,
        count: cartProduct.count,
        productPrice: productDetails ? productDetails.price : 0,
        image: productDetails.images ? productDetails.images : '',
        totalPrice: productDetails.price*cartProduct.count,
        status: status,
        name: productDetails ? productDetails.name : '',
      };
    });
    console.log('halpppppppppppppppppp', productData);

    totalAmount += shippingAmount;

    const order = new Order({
      user: user_id,
      orderId: uniqId,
      deliveryDetails: address,
      products: productData,
      date: new Date(),
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      shippingMethod: cartData.shippingMethod,
      shippingAmount: shippingAmount,
    });
    console.log('dhfcksdfckjsdzjfcbsjkdfcbskjdfc', order);

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



const orderSuccess = async (req, res) => {
  try {
    res.render('orderSuccess')
  } catch (error) {
    console.log(error);
  }
}

const orderDetails = async (req, res) => {
  try {

    const userId = req.body.user_id
    const orderDetails = await Order.find({ _id: req.query._id }).populate("products.productId")
    res.render('orderDetails', { order: orderDetails,user:userId })
  } catch (error) {
    console.log(error);
  }
}

const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user_id
    console.log(req.session.user_id)
    const orderId = req.body.orderId
    const productId = req.body.productId
    console.log(req.body);

    const orderedData = await Order.findOne({ _id: orderId })
    console.log('ordeereddddddddd ssaaaaaaaaanam', orderedData);
    console.log('ordereddddproductsdetails', orderedData.products);
    const orderedProduct = orderedData.products.find(product => {
      return product._id.toString() === productId;
    })
    console.log('ordereeeeeeeeeedpreoduct', orderedProduct);



    const updateOrder = await Order.findOneAndUpdate(
      { _id: orderId, 'products._id': productId },
      { $set: { 'products.$.status': 'Cancelled' } },
      { new: true }
    );


    console.log('statuss', updateOrder);

    const updateProductQuantity = await Product.updateOne(
      { _id: orderedProduct.productId },
      { $inc: { quantity: orderedProduct.count } }
    )

    console.log('quantiryyyy', updateProductQuantity);
    return res.json({ success: true })

  } catch (error) {
    console.log(error, "while cancelling the order");
  }
}
// ------------------user load

const orderLoad = async (req, res) => {
  try {
     const page = parseInt(req.query.page) || 1;
     const limit = 6;
     const skip = (page - 1) * limit;
 

     const totalOrders = await Order.countDocuments({
       'products.status': { $nin: ['pending'] },
     });

     const totalPages = Math.ceil(totalOrders / limit);
 
     
     const orderData = await Order.find({
       'products.status': { $nin: ['pending'] },
     }).sort({ date: -1 }).skip(skip).limit(limit);
 
     res.render("order", {
       orderData,
       currentPage: page,
       totalPages: totalPages,
     });
  } catch (error) {
     console.log(error, "while loading admin order");
     res.status(500).render("500");
  }
 };






 const orderdetailsLoad = async (req, res) => {
  try {
    const orderId = req.query._id;
    console.log(orderId, "Order ID");

    const orderData = await Order.findOne({ _id: orderId }).populate({
      path: 'products.productId',
      populate: {
        path: 'category'
      }
    });
    
    console.log('jsfaf',orderData.products);

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
    console.log('bodyyyyyyy', req.body);

    const orderData = await Order.findOne({ 'products._id': orderId });
    console.log('orderData:', orderData);

    const orderProductIndex = orderData.products.findIndex(
      (product) => product._id.toString() === orderId
    );
    console.log('orderProductindex:', orderProductIndex);


    const productCount = orderData.products[orderProductIndex].count;
    orderData.products[orderProductIndex].status = orderStatus;
    orderData.products[orderProductIndex].date = new Date();


    if (orderStatus === 'accepted') {

      const productId = orderData.products[orderProductIndex].productId;
      const updated = await Product.updateOne(
        { _id: productId },
        { $inc: { quantity: productCount } }
      );
      console.log('quantityyy productttttttttt', updated);
    }


    const updated = await orderData.save();
    console.log('saved newwwwwww', updated);

    res.json({ success: true, orderData });
  } catch (error) {
    console.log('Error while updating order:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};


const returnOrder = async (req, res) => {
  try {
    console.log('body', req.body);
    const productId = req.body.id
    const orderId = req.body.order
    const returnReason = req.body.returnReason
    console.log('id', orderId);

    const order = await Order.findById(orderId).populate('products')
    console.log('orderrrr', order);
    const returnedProduct = order.products.find(
      (val) => val._id.toString() === productId,
    )

    console.log('retunedd prooooo', returnedProduct);
    const productTotalPrice = returnedProduct.totalPrice
    const newTotalAmount = order.totalAmount - productTotalPrice;
    const count = returnedProduct.count

    console.log('asdjfjdkljkljjfjfjjfjfjfjfj', productTotalPrice, newTotalAmount);




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

const generateInvoicePDF = async (req, res) => {
  const orderId = req.query.id;
  const orderDetails = await Order.findById(orderId);

  if (!orderDetails) {
      return res.status(404).json({ error: 'Order not found' });
  }

  let document = new PDFDocument({ margin: 50 });

  function generateHeader(document) {
      document.image('./public/user/images/logo.png', 50, 40, { width: 100 });
      document.fontSize(16).text('Your Company Name', 180, 50, { align: 'center' });
      document.fontSize(10).text('You can feel comfort', { align: 'center' });
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString();
      const formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      document.fontSize(12).text('Date: ' + formattedDate, 400, 70, { width: 150, align: 'right' });
      document.fontSize(12).text('Time: ' + formattedTime, 400, 90, { width: 150, align: 'right' });
      document.moveTo(50, 120).lineTo(550, 120).stroke();
  }

  function generateOrderDetails(document, orderDetails) {
      document.fontSize(18).text('Order Details', 50, 160);

      const headers = ['No.', 'Product', 'Quantity', 'Price', 'Total', 'Status', 'Payment Method'];
      const rows = orderDetails.products.map((product, index) => {
          const productName = product.name ? product.name.toString() : 'N/A';
          const productCount = product.count ? product.count.toString() : '0';
          const productPrice = product.productPrice ? '$' + product.productPrice.toString() : '$0';
          const totalPrice = product.totalPrice ? '$' + product.totalPrice.toString() : '$0';
          const productStatus = product.status ? product.status.toString() : 'N/A';
          const paymentMethod = product.paymentMethod ? product.paymentMethod.toString() : 'N/A';

          return [
              (index + 1).toString(),
              productName,
              productCount,
              productPrice,
              totalPrice,
              productStatus,
              paymentMethod
          ];
      });

      const columnWidths = [30, 150, 70, 70, 70, 70, 100];
      let y = 200; // Adjusted to start below the header

      headers.forEach((header, columnIndex) => {
          document.fontSize(12).text(header, 50 + columnWidths.slice(0, columnIndex).reduce((acc, width) => acc + width, 0), y, { width: columnWidths[columnIndex], align: 'center' });
      });

      // Draw horizontal lines between rows and vertical lines between columns
      rows.forEach((row, rowIndex) => {
          y += 20;
          row.forEach((cell, columnIndex) => {
              document.fontSize(12).text(cell, 50 + columnWidths.slice(0, columnIndex).reduce((acc, width) => acc + width, 0), y, { width: columnWidths[columnIndex], align: 'center' });
              if (rowIndex === 0) {
                  document.moveTo(50 + columnWidths.slice(0, columnIndex).reduce((acc, width) => acc + width, 0), 160)
                      .lineTo(50 + columnWidths.slice(0, columnIndex).reduce((acc, width) => acc + width, 0), y + 20)
                      .stroke();
              }
          });
          document.moveTo(50, y).lineTo(550, y).stroke();
      });

      // Write total amount
      const totalAmountText = 'Total Amount: $' + orderDetails.totalAmount;
      document.fontSize(12).text(totalAmountText, 50, y + 20, { align: 'right' });
  }

  function generateFooter(document) {
      document.fontSize(15).text('Thanks for your presence. Please keep purchasing', { align: 'center' });
  }

  generateHeader(document);
  generateOrderDetails(document, orderDetails);
  generateFooter(document);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');

  document.pipe(res);
  document.end();

  document.on('end', () => {
      console.log('PDF generation completed');
  });
}



 



const invoiceSuccess = async (req, res) => {
  res.json({invoice: true});
};



 








module.exports = {
  placeOrder,
  orderSuccess,
  cancelOrder,
  returnOrder,
  orderDetails,
  orderLoad,
  orderdetailsLoad,
  updateOrder,
  generateInvoicePDF,
  invoiceSuccess

}