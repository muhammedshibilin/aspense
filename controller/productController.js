const Product = require("../model/productModel")
const Category = require('../model/categoryModel')
const Offer = require('../model/offerModel')
const Review = require('../model/reviewModel')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const category = require("../model/categoryModel")
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

    // Ensure image directory exists (adjust path if needed)
    const imageDir = 'C:/aspense/public/images/product/original';
    if (!fs.existsSync(imageDir)) {
      await fs.mkdirSync(imageDir, { recursive: true });
    }

    const images = req.files.map(file => file.filename); // Extract filenames

    // Move uploaded images to the specified folder (using fs.promises.rename)
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
      Is_block: 0 // Ensure consistent capitalization
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
    const _id = req.body.productId
    console.log("id",_id)
 
   
    const imagesFiles = {
      image1: req.files['imageFile1'],
      image2: req.files['imageFile2'],
      image3: req.files['imageFile3'],
      image4: req.files['imageFile4'],
  };
    console.log('fle',imagesFiles);
    const productData = await Product.findOne({ _id: _id })
    
    console.log(productData,"idaan produc")
    console.log(req.body.category)
    const categoryData = await Category.findOne({ _id: req.body.category })
    
    const img = [
      imagesFiles.image1 ? imagesFiles.image1[0].filename : productData.images.image1,
      imagesFiles.image2 ? imagesFiles.image2[0].filename : productData.images.image2,
      imagesFiles.image3 ? imagesFiles.image3[0].filename : productData.images.image3,
      imagesFiles.image4 ? imagesFiles.image4[0].filename : productData.images.image4,
    ];

    console.log('img',img);


    for (let i = 0; i < img.length; i++) {
      await sharp('C:/aspense/public/images/product/original/' + img[i])
      .resize({ width: 450, height: 500 })
      .toFile('C:/aspense/public/images/product/sized/' + img[i])
    }

    await Product.findByIdAndUpdate(
      { _id: _id },
      {
        $set: {
          name: req.body.name,
          category: categoryData._id,
          quantity: req.body.quantity,
          price: req.body.price,
          "images.image1": img[0],
          "images.image2": img[1],
          "images.image3": img[2],
          "images.image4": img[3],
          description: req.body.discription,
          size:req.body.size,
          offer:req.body.offer

        }
      }
    )
    res.json({success:true})
    

   

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
      const imagePathSized = `public/images/product/sized/${value}`

      try {
        fs.unlinkSync(imagePathOriginal)
        fs.unlinkSync(imagePathSized)
      } catch (e) {
        console.log("error to delete images",e);
      }
    } )
}


await Product.findByIdAndDelete({_id:product_id})
res.redirect('/admin/product')


  } catch (e) {
    console.log(e,"product deleting have an error occured")
  }
}

const deleteImage = async (req,res) => {
  try {
    console.log('image ',req.body.imageNumber);
    const product_id = req.body.id
    const imageNumber = req.body.imageNumber
    const imageField = `images.image${imageNumber}`;
    console.log('dsa',imageField);


    const productData = await Product.updateOne({_id:product_id},{$unset:{[imageField]:""}})

    if (productData.nModified > 0) {
      console.log('Image deleted successfully:', productData);
      res.json({ success: true, message: 'Image deleted successfully!' });
  } else {
      console.log('No image was deleted.');
      res.json({ success: false, message: 'No image was deleted. The product might not exist or the image number is incorrect.' });
  }
 

    
    
  } catch (error) {
    console.log('while deleting the image',error);
  }
}





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