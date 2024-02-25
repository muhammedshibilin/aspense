const Product = require("../model/productModel")
const Category = require('../model/categoryModel')
const sharp = require('sharp')


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
    console.log(categoryData);
    res.render("addProducts", { categoryData })
  } catch (error) {
    console.log(error);
  }

}


const addProduct = async (req, res) => {
  try {

    const categoryName = req.body.category
    console.log(categoryName);
    // const offerData = offer != 0 ? await offer.findOne({ name: offer }) : 0;
    const category = await Category.findOne({ _id: categoryName[0] });

    if (!category) {
      // Handle the case where no category is found
      return res.status(404).send("Category not found");
    }

    const files = req.files;

    const img = [
      files.image1[0].filename,
      files.image2[0].filename,
      files.image3[0].filename
    ];

    for (let i = 0; i < img.length; i++) {
      await sharp('C:/aspens/public/images/product/original/' + img[i])
        .resize({ width: 500, height: 500 })
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
      discription: req.body.discription,
      size:req.body.size,
      Is_blocked: true
    });

    const productData = await product.save();

    // Handle successful creation of the product
    res.redirect('/admin/product')

  } catch (error) {
    console.log(error);
    res.status(500).render('500');
  }
};

module.exports = {
  productLoad,
  addProductLoad,
  addProduct
}