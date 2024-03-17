
const express = require('express');
const admin_route = express()
const adminController = require("../controller/adminController");
const productController = require('../controller/productController')
const categoryController = require("../controller/categoryController")
const orderController  = require('../controller/orderController')
const multer = require('../middleware/multer')
const auth = require('../middleware/adminAuth')
const path = require('path')


const session = require('express-session');

// Session middleware setup
admin_route.use(session({
  secret: 'your_secret_key_here',
  resave: false,
  saveUninitialized: true
}));


//-----------------> body parsers


admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));
admin_route.use(express.static(path.join(__dirname, 'public')));

//-----------------> view setting



admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');


//-----------------> admin managment


admin_route.get('/login',auth.isLogout,adminController.loginLoad)
admin_route.post('/login',auth.isLogout,adminController.adminLogin)
admin_route.get('/home',auth.isLogin,adminController.adminHome)
admin_route.get('/',auth.isLogin,adminController.adminHome)
admin_route.get("/logout",auth.isLogin,adminController.adminLogout)


//----------------->  user managment


admin_route.get('/user-managment',auth.isLogin,adminController.userLoad)
admin_route.post('/block-user',auth.isLogin,adminController.blockUser)


//-----------------> category managment

admin_route.get("/category",auth.isLogin,categoryController.loadCategory)
admin_route.post("/add-category",auth.isLogin,categoryController.addCategory)
admin_route.get("/delete-category",auth.isLogin,categoryController.categoryDelete)
admin_route.get("/block-category",auth.isLogin,categoryController.blockCategory)
admin_route.get("/unblock-category",auth.isLogin,categoryController.unblockCategory)
admin_route.post("/edit-category",auth.isLogin,categoryController.editCategory)




//----------------->  product managment


admin_route.get('/product',auth.isLogin,productController.productLoad)
admin_route.get('/add-product',auth.isLogin,productController.addProductLoad)
admin_route.post('/add-product',auth.isLogin,multer.uploadProduct,productController.addProduct)
admin_route.get("/edit-product",auth.isLogin,productController.editProductLoad)
admin_route.post("/edit-product",auth.isLogin,multer.uploadProduct,productController.editProduct)
admin_route.get('/block-product',auth.isLogin,productController.blockProduct)
admin_route.get('/delete-product',auth.isLogin,productController.deleteProduct)


admin_route.get('/order',auth.isLogin,orderController.orderLoad)
admin_route.get('/order-managment', auth.isLogin, orderController.orderdetailsLoad);
admin_route.post('/update-order',orderController.updateOrder)






admin_route.get('*', (req, res) => {
  res.redirect('/admin')

})


module.exports = admin_route