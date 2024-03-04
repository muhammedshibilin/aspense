
const express = require('express');
const admin_route = express()
const adminController = require("../controller/adminController");
const productController = require('../controller/productController')
const categoryController = require("../controller/categoryController")
const multer = require('../middleware/multer')
const auth = require('../middleware/adminAuth')


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

//-----------------> view setting



admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');


//-----------------> admin managment


admin_route.get('/login',auth.isLogout,adminController.loginLoad)
admin_route.post('/login', adminController.adminLogin)
admin_route.get('/home',auth.isLogin,adminController.adminHome)
admin_route.get('/admin',auth.isLogin,adminController.adminHome)


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
admin_route.post('/add-product',multer.uploadProduct,productController.addProduct)
admin_route.get("/edit-product",auth.isLogin,productController.editProductLoad)
 admin_route.post("/edit-product",multer.uploadProduct,productController.editProduct)
 admin_route.get('/block-product',productController.blockProduct)
 admin_route.get('/delete-product',productController.deleteProduct)






admin_route.get('*', (req, res) => {
  res.redirect('/admin')

})


module.exports = admin_route