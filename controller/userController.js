const User = require("../model/userModel")
const Product = require('../model/productModel')
const Category = require('../model/categoryModel')
const Review = require('../model/reviewModel')
const bcrypt = require("bcryptjs")
const { sendVerifyMail } = require('../utils/sendVerifyMail')








const loadHome = async (req, res) => {
    try {

        const productData = await Product.find({ Is_blocked: true }).populate({
            path: "category",
            match: { is_block: true }
        })
        if (!productData) {

            return res.render("userHome", { productData: [] });
        }



        res.render("userHome", { productData })
    } catch (error) {
        console.log(error);
    }
}

const loadSignup = async (req, res) => {
    try {
        res.render('signUp')
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



        if (req.body.otp.trim() == "") {
            res.json({ fill: true })
        } else {


            if (otpinput === otp) {
                const verified = await User.findOneAndUpdate({ email: email }, { $set: { is_verified: 1 } }, { new: true })



                if (verified) {
                    req.session.regSuccess = true;
                    res.json({ success: true })
                } else {
                    res.json({ error: true })
                }
            } else {
                res.json({ wrong: true })
            }

        }
    } catch (e) {
        console.log(e,"error in verify otp")
        res.status('500').render("500")
    }
}



const loadLogin = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error);
    }
}



const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body
       
        const userData = await User.findOne({ email: email })
      
        const productData = await Product.find({ Is_blocked: true }).populate({
            path: "category",
            match: { is_block: true }
        })

        if (userData.is_block==0) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            const productData = await Product.find({})

            if (passwordMatch) {
                req.session.user_id = userData._id;
                return res.json({success:true}) 
            } else {
                return res.json({success:false}) 
              
            }
        } else {
           return res.json({success:false,error:"you are blocked,please contact for more information"})
        }
    } catch (e) {
        console.log(e,"error occured in verify login");
        res.status(500).json({ success: false, error: "Internal server error" });
    }
}

const loadProductDetails = async (req, res) => {
    try {
        const productId = req.query._id


        const user_id = req.session.user_id
        const productData = await Product.findOne({ _id: productId }).populate("category")

        const offer = productData.offer ? (productData.price - productData.offer) : productData.price;

        const categoryData = await Category.find()
        const relatedImg = await Product.find({ category: productData.category._id, _id: { $ne: productData._id } }).limit(8)

        const reviews = await Review.find({ productId: req.query._id })

        res.render('product-details', {
            productData,
            categoryData,
            relatedImg,
            offer,
            reviews
        })
    } catch (error) {
        console.log(error);
    }
}

const profileLoad = async (req, res) => {
    try {
        const userId = req.session.user_id
        console.log("session profile",req.session.user_id);
        const userData = await User.findOne({ _id: userId })
       if(userData.is_admin==0){
        res.render("profile",{userData})
       }else{
        req.session.admin_id=userData
        res.redirect("/admin")
       }
    } catch (e) {
        console.log("error while loading profile",e);
    }
}


const editProfile = async (req,res) => {
    try{
        console.log(req.session.user_id)
        const userData = await User.findById({_id:req.session.user_id})
        const newPassword = req.body.newPassword
        console.log(newPassword);
        const currentPassword = req.body.currentPassword
        console.log(currentPassword);
        let image
        let passwordHash

        if(currentPassword||newPassword){
            if(newPassword<8){
                return res.json({passwordLength:true})
            }else{
                const passwordMatch = await bcrypt.compare(currentPassword,userData.password)
                if(passwordMatch){
                    try {
                        passwordHash = await bcrypt.hash(newPassword, 10);
                    } catch (error) {
                        console.error('Error while hashing password:', error);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }
                    
                }else{
                   return res.json({passwordMatch:false})
                }
            }
        }else{
            passwordHash = userData.password
        }

        if(req.file&&req.file.originalname){
            image = req.flie.originalname
            const imagePath = `public/images/product/orginal/${userData.image}`
        }else{
            image = userData.image
        }

        const editedData = await User.findOneAndUpdate({_id:userData._id},{$set:{
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mobile,
            image:image,
            password:passwordHash
        }}) 

        res.json({profileEdit:true})
        res.redirect('/profile')

    }catch(e){
        console.log('error while editing profile:',e);
        res.status(500).render(500)
    }
}




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
    failureLoad,
    successLoad,
    loadSignup,
    resendOtp,
    verifyOtp,
    insertUser,
    otpLoad,
    loadLogin,
    verifyLogin,
    logoutUser,

    
}