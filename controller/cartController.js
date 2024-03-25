const Cart = require('../model/cartModel')
const Product = require('../model/productModel')
const User = require('../model/userModel')
const Address = require('../model/addressModel')






const addToCart = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        if (!user_id) {
        console.log("no user Id")
            return res.json({
                login: true,
                message: 'Please log in to add products into your cart.',
            });
        }
      
        const product_id = req.body.productId;
        let quantity = req.body.quantity;
        let cart = await Cart.findOne({ user: user_id }).populate('products.productId');
        console.log('productId',product_id);
        console.log('quantity from body',quantity);
        console.log('userr',user_id);
    

        const productData = await Product.findById(product_id).populate("offer");
        console.log('productData',productData);
        const userData = await User.findOne({ _id: user_id });

        let count = 1; 
        if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
            count = parseInt(quantity);
        }
      console.log('count',count);
        console.log('product quantityy',productData.quantity);
        if(productData.quantity<quantity){
            return res.json({stock:true})
        }

        let productPrice

        

        if( productData.offer.discountAmount !=0 && productData.offer.is_block==0 && productData.offer.startDate <= new Date() && productData.offer.endDate >= new Date){
            let discount = productData.price*(productData.offer.discountAmount/100)
            console.log('discount',discount);
            productPrice = (productData.price-discount)*count
            console.log('is offer',productPrice);
        }else{
            productPrice = productData.price*count
            console.log('no offer',productPrice);
        }
    
        
        let productDetails = {
            productId: product_id,
            productName: productData.name,
            price: productData.price,
            totalPrice: productPrice,
            count: count,
            image: productData.images.image1,
        };

       
        const subTotal = cart ? cart.products.reduce((acc,val)=>acc+val.totalPrice,0) : 0
        const shippingAmount = subTotal>1500?0:90

        if (!cart) {
            cart = await Cart.create({
                user: user_id,
                userName: userData.name,
                products: [productDetails],
                shippingAmount:shippingAmount?shippingAmount:0
            });
            return res.json({ success: true, newProduct: true });
        }

        const existingProductIndex = cart.products.findIndex(
            p => p.productId.toString() === product_id.toString()
        );

        if (existingProductIndex !== -1) {
         
            return res.json({  exist: true });
        }
        cart.products.push(productDetails);
        const updated = await cart.save();
        console.log('updatedddddddd',updated);
        
        return res.json({ success: true, newProduct: true });
    } catch (e) {
        console.log("Error while adding to cart", e);
        res.status(500).json({ error: "An error occurred while adding to cart." });
    }
};


const cartLoad = async (req, res) => {
    try {
          
        const user_id = req.session.user_id
        const cartData =  await Cart.findOne({user:user_id}).populate('products.productId')
        const subTotal = cartData ? cartData.products.reduce((acc,val)=>acc+val.totalPrice,0) : 0

        if(cartData){
              
          const shippingCharge = subTotal>1500?0:90
          const grandTotal = subTotal+shippingCharge
          res.render('cart',{cart:cartData,subTotal,user:user_id,grandTotal,shippingCharge})

        }else{
          res.render('cart',{user:user_id,cart:[]})
        }
    } catch (e) {
        console.log("error while loading cart", e);
        res.status(500).send("Error loading cart");
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
        const product_id = req.body.productId;
        const user_id = req.session.user_id;
        const increment = req.body.count;

        const cartData = await Cart.findOne({ user: user_id });
        const product = cartData.products.find(obj => obj.productId.toString() === product_id);
        const productData = await Product.findById(product_id).populate("offer");
        
        let total;

        if (product && (increment > 0 && product.count + increment <= productData.quantity || increment < 0)) {
                await Cart.findOneAndUpdate(
                { user: user_id, 'products.productId': product_id },
                { $inc: { 'products.$.count': increment } }
            );
        
            let updatedCount = product.count + increment;
            total = productData.price * updatedCount;

            if (productData.offer && productData.offer.discountAmount != 0 && productData.offer.is_block == 0 && productData.offer.startDate <= new Date() && productData.offer.endDate >= new Date) {
                let discount = productData.price * (productData.offer.discountAmount / 100);
                total = (productData.price - discount) * updatedCount;
            }
        
                 await Cart.findOneAndUpdate(
                { user: user_id, 'products.productId': product_id },
                { $set: { 'products.$.totalPrice': total } },
                { new: true } 
            );
        } else {
            res.json({ stock: true });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Error updating cart");
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