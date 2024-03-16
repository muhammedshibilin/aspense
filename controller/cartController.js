const Cart = require('../model/cartModel')
const Product = require('../model/productModel')
const User = require('../model/userModel')
const Address = require('../model/addressModel')



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
                    console.log(productId);
                    const productData = await Product.findById(productId).select('price');
                    console.log(productData)
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
       
        const user_id = req.session.user_id;
        if (!user_id) {
            return res.json({
                login: true,
                message: 'Please log in to add products to your cart.',
            });
        }
        const product_id = req.body.productId;
        const quantity = req.body.quantity
        
        const productData = await Product.findById(product_id).populate('category');
        if(quantity>productData.quantity){
            res.json({stock:true})

        }
  
        const userData = await User.findOne({ _id: user_id });

        
       
        const count = req.body.quantity ? parseInt(req.body.quantity) : 1;
        console.log(count,userData,"user enteredd count");
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

       


        existCartData.products.push(products);
        await existCartData.save();
        return res.json({ success: true, newProduct: true });

    } catch (e) {
        console.log("while adding to cart", e);
        res.status(500).render('500')
    }
};

const removeCartItem = async (req, res) => {
    try {
        console.log("remove");
      const userId = req.session.user_id
      const productId = req.body.product
      console.log(userId,"user",productId,"product");
      const cartData = await Cart.findOne({ user: userId })
      console.log(cartData,"cartdata");
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
        console.log(counts);
     
        for (const count of counts) {
           

          
            const product = await Product.findById(count.productId).select('quantity');
            console.log(product, "quaaantiyytyyyyyyyyyyyyy");

            if (!product || count.newQuantity > product.quantity) {
                return res.status(400).json({ message: 'out of  stock! will be update soon', error: true });
            }
            const updateResult = await Cart.updateOne(
                { 'products.productId': count.productId },
                { $set: { 'products.$.count': count.newQuantity } }
                
            );
            console.log("Update result:", updateResult);
          
           
        }
        res.json({ message: 'Cart updated successfully' });
    } catch (e) {
        console.log("while updating the cart ", e);
    }
};

const checkoutLoad = async(req,res)=>{
    try {
  
      const user_id = req.session.user_id
      const cartData = await Cart.findOne({user:user_id}).populate('products.productId')
     
      if(cartData){
  
        
    
        let addressData = await Address.findOne({user:user_id}).populate("address")
        console.log(addressData,"cvghgcgcv")
        
        addressData = addressData == null ? {user:req.session.user_id,_id:1,address:[]} : addressData
        console.log(addressData,"utgytfgytfytfghvgfgfhgfhtfhgtfgyf")
       
        const subTotal = cartData.products.reduce((acc,val)=>acc+val.totalPrice,0)
        const stock = cartData.products.filter((val,ind)=>val.productId.quantity>0)
        const total = subTotal+cartData.shippingAmount
    
        if(stock.length!=cartData.products.length){
          res.json({stock:false})
        }
    
        res.render("checkout",{addressData,cart:cartData,subTotal:subTotal,total:total,user_id})
      }else{
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