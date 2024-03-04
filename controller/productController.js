const Product = require("../model/productModel")
const Category = require('../model/categoryModel')
const Review = require('../model/reviewModel')
const sharp = require('sharp')
const fs = require('fs')
const category = require("../model/categoryModel")



const productLoad = async (req, res) => {
  try {

    const productData = await Product.find().populate("category")
    const categoryData = await Category.find()
    res.render('products', {
      productData,
      categoryData
    })
  } catch (error) {
    console.log(error);
  }
}

const addProductLoad = async (req, res) => {
  try {
    const categoryData = await Category.find()
  
    res.render("addProducts", { categoryData })
  } catch (error) {
    console.log(error);
  }

}


const addProduct = async (req, res) => {
  try {

    const categoryName = req.body.category
   

    const category = await Category.findOne({ _id: categoryName[0] });


    const files = req.files;

    const img = [
      files.image1[0].filename,
      files.image2[0].filename,
      files.image3[0].filename,
      files.image4[0].filename
    ];

    for (let i = 0; i < img.length; i++) {
      await sharp('C:/aspens/public/images/product/original/' + img[i])
        .resize({ width: 450, height: 500 })
        .toFile('C:/aspens/public/images/product/sized/' + img[i])

    }

    const product = new Product({
      name: req.body.name,
      category: category.id,
      quantity: req.body.quantity,
      price: req.body.price,
      "images.image1": files.image1[0].filename,
      "images.image2": files.image2[0].filename,
      "images.image3": files.image3[0].filename,
      "images.image4": files.image4[0].filename,
      discription: req.body.description,
      size: req.body.size,
      offer:req.body.offer,
      Is_blocked: true
    });


   console.log(req.body.description)
    const productData = await product.save();


    res.redirect('/admin/product')

  } catch (error) {
    console.log(error);
    res.status(500).render('500');
  }
};
const editProductLoad = async (req, res) => {
  try {
   const id = req.query._id
    const productData = await Product.findOne({ _id: id }).populate("category")
    

    const categoryData = await Category.find({ is_block: true })

    res.render("editProduct", { productData, categoryData })
  } catch (error) {
    console.log(error);
  }
}

const editProduct = async (req, res) => {
  try {
    const _id = req.query._id
   
    const imagesFiles = await req.files
    const productData = await Product.findOne({ _id: _id })
    const categoryData = await Category.findOne({ _id: req.body.category[0] })
    
    const img = [
      imagesFiles.image1 ? imagesFiles.image1[0].filename : productData.images.image1,
      imagesFiles.image2 ? imagesFiles.image2[0].filename : productData.images.image2,
      imagesFiles.image3 ? imagesFiles.image3[0].filename : productData.images.image3,
      imagesFiles.image4 ? imagesFiles.image4[0].filename : productData.images.image4,
    ];


    for (let i = 0; i < img.length; i++) {
      await sharp('C:/aspens/public/images/product/original/' + img[i])
      .resize({ width: 450, height: 500 })
      .toFile('C:/aspens/public/images/product/sized/' + img[i])
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
    

    res.redirect('/admin/product')

  } catch (error) {
    console.log(error);
  }
}


const blockProduct = async(req,res)=>{
  try {

    const  product_id =  req.query._id
    const productData = await Product.findOne({_id:product_id})
    
    if(productData.Is_blocked==true){
      console.log('true');
     await Product.findByIdAndUpdate({_id:product_id},{$set:{Is_blocked:false}}) 
    }else{ 
      console.log('false'); 
      await Product.findByIdAndUpdate({_id:product_id},{$set:{Is_blocked:true}})
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





module.exports = {
  productLoad,
  addProductLoad,
  blockProduct,
  deleteProduct,
  addProduct,
  editProductLoad,
  editProduct,
  // reviewProduct
}