
const express = require('express');
const admin_route = express()
const adminController = require("../controller/adminController");


const session = require('express-session');

// Session middleware setup
admin_route.use(session({
  secret: 'your_secret_key_here', 
  resave: false,
  saveUninitialized: true
}));

// Body parsing middleware setup
admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}));

// View engine setup
admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');


admin_route.get('/login',adminController.loginLoad)

admin_route.get('*',(req,res) => {
    res.redirect('/admin')

})


module.exports= admin_route