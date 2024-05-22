const User = require("../model/userModel")
const Product = require('../model/productModel')
const Cart = require('../model/cartModel')
const Category = require('../model/categoryModel')
const Address = require('../model/addressModel')
const Review = require('../model/reviewModel')
const Offer = require("../model/offerModel")
const Order = require('../model/orderModel')
const bcrypt = require("bcryptjs")
const speakeasy = require('speakeasy');
const { sendVerifyMail } = require('../utils/sendVerifyMail')



const loadHome = async (req, res) => {
    try {
        const user = req.session.user_id
        const cartData = await Cart.find({user:user}).populate({
            path:"products",
            model:"Product",
            match:{is_block:0}
        })
        const productData = await Product.find({ is_block: 0 }).populate({
            path: "category",
            match: { is_block: 0 }
        })
    
        const categoryData = await Category.find({is_block:0})
        if (!productData) {
            return res.render("userHome", { productData: [], user,cartData});
        }
        res.render("userHome", { productData, user,categoryData ,cartData})
    } catch (error) {
        console.log(error);
    }
}

const aboutLoad = async(req,res) => {
    try {
        const user = await User.findOne({_id:req.session.user_id})
        res.render("about",{user:user})
    } catch (error) {
      console.log('while loading the about',error);
      res.status(200).render("500")  
    }
}
const contactLoad = async(req,res) => {
    try {
        const user = await User.findOne({_id:req.session.user_id})
        res.render("contact",{user:user})
    } catch (error) {
      console.log('while loading the about',error);
      res.status(200).render("500")  
    }
}

const loadSignup = async (req, res) => {
    try {
        const user = req.session.user_id
        res.render('signUp', { user })
    } catch (error) {
        console.log(error);
    }
}

const failureLoad = async (req, res) => {
    try {
        res.redirect('/sign-up')
    } catch (error) {
        console.log(error);
    }
}



let otp

function generateReferralCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

const insertUser = async (req, res) => {
    try {
        const { name, email, mobile, password,referral} = req.body
        const emailCheck = await User.findOne({ email: req.body.email })
        console.log('bod',req.body);
        let reffered = false
        if (emailCheck) {
            return res.json({ emailExist: true })
        }
        
        if (referral) {
          const ExistReferral = await User.findOne({ referral: referral});
          reffered = true
          if (ExistReferral) {
            const data = {
              amount: 101,
              date: Date.now(),
              direction: 'Credit',  
            };
            const existingreferral = await User.findOneAndUpdate({ referral: referral}, { $inc: { wallet: 101 }, $push: { walletHistory: data } });
          } else {
            return res.json({invalidLink:true});
          }
        }
       console.log('os',changePassword);
        const passwordHash = await bcrypt.hash(password, 10)
        const user = new User({
            name: name,
            email: email,
            mobile: mobile,
            password: passwordHash,
            referral: generateReferralCode(), 
            wallet:reffered==true? 51 : 0,
            walletHistory: reffered==true ? [{
                amount: 51,
                date: new Date(),
                direction: 'Credited'
            }] : [],
            is_verified: 0,
            is_admin: 0
        });

        const userData = await user.save()


        otp = Math.floor(Math.random() * 9000) + 1000
        req.session.otp = otp;
        req.session.otpTimestamp = Date.now();
       

        req.session.email = req.body.email;
        req.session.password = passwordHash;
        req.session.name = req.body.name;
        req.session.mobile = req.body.mobile;

        console.log("otp:---",otp)

        sendVerifyMail(
            req.body.name,
            req.body.email,
            otp
        )
     
    
        res.json({success:true})


    } catch (error) {
        console.log(error);
        res.status('500').render("500");
    }
}



const loadLogin = async (req, res) => {
    try {
        const user = req.session.user_id
        res.render('login', { user })
    } catch (error) {
        console.log(error);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        const userData = await User.findOne({ email: email })

        if(!userData){
           return res.json({user:true})
        }

        if (userData.is_block == 0) {
            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {
                console.log(passwordMatch, "1");
                req.session.user_id = userData._id;
                return res.json({ success: true })
            } else {
                console.log(passwordMatch, "2");
                return res.json({ success: false })

            }
        } else {
            console.log('hailiiiii');

            return res.json({ error: true, error: "you are blocked,please contact for more information" })
        }
    } catch (e) {
        console.log(e, "error occured in verify login");
        res.status(500).json({ success: false, error: "Internal server error" });
    }
}

