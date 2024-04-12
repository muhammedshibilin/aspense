const Offer = require("../model/offerModel");
const Product = require("../model/productModel");
const Category = require("../model/categoryModel");


const offerLoad = async (req, res) => {
  try {
    console.log('SEA',req.query.search);
     const page = parseInt(req.query.page) || 1;
     const limit = 6;
     const skip = (page - 1) * limit;
     // Ensure searchQuery is a string, default to an empty string if not provided
     const searchQuery = req.query.search ? req.query.search : '';
     let query = {};
 
     // Check if searchQuery is not an empty string before using it in the query
     if (searchQuery) {
       query.name = { $regex: searchQuery, $options: 'i' };
     }
 
     const totalOffers = await Offer.countDocuments(query);
     const totalPages = Math.ceil(totalOffers / limit);
 
     const offerData = await Offer.find(query).skip(skip).limit(limit);
     const productData = await Product.find({ is_block: 0 });
     const categoryData = await Category.find({ is_block: 0 });
     res.render("offer", {
       offerData,
       productData,
       categoryData,
       currentPage: page,
       totalPages: totalPages,
       searchQuery: searchQuery,
     });
  } catch (e) {
     console.log("while loading offer", e);
  }
 };
 

const addOffer = async (req, res) => {
  try {
    console.log("body:", req.body);
    let { category, product } = req.body;
    let existingProductOffer = false;
    let existingCategoryOffer = false;

    if (product) {
      const existingProductOffers = await Offer.find({ productId: product });
      if (existingProductOffers.length > 0) {
        existingProductOffer = true;
      }
    }

    if (category) {
      console.log("sdajfkl;adjsf;lkadj");
      const existingCategoryOffers = await Offer.find({ categoryId: category });
      if (existingCategoryOffers.length > 0) {
        existingCategoryOffer = true;
      }
    }

    if (existingProductOffer) {
      console.log(
        "jfakjdhkjsadlkjhajkashdkljsahdfkjahsdfljkkasdhflkadhfkauhsd"
      );
      return res.status(200).json({
        productExist: true,
        message: "An offer for this product is  already exists.",
        existingProductOffer: existingProductOffer,
        existingCategoryOffer: existingCategoryOffer,
      });
    }
    if (existingCategoryOffer) {
      console.log("jfakjdhkj");
      return res.status(200).json({
        categoryExist: true,
        message: "An offer for this  category is already exists.",
        existingProductOffer: existingProductOffer,
        existingCategoryOffer: existingCategoryOffer,
      });
    }

    if (product) {
      const data = new Offer({
        name: req.body.name,
        productId: product,
        discountAmount: req.body.amount,
        startDate: new Date(),
        endDate: req.body.exprDate,
      });

      const offerData = await data.save();
      if (offerData) {
        console.log("oaredededata:", offerData);
        res.json({ productSuccess: true });
      }
    }

    if (category) {
      console.log("caregoroyyryyory");
      const data = new Offer({
        name: req.body.name,
        categoryId: category,
        discountAmount: req.body.amount,
        startDate: new Date(),
        endDate: req.body.exprDate,
      });

      const offerData = await data.save();
      if (offerData) {
        console.log("oaredededata:", offerData);
        res.json({ categorySuccess: true });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const editOfferLoad = async (req, res) => {
  try {
    const offerId = req.query._id;
    console.log("id", offerId);
    // Populate both categoryId and productId fields
    const offerData = await Offer.findById(offerId)
      .populate("categoryId")
      .populate("productId");
    console.log("saf", offerData);

    // Always fetch the full list of categories and products
    const categoryData = await Category.find({});
    const productData = await Product.find({});

    // Determine if the offer is for a category or a product
    let selectedCategoryId =
      offerData.categoryId && offerData.categoryId.length > 0
        ? offerData.categoryId[0]._id
        : null;
    let selectedProductId =
      offerData.productId && offerData.productId.length > 0
        ? offerData.productId[0]._id
        : null;

    res.render("editOffer", {
      offer: offerData,
      categoryData: categoryData,
      productData: productData,
      selectedCategoryId: selectedCategoryId,
      selectedProductId: selectedProductId,
    });
  } catch (error) {
    console.log(error.message);
    res.render("500Error");
  }
};

const editOffer = async (req, res) => {
  try {
    console.log("boduyyyyyyy", req.body);
    const offerId = req.body.offerId;
    console.log("start");
    console.log("id", offerId);
    const category = req.body.categoryId;
    const product = req.body.productId;

    if (product) {
      await Offer.findOneAndUpdate(
        { _id: offerId },
        {
          name: req.body.name,
          productId: product,
          discountAmount: req.body.offerAmount,
          startDate: req.body.activeDate,
          endDate: req.body.expireDate,
        }
      );

      res.json({ success: true });
    } else {
      await Offer.findOneAndUpdate(
        { _id: offerId },
        {
          name: req.body.name,
          categoryId: category,
          discountAmount: req.body.offerAmount,
          startDate: req.body.activeDate,
          endDate: req.body.expireDate,
        }
      );
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error, "while editing offer");
    res.render("500");
  }
};

const blockOffer = async (req, res) => {
  try {
    const offerId = req.body.offerId;
    console.log("ajf", offerId);
    const offerData = await Offer.findById(offerId);

    if (offerData.is_block == 0) {
      await Offer.findOneAndUpdate({ _id: offerId }, { $set: { is_block: 1 } });
    } else {
      await Offer.findOneAndUpdate({ _id: offerId }, { $set: { is_block: 0 } });
    }
    res.json({ block: true });
  } catch (error) {
    console.log(error.message);
    res.render("500Error");
  }
};

const deleteOffer = async (req, res) => {
  try {
    const offerId = req.body.offerId;
    console.log("fahjdg", offerId);
    await Offer.findOneAndDelete({ _id: offerId });
    res.json({ delete: true });
  } catch (error) {
    console.log(error.message);
    res.render("500Error");
  }
};

module.exports = {
  offerLoad,
  addOffer,
  editOfferLoad,
  editOffer,
  blockOffer,
  deleteOffer,
};
