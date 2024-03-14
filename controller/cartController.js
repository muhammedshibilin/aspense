const Cart = require('../model/cartModel')
const Product = require('../model/productModel')
const User = require('../model/userModel')



const cartLoad = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        console.log(user_id);
        const cartData = await Cart.find({ user: user_id }).populate("products.productId");
        console.log("cartDataaaaaaaaaa",cartData);

        let total = 0;
        let cartCount = 0;

        if (cartData && cartData.length > 0) {
            for (let cart of cartData) {
                for (let product of cart.products) {
                    const productId = product.productId;
                    const productData = await Product.findById(productId).select('price');
                    const count = product.count;
                    const productPrice = productData.price || 0;
                    const totalPrice = productPrice * count;
                    total += totalPrice;
                    product.totalPrice = totalPrice;
                    cartCount += count;
                }
            }

            const subTotal = total;
            const shippingCharge = total < 1300 ? 90 : 0;
            const grandTotal = total + shippingCharge;

            res.render('cart', {
                user: user_id,
                user_id,
                cart: cartData,
                total: total,
                subTotal,
                shippingCharge,
                grandTotal,
                cartCount,
            });
        } else {
            res.render('cart', {
                user: user_id,
                user_id,
                cart: [],
                total: 0,
                subTotal: 0,
                shippingCharge: 0,
                grandTotal: 0,
                cartCount: 0,
            });
        }
    } catch (e) {
        console.log("error while loading cart", e);
        res.status(500).send("Error loading cart");
    }
};

const addToCart = async (req, res) => {
    try {
        console.log("cartil ethii");
        const user_id = req.session.user_id;
        if (!user_id) {
            return res.json({
                login: true,
                message: 'Please log in to add products to your cart.',
            });
        }
        const product_id = req.body.productId;
        const productData = await Product.findById(product_id).populate('category');
        console.log(productData,product_id,user_id);
        const userData = await User.findOne({ _id: user_id });

        
       
        const count = req.body.count ? parseInt(req.body.count) : 1;
        console.log(count,userData);
        if (!user_id) {
            return res.json({
                login: false,
                message: 'Please log in to add products to your cart.',
            });
        }

        const products = {
            productId: product_id,
            productName: productData.name,
            price: productData.price,
            image:productData.images.image1,
            totalPrice: productData.price * count,
            count: count,
            image: productData.images.image1,
        };


        const cartProduct = await Cart.find({ user: user_id, 'products.productId': product_id });
        console.log(cartProduct);
        console.log("products",products);
        const existCartData = await Cart.findOne({ user: user_id });
        const productQuantity = productData.quantity;

        console.log(existCartData,productQuantity);

        if (!existCartData) {
            const newCartData = await Cart.create({
                user: user_id,
                userName: userData.name,
                products: [products],
            });
            return res.json({ success: true, newProduct: true });
        }

        const existProductIndex = existCartData.products.findIndex(
            (p) => p.productId == product_id,
        );

        if (existProductIndex !== -1) {
            return res.json({
                exist: true,
                newProduct: false,
                message: 'Product is already in your cart',
            });
        }

        if (productQuantity < count) {
            return res.json({
                success: false,
                limit: true,
                message: 'Quantity limit reached!',
            });
        }


        existCartData.products.push(products);
        await existCartData.save();
        res.json({ success: true, newProduct: true });

    } catch (e) {
        console.log("while adding to cart", e);
        res.status(500).send("Error adding to cart");
    }
};

const checkoutLoad = async (req,res) => {
    try {
        res.render("checkout")
    } catch (e) {
        console.log(e,"while loading checkout");
    }
}

module.exports = {
    cartLoad,
    addToCart,
    checkoutLoad
}