const express = require('express');
const user_route = express()
const User = require('../model/userModel')
const userController = require("../controller/userController");
const auth = require("../middleware/userAuth")
const passport = require('passport')
const config = require('../config/config')
require('../utils/gpassport')
const FacebookStrategy = require('passport-facebook').Strategy
// require('../utils/fpassport')

const session = require('express-session');

user_route.use(passport.initialize())
user_route.use(passport.session())

user_route.use(session({
  secret: 'your_secret_key_here', 
  resave: false,
  saveUninitialized: true
}));


user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

  

// View engine setup
user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');

user_route.get("/",userController.loadHome)
user_route.get("/home",userController.loadHome)

user_route.get("/product-details",userController.loadProductDetails)
 
user_route.get('/sign-up',auth.isLogout,userController.loadSignup);

user_route.get('/auth/google',passport.authenticate('google',{
  scope:['email','profile']
}))

user_route.get('/auth/google/callback',
passport.authenticate('google',{
successRedirect:'/success',
failureRedirect:'/failure'}))


// user_route.get('/auth/facebook',passport.authenticate('facebook',{
//     scope:['public_profile','email']
//   }))
// user_route.get('/auth/facebook/callback',passport.authenticate('facebook',{
//     successRedirect:"/success",
//     failureRedirect:'/failure'

//   }))

//   function isLoggedIn(req, res, next) {
//     if (req.isAuthenticated())
//       return next();
//     res.redirect('/');
//   }

  

  user_route.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));
  user_route.get('/auth/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication, redirect to a different page
      res.render('userHome');
    });

user_route.post('/sign-up',userController.insertUser)

user_route.get("/profile",auth.isLogin,userController.profileLoad)

user_route.get("/success",userController.successLoad)

user_route.get('/failure',userController.failureLoad)

user_route.get('/logout',auth.isLogin,userController.logoutUser)



user_route.get('/otp', userController.otpLoad);
user_route.post('/verify-otp', userController.verifyOtp);
user_route.get('/resend-otp',auth.isLogout,userController.resendOtp);

user_route.get('/login',auth.isLogout,userController.loadLogin);
user_route.post('/login', userController.verifyLogin);



module.exports = user_route;
