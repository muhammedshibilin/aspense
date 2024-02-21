const express = require('express');
const user_route = express()
const userController = require("../controller/userController");


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

// View engine setup
user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');

// Routes
user_route.get('/', function(req, res, next) {
  res.render('userHome');
});

user_route.get('/sign-up', userController.loadSignup);
user_route.post('/sign-up', userController.insertUser);

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
