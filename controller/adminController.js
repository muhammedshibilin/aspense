

const bcrypt = require('bcryptjs')


const loginLoad = async (req,res)=>{
    try {
        res.render("admin-login")
    } catch (error) {
        console.log(error);
    }
}

const adminLogin = async (req,res) => {
    try {
       const email = req.body.email
       const password = req.body.password
       if (!email) {
         res.json({ require: true });
       } else {
         if (!password) {
           res.json({ passrequire: true });
         } else {
           if (email.startsWith(" ") || email.includes(" ")) {
             res.json({ emailspace: true });
           } else {
             if (password.startsWith(" ") || password.includes(" ")) {
               res.json({ passwordspace: true });
             } else {
               let emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
   
               if (!emailPattern.test(req.body.email)) {
                 res.json({ emailPatt: true });
               } else {
                 const adminData = await User.findOne({ email: email });
                 if (adminData) {
                   if (adminData.is_admin === 0) {
                     res.json({ emailnot: true });
                   } else {
                     const passwordMatch = await bcrypt.compare(
                       password,
                       adminData.password
                     );
   
                     if (passwordMatch) {
                       req.session.admin_id = adminData._id;
                       res.json({ success: true });
                     } else {
                       res.json({ wrongpass: true });
                     }
                   }
                 } else {
                   res.json({ notregister: true });
                 }
               }
             }
           }
         }
       }
     } catch (error) {
       console.log(error);
       res.status(500).render("500")
     }
    }

module.exports={
    loginLoad,
    adminLogin
}