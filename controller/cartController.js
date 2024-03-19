const Cart = require('../model/cartModel')
const Product = require('../model/productModel')
const User = require('../model/userModel')
const Address = require('../model/addressModel')


const cartLoad = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const product = await Product.find()
        console.log(user_id);
        // Ensure that the populate method is correctly used
        const cartData = await Cart.find({ user: user_id }).populate({
            path: 'products.productId',
            model: 'Product', // Assuming 'Product' is the model name for your products
            select: 'price' // Select only the 'price' field
        });
        console.log("cartDataaaaaaaaaa", cartData);

        let total = 0;
        let cartCount = 0;

        if (cartData && cartData.length > 0) {
            for (let cart of cartData) {
                for (let product of cart.products) {
                    // Safeguard to check if product is not null before proceeding
                    if (!product || !product.productId) {
                        console.log("Product or Product ID is missing or invalid.");
                        continue; // Skip this iteration if product or productId is missing
                    }

                    const productId = product.productId;
                    console.log(productId);
                    // Attempt to find the product and handle the case where it's not found
                    const productData = await Product.findById(productId).select('price').catch(() => null);
                    if (!productData) {
                        // If the product is not found, skip this iteration
                        continue;
                    }
                    console.log(productData);
                    const count = product.count;
                    const productPrice = productData.price || 0;
                    const totalPrice = productPrice * count;
                    total += totalPrice;
                    product.totalPrice = totalPrice;
                    cartCount += count;
                }
            }

            const subTotal = total;
            const shippingCharge = total < 1700 ? 90 : 0;
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
        const user_id = req.session.user_id;
        const product_id = req.body.productId;
        const quantity = req.body.quantity;

        const productData = await Product.findById(product_id).populate('category');
        const userData = await User.findOne({ _id: user_id });

        const count = quantity ? parseInt(quantity) : 1;
        if (!user_id) {
            return res.json({
                login: true,
                message: 'Please log in to add products to your cart.',
            });
        }
        console.log('quantityy',productData.quantity);
        if(productData.quantity<quantity){
            return res.json({stock:true})
        }

        const productPrice = productData.price * count;

        let productDetails = {
            productId: product_id,
            productName: productData.name,
            price: productData.price,
            totalPrice: productPrice,
            count: count,
            image: productData.images.image1,
        };

        let cart = await Cart.findOne({ user: user_id });

        if (!cart) {
            cart = await Cart.create({
                user: user_id,
                userName: userData.name,
                products: [productDetails],
            });
            return res.json({ success: true, newProduct: true });
        }

        const existingProductIndex = cart.products.findIndex(
            p => p.productId.toString() === product_id.toString()
        );

        if (existingProductIndex !== -1) {
            // Product already exists in the cart, update its quantity and totalPrice
            cart.products[existingProductIndex].count += count;
            cart.products[existingProductIndex].totalPrice += productPrice;
        } else {
            // Product does not exist in the cart, add it
            cart.products.push(productDetails);
        }

        await cart.save();
        
        return res.json({ success: true, newProduct: true });
    } catch (e) {
        console.log("Error while adding to cart", e);
        res.status(500).json({ error: "An error occurred while adding to cart." });
    }
};


const removeCartItem = async (req, res) => {
    try {
        console.log("remove");
        const userId = req.session.user_id
        const productId = req.body.product
        console.log(userId, "user", productId, "product");
        const cartData = await Cart.findOne({ user: userId })
        console.log(cartData, "cartdata");
        if (cartData) {
            await Cart.findOneAndUpdate(
                { user: userId },
                {
                    $pull: { products: { productId: productId } },
                },
            )
            res.json({ success: true })
        }
        console.log(cartData);
    } catch (error) {
        console.error('Error removing item from cart:', error)
        res.status(500).render('500')
    }
}


const updateCart = async (req, res) => {
    try {
        const counts = req.body;
        console.log(counts,"price and count");

        for (const count of counts) {



            const product = await Product.findById(count.productId).select('quantity price');
            console.log(product, "quaaantiyytyyyyyyyyyyyyy");

            if (!product || count.newQuantity > product.quantity) {
                return res.json({ stock:true });
            }
            const cartData = await Cart.find({user:req.session.user_id})
            console.log(cartData.products,"before updating");
            const newTotalPrice = product.price * count.newQuantity;
            const updateResult = await Cart.updateOne(
                { 'user': req.session.user_id, 'products.productId': count.productId },
                { $set: { 'products.$.count': count.newQuantity },
                'products.$.totalPrice': newTotalPrice  }
            );
            
            console.log(cartData.products,"after updating");
            console.log("Update result:", updateResult);


        }
        res.json({ success:true });
    } catch (e) {
        console.log("while updating the cart ", e);
    }
};

const checkoutLoad = async (req, res) => {
    try {

        const user_id = req.session.user_id
        const cartData = await Cart.findOne({ user: user_id }).populate('products.productId')
        console.log(cartData,"huhjknnnnnnnnnnnnnnnnnnnh")


        if (cartData) {



            let addressData = await Address.findOne({ user: user_id }).populate("address")
            console.log(addressData, "cvghgcgcv")

           
            // console.log(cartData.products.map(product => product.productId));
            console.log(cartData.products,"here the cart products");
            console.log('productid',cartData.products.productId);

            const subTotal = cartData.products.reduce((acc, val) => {
                if (val && val.totalPrice) {
                    return acc + val.totalPrice;
                }
                return acc;
            }, 0);

            console.log('subtotal',subTotal);
         let totalAmount = subTotal 

            let shippingAmount = 0
            shippingAmount = subTotal<1700?90:0;

            if (subTotal < 1700) {
              shippingAmount = 90
            } else {
              shippingAmount = 0
            }
            if (shippingAmount > 0) {
                totalAmount += shippingAmount
              }
   

              console.log(totalAmount);
             
           
           

            

            res.render("checkout", { addressData, cart: cartData, subTotal: subTotal,total:totalAmount, user:user_id,shippingAmount })
        } else {
            res.redirect('/')
        }


    } catch (error) {
        console.log(error.message);
        res.render('500Error')
    }
}

module.exports = {
    cartLoad,
    addToCart,
    updateCart,
    checkoutLoad,
    removeCartItem,

}