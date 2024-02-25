const User = require("../model/userModel")
const bcrypt = require("bcryptjs")
const {sendVerifyMail}= require('../utils/sendVerifyMail')




const loadSignup = async (req, res) => {
    try {
        res.render('signUp')
    } catch (error) {
        console.log(error);
    }
}


let otp;


const insertUser = async (req, res) => {
    try {
        const { name, email, mobile, password, confirmPassword } = req.body
    console.log(req.body)

        if (name.trim() === "") {
            res.json({ name_require: true })
        } else {
            if (name.startsWith(" ") || name.includes(" ")) {
                res.json({ name_space: true })
            } else {
                if (name && name.length <= 2) {
                    res.json({ name: true })
                } else {
                    if (email.trim() === "") {
                        res.json({ email_require: true })
                    } else {
                        if (email.startsWith(" ") || email.includes(" ")) {
                            res.json({ email_space: true })
                        } else {
                            const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
                            if (!emailPattern.test(email)) {
                                res.json({ email_pattern: true })
                            } else {
                                if (mobile.trim() === "") {
                                    res.json({ mobile_require: true })
                                } else {
                                    if (mobile.startsWith(" ") || mobile.includes(" ")) {
                                        res.json({ mobile_space: true })
                                    } else {
                                        let mobilePattern = /^\d{10}$/
                                        if (!mobilePattern.test(req.body.mobile) || mobile === "0000000000") {
                                            res.json({ mobile: true })
                                        } else {
                                            if (password.trim() === "") {
                                                res.json({ password_require: true })
                                            } else {
                                                if (password.startsWith(" ") || password.includes(" ")) {
                                                    res.json({ password_space: true })
                                                } else {
                                                    if (password.length < 4) {
                                                        res.json({ password: true })
                                                    } else {
                                                        const alphanumeric = /^(?=.*[a-zA-Z])(?=.*\d).+$/;
                                                        if (!alphanumeric.test(password)) {
                                                            res.json({ alphanumeric: true })
                                                        } else {
                                                            if (confirmPassword.trim() == "") {
                                                                res.json({ confirmPassword_require: true })
                                                            } else {
                                                                if (confirmPassword.startsWith(" ") || confirmPassword.includes(" ")) {
                                                                    res.json({ confirmPassword_space: true })
                                                                } else {
                                                                    const emailCheck = await User.findOne({ email: req.body.email })
                                                                    if (emailCheck) {
                                                                        res.json({ emailExist: true })
                                                                    } else {
                                                                        if (password === confirmPassword) {
                                                                            const passwordHash = await bcrypt.hash(password, 10)
                                                                            const user = new User({
                                                                                name:name,
                                                                                email: email,
                                                                                mobile:mobile,
                                                                                password: passwordHash,
                                                                                is_verified:0,
                                                                                is_admin:0
                                                                            })

                                                                            const userData = await user.save()


                                                                            let randomNumber = Math.floor(Math.random()*9000)+1000

                                                                            otp = randomNumber

                                                                            req.session.email= req.body.email;
                                                                            req.session.password = passwordHash;
                                                                            req.session.name=req.body.name;
                                                                            req.session.mobile=req.body.mobile;

                                                                            console.log(otp)
                                                                        
                                                                            sendVerifyMail (
                                                                                req.body.name,
                                                                                req.body.email,                                                                            
                                                                                randomNumber
                                                                            )
                                                                            setTimeout(()=>{
                                                                                otp=Math.floor(Math.random()*9000)+1000
                                                                            },36000)

                                                                            req.session.otpsend = true;

                                                                            res.json({success:true})
    
                                                                        }else{
                                                                            res.json({notsaved:true})
                                                                        } 
                                                                    }
                                                                    
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }



    } catch (error) {
        console.log(error);
        res.status('500');
        res.render("500")
    }
}

const otpLoad = async (req,res)=>{
    try {
        let verifyErr = req.session.verifyErr;
        let otpsend = req.session.otpsend;
        res.render("otp",{verifyErr,otpsend})
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
      console.log(name,email);
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
  

const verifyOtp = async(req,res) => {
    try {

        console.log("verify");
        req.session.verifyErr = false;
        req.session.otpsend= false;

        const otpinput =parseInt(req.body.otp)
        const email = req.session.email
        console.log(req.session.email);


        if(req.body.otp.trim()==""){
            res.json({fill:true})
        }else{

            
            if(otpinput===otp){
            const verified = await User.findOneAndUpdate({email:email},{$set:{is_verified:1}},{new:true})
      
            
        
        if(verified){
            req.session.regSuccess= true;
            res.json({success:true})
        }else{
            res.json({error:true})
        }
    }else{
          res.json({wrong:true})
    }

    }
    } catch (error) {
        console.log(error)
        res.status('500')
        res.render("500")
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

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {
                console.log("password match");
                req.session.user_id = userData._id
                res.render('userHome')
            } else {
                res.render('login')
            }
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    loadSignup,
    resendOtp,
    verifyOtp,
    insertUser,
    otpLoad,
    loadLogin,
    verifyLogin,
}