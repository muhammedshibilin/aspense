
const express = require('express');
const admin_route = express()
const adminController = require("../controller/adminController");
const productController = require('../controller/productController')
const categoryController = require("../controller/categoryController")
const orderController  = require('../controller/orderController')
const offerController = require("../controller/offerController")
const couponController = require('../controller/couponController')
const multer = require('../middleware/multer')
const auth = require('../middleware/adminAuth')
const path = require('path')
const multerUpload = require('multer');
const upload = multerUpload().none();


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


admin_route.get('/user',auth.isLogin,adminController.userLoad)
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
admin_route.delete('/delete-image',auth.isLogin,productController.deleteImage)


admin_route.get('/order',auth.isLogin,orderController.orderLoad)
admin_route.get('/order-managment', auth.isLogin, orderController.orderdetailsLoad);
admin_route.post('/update-order',orderController.updateOrder)


admin_route.get("/offer",auth.isLogin,offerController.offerLoad)
admin_route.post('/add-offer',auth.isLogin,upload,offerController.addOffer)
admin_route.get('/edit-offer',auth.isLogin,offerController.editOfferLoad)
admin_route.post('/edit-offer',auth.isLogin,upload,offerController.editOffer)
admin_route.post('/block-offer',auth.isLogin,offerController.blockOffer)
admin_route.post('/delete-offer',auth.isLogin,offerController.deleteOffer)



admin_route.get('/coupon',couponController.couponLoad)





admin_route.get('*', (req, res) => {
  res.redirect('/admin')

})


module.exports = admin_route