async function findBiggestOfferAmount(productId) {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            console.error("Product not found:", productId);
            return 0;
        }
        const applicableOffers = await Offer.find({
            $or: [
                { productId: productId },
                { categoryId: { $in: [product.category] } },
            ],
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            is_block: 0,
        });
        console.log('amio',applicableOffers);

      
        let biggestOfferAmount = 0;
        if (applicableOffers.length > 0) {
            biggestOfferAmount = Math.max(...applicableOffers.map(offer => offer.discountAmount));
        }
        return biggestOfferAmount;
    } catch (error) {
        console.error("Error finding the biggest offer amount:", error);
        return 0; 
    }
}

const loadProductDetails = async (req, res) => {
    try {
        const productId = req.query._id


        const user_id = req.session.user_id
        const productData = await Product.findOne({ _id: productId }).populate("category")
        const biggestOfferAmount = await findBiggestOfferAmount(productData._id);
        console.log('offerma',biggestOfferAmount)

        const productPrice = productData.price
        console.log('paid',productPrice);
        const offerApplied = Math.floor(productData.price*(biggestOfferAmount/100))
        const offerAppliedPrice = productData.price-offerApplied

        
        const categoryData = await Category.find()
        const relatedImg = await Product.find({ category: productData.category._id, _id: { $ne: productData._id } }).limit(8)

        const reviews = await Review.find({ productId: req.query._id })

        res.render('product-details', {
            productData,
            categoryData,
            relatedImg,
            reviews,
            user: user_id,
            offerAppliedPrice,
            biggestOfferAmount
        })
    } catch (error) {
        console.log("while loading the product details",error);
        res.status('500').render("500")
    }
}

const profileLoad = async (req, res) => {
    try {
        const user = req.session.user_id
        const addressData = await Address.findOne({ user }).populate("address")
        const orderDetails = await Order.find({ user }).sort({ date: -1 })
        const walletData = await User.findOne({ _id: user }).populate("walletHistory"); 
        const userData = await User.findOne({ _id: user })

        console.log('user',userData);

        if (userData.is_admin == 0) {
            res.render("profile", {user, addressData,userData, orderDetails,walletData })
        } else {
            req.session.admin_id = userData
            res.render("profile",{user, addressData,userData, orderDetails,walletData })
        }
    } catch (e) {
        console.log("error while loading profile", e);
        res.status(500).render("500")
    }
}


const editProfile = async (req, res) => {
    try {
        console.log("hiiii", req.session.user_id)
        const userData = await User.findById({ _id: req.session.user_id })
        console.log("haiiiiiiiiii",req.files);
        let image

        if (req.file && req.file.originalname) {
            image = req.file.originalname
            const imagePath = `public/images/user/${req.file.originalname}`
        } else {
            image = userData.image
        }

        if(userData.email!==req.body.email){
            const otp = speakeasy.totp({
                secret: req.body.email,
                encoding: 'base32',
                digits: 4 
            });
            console.log('otp:',otp);
            req.session.otp = otp
            req.session.newEmail = req.body.email
            req.session.otpTimestamp= Date.now()

            sendVerifyMail(userData.name,userData.email,otp)

             return res.json({verification:true})
        }


       


        const editedData = await User.findOneAndUpdate({ _id: userData._id }, {
            $set: {
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mobile,
                image: image,

            }
        })

        console.log("'ferere", editedData);
        console.log(userData.image);

        return res.json({ profileEdit: true })


    } catch (e) {
        console.log('error while editing profile:', e);
        res.status(500).render("500")
    }
}

