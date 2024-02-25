
const nodeMailer = require('nodemailer')
const dotenv = require('dotenv').config()


const sendVerifyMail = async (name,email,otp) => {
    try {
        console.log(email,name,otp);
        const transporter = nodeMailer.createTransport({
            host:"smtp.gmail.com",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.email,
                pass:process.env.pass
            },   
        })
        const mailOptions = {
            from:"nkshibili17@gmail.com",
            to:email,
            subject:"for otp verification",
            html:`<p>Hello ${name}
            
            , This is your Mail veryfication message <br> This is your OTP :${otp}
            
             Please Verify your mail.</p>,`,
    
        }

        transporter.sendMail(mailOptions,(error,info) =>{
            if(error){
                console.log(error);
            }else{
                console.log("email has been send :-",info.response);
            }
        } )
    } catch (error) {
        console.log(error)
        res.status(500).render("500")
    }
}


module.exports= {
    sendVerifyMail
}