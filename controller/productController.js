const Product = require("../model/productModel")
const Category = require('../model/categoryModel')
const Offer = require('../model/offerModel')
const Cart = require('../model/cartModel')

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const { trusted } = require("mongoose")




const productLoad = async (req, res) => {
  try {
       const page = parseInt(req.query.page) || 1;
       const limit = 6;
       const skip = (page - 1) * limit;
 
   
       const searchQuery = req.query.search;
       let query = {};
       if (searchQuery) {
           const isNumeric = !isNaN(parseFloat(searchQuery)) && isFinite(searchQuery);
        
           query.name = { $regex: searchQuery, $options: 'i' };
       
           if (isNumeric) {
              
               const priceQuery = parseFloat(searchQuery);
               query.price = priceQuery;
           }
       }
 
    
       const totalProducts = await Product.countDocuments(query);
       const totalPages = Math.ceil(totalProducts / limit);
 
      
       const productData = await Product.find(query)
           .skip(skip)
           .limit(limit)
           .populate("category")
         
 
       const categoryData = await Category.find();
 

       res.render("products", {
           productData,
           categoryData,
           currentPage: page,
           totalPages: totalPages,
           searchQuery: searchQuery 
       });
  } catch (e) {
       console.log(e, "error in product load");
       res.status(500).send("Error loading products");
  }
 };

const addProductLoad = async (req, res) => {
  try {
    const categoryData = await Category.find({is_block:0})
    res.render("addProducts", { categoryData})
  } catch (error) {
    console.log(error);
  }

}


const addProduct = async (req, res) => {
  try {
    const categoryName = req.body.category;
    const category = await Category.findOne({ _id: categoryName });
    
    const imageDir = 'public/images/product/original';
    if (!fs.existsSync(imageDir)) {
      await fs.mkdirSync(imageDir, { recursive: true });
    }

    const images = req.files.map(file => file.filename);
  console.log('files',req.files
);
  
    await Promise.all(req.files.map(async file => {
      const oldPath = file.path;
      const newPath = path.join(imageDir, file.filename);
      await fs.promises.rename(oldPath, newPath);
    }));

    const product = new Product({
      name: req.body.name,
      category: category.id,
      quantity: req.body.quantity,
      price: req.body.price,
      images: images,
      description: req.body.description,
      date: new Date(),
      Is_block: 0 
    });

    try {
      const productData = await product.save();
      console.log('Product added successfully:', productData.images);
      res.json({ success: true });
    } catch (err) {
      console.log('Error in adding product:', err);
      res.status(500).json({ error: 'An error occurred while adding the product', details: err.message });
    }
  } catch (e) {
    console.log('Error while adding product:', e);
    res.status(500).json({ error: 'An error occurred while adding the product' });
  }
};







const editProductLoad = async (req, res) => {
  try {
   const id = req.query._id
    const productData = await Product.findOne({ _id:id }).populate("category")
    const offerData = await Offer.find({is_block:0})

  
    

    const categoryData = await Category.find({ is_block: 0 })

    res.render("editProduct", { productData, categoryData,offerData })
  } catch (error) {
    console.log(error);
  }
}

const editProduct = async (req, res) => {
  try {
     const _id = req.body.productId;
     const categoryData = await Category.findOne({ _id: req.body.category });
     
     const imageDir = 'public/images/product/original';
     if (!fs.existsSync(imageDir)) {
       await fs.mkdirSync(imageDir, { recursive: true });
     }
 
     const images = req.files.map(file => file.filename);
     await Promise.all(req.files.map(async file => {
       const oldPath = file.path;
       const newPath = path.join(imageDir, file.filename);
       await fs.promises.rename(oldPath, newPath);
     }));
 
     const update = {
      $set: {
         name: req.body.name,
         category: categoryData._id,
         quantity: req.body.quantity,
         price: req.body.price,
         description: req.body.description
      }
     };
     
     if (images && images.length > 0) {
      update.$push = { images: { $each: images } };
     }
         
     await Product.findByIdAndUpdate(
       { _id: _id },
       update
     );
     
     res.json({success: true});
  } catch (error) {
     console.log(error);
  }
 }
 

const blockProduct = async(req,res)=>{
  try {

    const  product_id =  req.query._id
    const productData = await Product.findOne({_id:product_id})
    
    if(productData.is_block==0){
      console.log('true');
     await Product.findByIdAndUpdate({_id:product_id},{$set:{is_block:1}}) 
    }else{ 
      console.log('false'); 
      await Product.findByIdAndUpdate({_id:product_id},{$set:{is_block:0}})
    }

    res.redirect('/admin/product')

  } catch (error) {
      console.log(error.message);
      res.render('500')
  }
}

const deleteProduct = async (req,res) => {
  try {
    const  product_id =  req.query._id
    const productData =await Product.findOne({_id:product_id})
if(productData.images){
  const imageValues = Object.values(productData.images)
 
    imageValues.forEach( value => {
      const imagePathOriginal = `public/images/product/original/${value}`
  

      try {
        fs.unlinkSync(imagePathOriginal)
      } catch (e) {
        console.log("error to delete images",e);
      }
    } )
}


await Product.findByIdAndDelete({_id:product_id})

const carts = await Cart.find({ 'products.productId': product_id });
for (const cart of carts) {
  cart.products = cart.products.filter(product => product.productId.toString() !== product_id);
  await cart.save();
}

res.redirect('/admin/product')

  } catch (e) {
    console.log(e,"product deleting have an error occured")
  }
}

const deleteImage = async (req, res) => {
  try {
     const product_id = req.body.id;
     const imageNumber = req.body.imageNumber;
     console.log('num',imageNumber);
 

     const productData = await Product.findOne({ _id: product_id });
     if (!productData) {
       return res.status(404).json({ success: false, message: 'Product not found.' });
     }
 

     const updatedProduct = await Product.updateOne(
       { _id: product_id },
       { $pull: { images: { $eq: productData.images[imageNumber - 1] } } }
     );
     console.log('updarted',updatedProduct);
     console.log('log',updatedProduct.modifiedCount);
 
     if (updatedProduct.modifiedCount > 0) {
  
       const reorderedImages = productData.images.filter((_, index) => index !== imageNumber - 1);

       const finalUpdate = await Product.updateOne(
         { _id: product_id },
         { $set: { images: reorderedImages } }
       );
 
       console.log('Image deleted successfully:', finalUpdate);
       res.json({ success: true, message: 'Image deleted successfully!' });
     } else {
       console.log('No image was deleted.');
       res.json({ success: false, message: 'No image was deleted. The product might not exist or the image number is incorrect.' });
     }
  } catch (error) {
     console.log('while deleting the image', error);
     res.status(500).json({ success: false, message: 'An error occurred while deleting the image.' });
  }
 };





module.exports = {
  productLoad,
  addProductLoad,
  blockProduct,
  deleteProduct,
  addProduct,
  editProductLoad,
  editProduct,
  deleteImage
}