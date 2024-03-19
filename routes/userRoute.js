const express = require('express');
const user_route = express()
const User = require('../model/userModel')
const userController = require("../controller/userController");
const cartController = require('../controller/cartController')
const addressController = require('../controller/addressController')
const orderController = require('../controller/orderController')
const multer1 = require('multer');
const upload = multer1();

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

user_route.post('/sign-up', userController.insertUser)

user_route.get('/login', auth.isLogout, userController.loadLogin);
user_route.post('/login', userController.verifyLogin);

user_route.get("/profile", auth.isLogin, userController.profileLoad)
user_route.post('/edit-profile',multer.uploadProfile.single('image'),userController.editProfile)
user_route.get('/forgot-password',userController.forgotPassword)
user_route.post('/get-email',userController.getEmail)
user_route.get('/change-password',userController.changePasswordLoad)
user_route.post('/change-password',userController.changePassword)
user_route.post('/add-address', upload.none(), addressController.addAddress);
user_route.get('/delete-address',addressController.deleteAddress)

user_route.get('/logout', auth.isLogin, userController.logoutUser)



user_route.get('/otp', userController.otpLoad);
user_route.post('/verify-otp', userController.verifyOtp);
user_route.get('/resend-otp', auth.isLogout, userController.resendOtp);



user_route.get('/cart',cartController.cartLoad)
user_route.post('/add-to-cart',cartController.addToCart)
user_route.post("/removeCartItem",cartController.removeCartItem)
user_route.post("/update-cart",cartController.updateCart)
user_route.get('/checkout',cartController.checkoutLoad)
user_route.post("/place-order",orderController.placeOrder)
user_route.get('/order-success',orderController.orderSuccess)
user_route.get('/order-details',orderController.orderDetails)
user_route.post('/cancel-order',orderController.cancelOrder)
user_route.post('/return-request',orderController.returnOrder)


user_route.get('/shop',userController.shopLoad)


module.exports = user_route;
