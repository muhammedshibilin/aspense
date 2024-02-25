const express = require('express');
const user_route = express()
const User = require('../model/userModel')
const userController = require("../controller/userController");
const passport = require('passport')
const facebookStratagy = require("passport-facebook").Strategy
const axios = require('axios')


const session = require('express-session');

// Session middleware setup
user_route.use(session({
  secret: 'your_secret_key_here', 
  resave: false,
  saveUninitialized: true
}));

// Body parsing middleware setup
user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

// passport.use(new facebookStratagy({
//   clientID:"1081260976312180",
//   clientSecret:"4d63211dedb98bd818679ecbae5a0fa1",
//   callbackURL: 'http://localhost:7000/auth/facebook/callback'
// },async (accessToken,refreshToken,profile,done) => {
//   try {
    
//     const { data } = await axios.get(`https://graph.facebook.com/me?fields=email,phone&access_token=${accessToken}`);

//     if (data) {
//       userEmail = data.email;
//       userMobile = data.phone;
//     }


//     let user = await User.findOne({facebookId:profile.id})

//     if(!user){
//       user = new User({
//         facebookId: profile.id,
//         facebookName: profile.displayName,
//         facebookEmail: profile.emails[0].value
        
//       })
//       const userData = await user.save()
//     }
//     done(null,user)
//   } catch (error) {
//     console.log(error);
//     done(error,null)
//   }
// }))


  

// View engine setup
user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');

// Routes
user_route.get('/', function(req, res, next) {
  res.render('userHome');
});

user_route.get('/sign-up', userController.loadSignup);
user_route.post('/sign-up',userController.insertUser)
// user_route.get('/auth/facebook',passport.authenticate('facebook',{successRedirect: '/userHome', failureRedirect: '/sign-up'}));
// user_route.get('/auth/facebook/callback',
//   passport.authenticate('facebook', { successRedirect: '/userHome', failureRedirect: '/sign-up' }));


user_route.get('/otp', userController.otpLoad);
user_route.post('/verify-otp', userController.verifyOtp);
user_route.get('/resend-otp', userController.resendOtp);

user_route.get('/login', userController.loadLogin);
user_route.post('/login', userController.verifyLogin);

// Error handling middleware
user_route.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = user_route;
