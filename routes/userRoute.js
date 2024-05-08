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
const geolib = require('geolib');


user_route.use(express.urlencoded({ extended: false }));

const multer = require('../middleware/multer')
const auth = require("../middleware/userAuth")
const passport = require('passport')


const path = require('path')
require('../utils/gpassport')
 

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
user_route.get('/about',userController.aboutLoad)

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

// function degreesToRadians(degrees) {
//   return degrees * (Math.PI / 180);
// }

// function calculateDistance(userLat, userLng, companyLat, companyLng) {
//   const earthRadius = 6371; 
//   const dLat = degreesToRadians(companyLat - userLat);
//   const dLng = degreesToRadians(companyLng - userLng);
//   const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(degreesToRadians(userLat)) * Math.cos(degreesToRadians(companyLat)) *
//       Math.sin(dLng / 2) * Math.sin(dLng / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   const distance = earthRadius * c; 
//   return distance;
// }

user_route.get('/get-address-details/:houseName', async (req, res) => {
  const houseName = req.params.houseName;
  console.log('houseName:', houseName); 
    const apiKey = `17305b8b79f740a4adabb545b5801dd5`; 
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${houseName}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const results = response.data.results;
        console.log('results:', results); 

        if (results && results.length > 0) {
            const addressDetails = results[0].components;
            addressDetails.postoffice = results[0].formatted.split(',')[0];
            console.log('de',addressDetails);

            const userLocation = {
              latitude: results[0].geometry.lat,
              longitude: results[0].geometry.lng
            };
            
          
          const companyLocation = {
              latitude: 11.1523, 
              longitude: 75.8921 
          };

        
          const distanceInMeters = geolib.getDistance(userLocation, companyLocation);
          const distanceInKilometers = distanceInMeters / 1000;
          console.log("Distance between user and company:", distanceInKilometers.toFixed(2), "km");
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
user_route.post('/pay-now',auth.isLogin,orderController.payNow)
// user_route.get("/paypal-success",auth.isLogin,orderController.paypalSuccess)
// user_route.get("/paypal-cancel",auth.isLogin,orderController.paypalCancel)
user_route.post("/paypal-ipn",orderController.paypalIpn)
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

user_route.get("*", (req, res, next) => {
  if(req.url.match('/admin')) {
    next()
  } else {
    res.status(404).render('404');
  }
})

module.exports = user_route;
