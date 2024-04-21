const express = require('express');
const user_route = express()
const userController = require("../controller/userController");
const cartController = require('../controller/cartController')
const addressController = require('../controller/addressController')
const orderController = require('../controller/orderController')
const wishlistController = require('../controller/wishlistController')
const couponController = require("../controller/couponController")
const asyncHandler = require('express-async-handler')
const multer1 = require('multer');
const upload = multer1();
const axios = require('axios')


user_route.use(express.urlencoded({ extended: false }));

const multer = require('../middleware/multer')
const auth = require("../middleware/userAuth")
const passport = require('passport')

const config = require('../config/config')
const path = require('path')
require('../utils/gpassport')
  / require('../utils/fpassport')

const session = require('express-session');

user_route.use(passport.initialize())
user_route.use(passport.session())

user_route.use(session({
  secret: 'your_secret_key_here',
  resave: false,
  saveUninitialized: true
}));


user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));
user_route.use(express.static(path.join(__dirname, 'public')));


// View engine setup
user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');


user_route.get("/", userController.loadHome)
user_route.get("/home", userController.loadHome)

user_route.get("/product-details", userController.loadProductDetails)


user_route.get('/sign-up', auth.isLogout, userController.loadSignup);

user_route.get('/auth/google', passport.authenticate('google', {
  scope: ['email', 'profile']
}))

user_route.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/success',
    failureRedirect: '/failure'
  }))
  user_route.get("/success", userController.successLoad)
  user_route.get('/failure', userController.failureLoad)



// user_route.get('/auth/facebook', passport.authenticate('facebook', {
//   scope: ['public_profile', 'email']
// }))
// user_route.get('/auth/facebook/callback', passport.authenticate('facebook', {
//   successRedirect: "/success",
//   failureRedirect: '/failure'

// }))


user_route.get('/otp', userController.otpLoad);
user_route.post('/verify-otp', userController.verifyOtp);
user_route.get('/resend-otp', userController.resendOtp);

user_route.get("/profile", auth.isLogin, userController.profileLoad)
user_route.post('/edit-profile',multer.uploadProfile.single('image'),userController.editProfile)
user_route.get('/email-verification',auth.isLogin,userController.emailVerification = async (req,res)=> {
  try{
     res.render('changemail')
  }catch(e){
   console.log('while change email',e);
  }
})
user_route.post('/email-verification',userController.verifyEmailChange)
user_route.post('/password-change',upload.none(),userController.passwordChange)
user_route.get('/forgot-password',userController.forgotPassword)
user_route.post('/get-email',userController.getEmail)
user_route.get('/change-password',userController.changePasswordLoad)
user_route.post('/change-password',userController.changePassword)
user_route.post('/add-address', upload.none(), addressController.addAddress);
user_route.post('/delete-address',addressController.deleteAddress)
user_route.post('/edit-address',addressController.editAddress)



user_route.get('/get-address-details/:pincode', async (req, res) => {
    const pincode = req.params.pincode;
    console.log('pincode:', pincode); 
    const apiKey = `17305b8b79f740a4adabb545b5801dd5`; 
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${pincode}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const results = response.data.results;
        console.log('results:', results); 

        if (results && results.length > 0) {
            const addressDetails = results[0].components;
            addressDetails.postoffice = results[0].formatted.split(',')[0];
            res.json(addressDetails);
        } else {
            res.status(404).send('No results found for the given pincode.');
        }
    } catch (error) {
        console.error('Error fetching address details:', error.message); 
        res.status(500).send('Error fetching address details.');
    }
});

module.exports = user_route;


user_route.get('/logout', auth.isLogin, userController.logoutUser)






user_route.get('/cart',auth.isLogin,cartController.cartLoad)
user_route.post('/add-to-cart',cartController.addToCart)
user_route.post("/removeCartItem",auth.isLogin,cartController.removeCartItem)
user_route.post("/update-cart",auth.isLogin,cartController.updateCart)
user_route.get('/checkout',auth.isLogin,cartController.checkoutLoad)
user_route.post("/coupon-amount",auth.isLogin,couponController.couponAmount)
user_route.post("/remove-coupon",auth.isLogin,couponController.removeCoupon)

user_route.post("/place-order",auth.isLogin,orderController.placeOrder)
user_route.post('/paypal-ipn', async (req, res) => {
console.log('paypal messaee',req.body);
  const user_id = req.session.user_id;
  const deleted = await Cart.deleteOne({ user: user_id });
  console.log('dekee',deleted);
  res.sendStatus(200);
 });
 
user_route.get('/order-success',auth.isLogin,orderController.orderSuccess)
user_route.get('/order-details',auth.isLogin,orderController.orderDetails)
user_route.post('/cancel-order',auth.isLogin,orderController.cancelOrder)
user_route.post('/return-request',auth.isLogin,orderController.returnOrder)
user_route.get('/invoice/pdf', asyncHandler(orderController.generateInvoicePDF));
user_route.get('/invoice/success', asyncHandler(orderController.invoiceSuccess));


user_route.get('/shop',userController.shopLoad)
user_route.post('/sign-up', userController.insertUser)
user_route.get('/login', auth.isLogout, userController.loadLogin);
user_route.post('/login', userController.verifyLogin);



user_route.get('/wishlist',wishlistController.WishlistLoad)
user_route.post('/add-to-wishlist',wishlistController.addToWish)
user_route.delete('/remove-from-wishlist',wishlistController.removeFromWish)


module.exports = user_route;