const verifyEmailChange = async (req,res)=> {
    try {
        const inputOtp = req.body.input1+req.body.input2+req.body.input3+req.body.input4
        const otpAge = Date.now() - req.session.otpTimestamp;
        const user= req.session.user_id
        
      
        if (otpAge<=5*60*1000&&inputOtp==req.session.otp) {
          console.log('asfhkjlfdhkdsadfhjkdhfdhfdasjhkfdajhfhajdk'); 
                  const verified = await User.findOneAndUpdate({_id:user}, { $set: { email:req.session.newEmail} }, { new: true })
              
                  
                  if (verified) {
                     res.json({change:true})
                  }
               
              }else{
                  res.json({valid:false})
              }
    } catch (e) {
        console.log('while verifying otp of change email');
    }
}

const passwordChange = async (req, res) => {
    try {
        console.log('body', req.body);

        const userData = await User.findById({ _id: req.session.user_id })
        const newPassword = req.body.newPassword
        const confirmPassword = req.body.confirm
        const current = req.body.current

        let passwordHash


        const passwordMatch = await bcrypt.compare(current, userData.password)
        if (passwordMatch) {
            try {
                passwordHash = await bcrypt.hash(newPassword, 10);
            } catch (error) {
                console.error('Error while hashing password:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

        } else {
            return res.json({ passwordMatch: false })
        }

        if (userData) {
            const editedData = await User.findOneAndUpdate({ _id: userData._id }, {
                $set: {
                    password: passwordHash
                }
            })
            console.log('edi', editedData);
            res.json({ password: true })
        } else {
            res.json({ user: true });
        }




    } catch (error) {

    }
}

const forgotPassword = async (req, res) => {
    try {
        console.log(req.session.user_id, "inddd")
        if (req.session.user_id) {

            const userData = await User.findOne({ _id: req.session.user_id })


            otp = Math.floor(Math.random() * 9000) + 1000

          req.session.otp= otp
          req.session.otpAge = Date.now()


            sendVerifyMail(userData.name, userData.email,otp)

            

            

            req.session.email = userData.email;

            res.render('otp',
                {
                    email: userData.email,

                })

        } else {
            console.log(req.session.user_id, "illaa")
            res.render('getEmail')
        }
    } catch (error) {
        console.log(error.message);
        res.render('500Error')
    }
};

const getEmail = async (req, res) => {
    try {

        req.session.user_check = req.body.email

        const userData = await User.findOne({ email: req.body.email })
        console.log(req.session.user_check);

        if (userData) {

            otp = Math.floor(Math.random() * 9000) + 1000
            req.session.otp=otp
            req.session.otpTimestamp = Date.now();

            

            sendVerifyMail('user', req.body.email, otp)

            
            req.session.email = userData.email;

           res.json({success:true})

        } else {
           res.json({found:false})
        }

    } catch (error) {
        console.log(error.message);
        res.render('500Error')
    }
};

const changePasswordLoad = async (req, res) => {
    try {
        res.render('resetPassword')
    } catch (error) {
        console.log(error, "error while loading password change")
    }
}
const changePassword = async (req, res) => {
    try {
        const user_id = req.session.user_id
        const newPassword = req.body.newPass
        console.log(newPassword);
        if (req.session.user_id) {


            const passwordHash = await bcrypt.hash(newPassword, 10)
            const changed = await User.findOneAndUpdate({ _id: user_id }, { $set: { password: passwordHash } })
            console.log('prof',changed);
            res.redirect("/profile")

        } else {

            const passwordHash = await bcrypt.hash(newPassword, 10)
            const changed =  await User.findOneAndUpdate({ email: req.session.user_check }, { $set: { password: passwordHash } })
            console.log("login",changed);
            res.json({changed:true})

        }

    } catch (error) {
        console.log(error.message);
        res.render('500Error')
    }
};

const otpLoad = async (req, res) => {
    try {
        res.render("otp")
    } catch (error) {
        console.log(error);
        res.status(500).render('500')
      
    }
}




const resendOtp = async (req, res) => {
    try {
      
        let email = req.session.email;
        let name = req.session.name;
        console.log('asasdfasd',email,name);
        let otp = Math.floor(Math.random() * 9000) + 1000;
       req.session.otp = otp
       req.session.otpAge = Date.now()
        console.log(otp)
        sendVerifyMail(name, email, otp);
        res.json({resend:true})
       
    } catch (error) {
        console.log(error)
        res.status(500).render("500");
    }
};


const verifyOtp = async (req, res) => {
    try {

      
      const inputOtp = req.body.input1+req.body.input2+req.body.input3+req.body.input4
      const otpAge = Date.now() - req.session.otpTimestamp;
      console.log('age',otpAge);
      const email = req.session.email
      console.log(inputOtp,"otppppppppppppp");
      console.log('seesionotp:',req.session.otp);
    
      if (otpAge<=5*60*1000&&inputOtp==req.session.otp) {
        console.log('asfhkjlfdhkdsadfhjkdhfdhfdasjhkfdajhfhajdk'); 
                const verified = await User.findOneAndUpdate({ email: email }, { $set: { is_verified: 1 } }, { new: true })
            
                req.session.otp = null;
                req.session.otpTimestamp = null;
                if (verified) {
                    if (req.session.user_id) {
                        return res.json({ profile: true })
                    } else {
                        const userData = await User.findOne({ email: req.session.user_check })
                        if (userData) {
                           return res.json({ login: true })
                        } else {
                            return res.json({ signup: true })
                        }
                    }
                }
                return res.json({valid:true})
            }else{
                res.json({valid:false})
            }
        }
     catch (e) {
        console.log(e, "error in verify otp")
        res.render("500")
    }
}

const shopLoad = async (req, res) => {
    try {
        const user = req.session.user_id;
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;
        const categoryData = await Category.find({ is_block: 0 });

        let filter = {
            is_block: 0
        };
        let sortOption = {};
        const sort = req.query.sort;
        const searchTerm = req.query.search;

        if (searchTerm) {
            filter.name = { $regex: searchTerm, $options: 'i' };
        }

        if (sort && sort !== 'new_arrival') {
            switch (sort) {
                case 'low_to_high':
                    sortOption = { price: 1 };
                    break;
                case 'high_to_low':
                    sortOption = { price: -1 };
                    break;
                case 'Aa-Zz':
                    sortOption = { name: 1 };
                    break;
                case 'Zz-Aa':
                    sortOption = { name: -1 };
                    break;
                default:
                    break;
            }
        } else {
            sortOption = { date: -1 };
        }

        if (req.query.category && categoryData.some(category => category._id.toString() === req.query.category)) {
            filter.category = req.query.category;
        }

        const productData = await Product.find(filter)
            .populate({
                path: 'category',
                match: { is_block: 0 }
            })
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);

        res.render('shop', {
            productData,
            currentPage: page,
            totalPages,
            user,
            categoryData,
            currentSort: sort,
            searchTerm,
            req
        });
    } catch (error) {
        console.log('Error while loading the shop:', error);
        res.render('error');
    }
};



const leftShopLoad = async (req, res) => {
    try {
        let productData = [];
        console.log('req.',req.query);
        if (req.query.minPrice && req.query.maxPrice) {
            productData = await Product.find({
                is_block: 0,
                price: { $gte: req.query.minPrice, $lte: req.query.maxPrice }
            });
        } else {
            productData = await Product.find({ is_block: 0 });
        }
        console.log('prod',productData);
        const categoryData = await Category.find({ is_block: 0 });
        const user = req.session.user_id;
        res.render("shop-left-sidebar", { user, categoryData, products: productData });
    } catch (error) {
        res.status(500).render('500');
    }
};




const logoutUser = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/login')
    } catch (error) {
        console.log(error);
    }
}



module.exports = {
    loadHome,
    aboutLoad,
    contactLoad,
    loadProductDetails,
    profileLoad,
    editProfile,
    verifyEmailChange,
    forgotPassword,
    getEmail,
    changePasswordLoad,
    changePassword,
    passwordChange,
    failureLoad,
    loadSignup,
    resendOtp,
    verifyOtp,
    insertUser,
    otpLoad,
    shopLoad,
    leftShopLoad,
    loadLogin,
    verifyLogin,
    logoutUser,


}