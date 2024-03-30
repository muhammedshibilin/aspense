const User = require("../model/userModel")
const Product = require('../model/productModel')
const Cart = require('../model/cartModel')
const Category = require('../model/categoryModel')
const Address = require('../model/addressModel')
const Review = require('../model/reviewModel')
const Order = require('../model/orderModel')
const bcrypt = require("bcryptjs")
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
        console.log('sds',categoryData);
       

       
        if (!productData) {

            return res.render("userHome", { productData: [], user,cartData });
        }



        res.render("userHome", { productData, user,categoryData ,cartData})
    } catch (error) {
        console.log(error);
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


let otp;


const insertUser = async (req, res) => {
    try {
        const { name, email, mobile, password, confirmPassword } = req.body
        console.log(req.body);


        const emailCheck = await User.findOne({ email: req.body.email })
        if (emailCheck) {
            return res.json({ emailExist: true })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = new User({
            name: name,
            email: email,
            mobile: mobile,
            password: passwordHash,
            is_verified: 0,
            is_admin: 0
        })

        const userData = await user.save()


        let randomNumber = Math.floor(Math.random() * 9000) + 1000

        otp = randomNumber

        req.session.email = req.body.email;
        req.session.password = passwordHash;
        req.session.name = req.body.name;
        req.session.mobile = req.body.mobile;

        console.log(otp)

        sendVerifyMail(
            req.body.name,
            req.body.email,
            randomNumber
        )
        setTimeout(() => {
            otp = Math.floor(Math.random() * 9000) + 1000
        }, 60000)

        req.session.otpsend = true;

        res.json({ success: true })





    } catch (error) {
        console.log(error);
        res.status('500').json({ error: "Internal server error" });
    }
}

const successLoad = async (req, res) => {
    try {




        const productData = await Product.find({ Is_blocked: true }).populate({
            path: "category",
            match: { is_block: true }
        })
        res.render('userHome', { productData })
    } catch (error) {
        console.log(error);
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


        const productData = await Product.find({ Is_block: 0 }).populate({
            path: "category",
            match: { is_block: 0 }
        })

        if (userData.is_block == 0) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            const productData = await Product.find({})

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

const loadProductDetails = async (req, res) => {
    try {
        const productId = req.query._id


        const user_id = req.session.user_id
        const productData = await Product.findOne({ _id: productId }).populate("category").populate("offer")
        
        const offer = productData.offer ? productData.price-Math.floor(productData.price*productData.offer.discountAmount/100) : productData.price;

        const categoryData = await Category.find()
        const relatedImg = await Product.find({ category: productData.category._id, _id: { $ne: productData._id } }).limit(8)

        const reviews = await Review.find({ productId: req.query._id })

        res.render('product-details', {
            productData,
            categoryData,
            relatedImg,
            offer,
            reviews,
            user: user_id
        })
    } catch (error) {
        console.log(error);
    }
}

const profileLoad = async (req, res) => {
    try {
        const user = req.session.user_id
        const addressData = await Address.findOne({ user }).populate("address")
        const orderDetails = await Order.find({ user }).sort({ date: -1 })
      
        if (addressData) {
            console.log(addressData);
            console.log(addressData.address.fullName)
        }

        console.log("session profile", req.session.user_id);
        const userData = await User.findOne({ _id: user })
        console.log(userData.image)
        if (userData.is_admin == 0) {
            res.render("profile", { userData, addressData, orderDetails, user })
        } else {
            req.session.admin_id = userData
            res.redirect("/profile")
        }
    } catch (e) {
        console.log("error while loading profile", e);
    }
}


const editProfile = async (req, res) => {
    try {
        console.log("hiiii", req.session.user_id)
        const userData = await User.findById({ _id: req.session.user_id })
        const newPassword = req.body.newPassword
        console.log(newPassword);


        let image


        if (req.file && req.file.originalname) {
            image = req.file.originalname
            const imagePath = `public/images/user/orginal/${userData.image}`
        } else {
            image = userData.image
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
        res.status(500).render(500)
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


            let randomNumber = Math.floor(Math.random() * 9000) + 1000

            otp = randomNumber


            sendVerifyMail(userData.name, userData.email, randomNumber)

            req.session.otpsend = true;

            setTimeout(() => {
                otp = Math.floor(Math.random() * 9000) + 1000
            }, 60000)
            let verifyErr = req.session.verifyErr;
            let otpsend = req.session.otpsend;
            req.session.email = userData.email;

            res.render('otp',
                {
                    email: userData.email,
                    verifyErr,
                    otpsend

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

            let randomNumber = Math.floor(Math.random() * 9000) + 1000

            otp = randomNumber

            sendVerifyMail('user', req.body.email, randomNumber)

            req.session.otpsend = true;
            req.session.email = userData.email;

            setTimeout(() => {
                otp = Math.floor(Math.random() * 9000) + 1000
            }, 60000)

            let verifyErr = req.session.verifyErr;
            let otpsend = req.session.otpsend;
            res.render('otp', {
                email: req.body.email,
                verifyErr,
                otpsend
            })

        } else {
            res.render(getEmail, { error: 'Email not found' })
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
        const newPassword = req.body.newPassword
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
            res.redirect("/login")

        }

    } catch (error) {
        console.log(error.message);
        res.render('500Error')
    }
};

const otpLoad = async (req, res) => {
    try {
        let verifyErr = req.session.verifyErr;
        let otpsend = req.session.otpsend;
        res.render("otp", { verifyErr, otpsend })
    } catch (error) {
        console.log(error);
        res.status("500")
        res.render("500")
    }
}




const resendOtp = async (req, res) => {
    try {
        let otpsend = req.session.otpsend;
        let verifyErr = req.session.verifyErr;
        let email = req.session.email;
        let name = req.session.name;
        let randomNumber = Math.floor(Math.random() * 9000) + 1000;
        otp = randomNumber;
        setTimeout(() => {
            otp = Math.floor(Math.random() * 9000) + 1000;
        }, 60000);
        console.log(otp)
        sendVerifyMail(name, email, randomNumber);
        console.log(name, email);
        res.render("otp", {
            verifyErr,
            otpsend,
            resend: "Resend the otp to your email address.",
        });
    } catch (error) {
        console.log(error)
        res.status(500).render("500");
    }
};


const verifyOtp = async (req, res) => {
    try {

        console.log("verify");
        req.session.verifyErr = false;
        req.session.otpsend = false;


        const otpinput = parseInt(req.body.otp)
        const email = req.session.email

        console.log(otpinput, email);



        if (req.body.otp.trim() == "") {
            res.json({ fill: true })
        } else {


            if (otpinput === otp) {
                const verified = await User.findOneAndUpdate({ email: email }, { $set: { is_verified: 1 } }, { new: true })




                if (verified) {
                    req.session.regSuccess = true;
                    console.log(req.session.user_id);
                    console.log('ema', req.session.user_check)

                    if (req.session.user_id) {
                        return res.json({ profile: true })
                    } else {
                        const userData = await User.findOne({ email: req.session.user_check })
                        console.log('use',userData);
                        if (userData) {
                            res.json({ login: true })
                        } else {
                            res.json({ signup: true })
                        }
                    }



                }
            }
        }

    } catch (e) {
        console.log(e, "error in verify otp")
        res.status('500').render("500")
    }
}

const shopLoad = async (req, res) => {
    try {
        const user = req.session.user_id;
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;
        const categoryData = await Category.find({ is_block: 0 });

        let filter = {};
        let sortOption = {};
        const sort = req.query.sort;
        const searchTerm = req.query.search;

      
        if (searchTerm) {
           
            filter = { name: { $regex: searchTerm, $options: 'i' } };
        }

      
        if (categoryData.some(category => category._id.toString() === sort)) {
           
            filter.category = sort;
        } else {
          
            switch (sort) {
                case 'low_to_high':
                    sortOption = { price: 1 };
                    break;
                case 'high_to_low':
                    sortOption = { price: -1 };
                    break;
                case 'new_arrival':
                    sortOption = { date: -1 };
                    break;
                default:
                    sortOption = {};
            }
        }

const productData = await Product.find({...filter})
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
            currentSort: req.query.sort,
            searchTerm: req.query.search
        });
    } catch (error) {
        console.log('Error while loading the shop:', error);
        res.render('error');
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
    loadProductDetails,
    profileLoad,
    editProfile,
    passwordChange,
    forgotPassword,
    getEmail,
    changePasswordLoad,
    changePassword,
    failureLoad,
    successLoad,
    loadSignup,
    resendOtp,
    verifyOtp,
    insertUser,
    otpLoad,
    shopLoad,
    loadLogin,
    verifyLogin,
    logoutUser,


}