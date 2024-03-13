const Cart = require('../model/cartModel')
const Product = require('../model/productModel')
const User = require('../model/userModel')



const cartLoad = async (req, res) => {
    try {
        const user_id = req.session.user_id
        const cartData = await Cart.find({ user: user_id }).populate("products.productId")
        console.log(cartData);

        if (cartData && cartData.length > 0) {
            const products = cartData.products
            let total = 0

            for (let i = 0; i < products.length; i++) {
                const productId = products[i].productId
                const product = await Product.findById(productId).select('price')
                const count = products[i].count
                const productPrice = product.price || 0
                const totalPrice = productPrice * count
                total = total + totalPrice
                cartData.products[i].totalPrice = totalPrice
            }

            const subTotal = total

            const shippingCharge = total < 1300 ? 90 : 0
            const grandTotal = total + shippingCharge

            const cart = await Cart.findOne({ user: user_id })
            let cartCount = 0
            if (cart) {
                cartCount = cart.products.length
            }

          
        }
        res.render('cart',{
            user: user_id,
            user_id,
            cart: cartData,
            products: cartData.products,
            total: total,
            subTotal,
            shippingCharge,
            grandTotal,
            cartCount,
        })




    } catch (e) {
        console.log("error while loading cart", e);
    }
}

const addToCart = async (req, res) => {
    try {

        const user_id = req.session.user_id
        const product_id = req.body.productId
        const productData = await Product.findById({ _id: product_id }).populate('category')
        const userData = await User.findOne({ _id: user_id })

        const cartProduct = await Cart.findOne({ user: user_id, 'products.product._id': product_id })
        const count = req.body.count ? parseInt(req.body.count) : 1

        if (!user_id) {
            return res.json({
                login: false,
                message: 'Please log in to add products to your cart.',
            })
        }

        const products = {
            productId: product_id,
            productName: productData.name,
            totalPrice: totalPrice,
            count: count,
            image: productData.images.image1,
        }

        console.log(products);
        const existCartData = await Cart.findOne({ user_id: user_id })
        const productQuantity = productData.quantity


        if (!existCartData) {
            const newCartData = await Cart.create({
                user: user_id,
                userName: userData.name,
                products: [products],
            })
            return res.json({ success: true, newProduct: true })
        }


        const existProductIndex = existCartData.products.findIndex(
            (p) => p.productId == product_id,
        )

        if (existProductIndex !== -1) {
            return res.json({
                exist: true,
                newProduct: false,
                message: 'product is already exist in your cart'

            })
        }

        if (productQuantity < count) {
            return res.json({
                success: false,
                limit: true,
                message: 'Quantity limit reached!',
            })
        }





    } catch (e) {
        console.log("while adding to cart", e);
    }
}

module.exports = {
    cartLoad,
    addToCart
}