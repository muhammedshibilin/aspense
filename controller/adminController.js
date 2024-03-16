const User = require('../model/userModel')

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

                      console.log('admin password matched');
                       req.session.admin_id = adminData._id;
                       res.json({ success: true });
                     } else {
                      console.log("password incorrect")
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

  const adminHome = async (req,res) => {
    try {
      console.log("haloooo")
        res.render('admin-home')
    } catch (error) {
      console.log(error);
    }
  }

  const userLoad = async(req,res) => {
    try {
      const userData = await User.find({is_admin:0})
      res.render('userManagment',{users:userData})
    } catch (error) {
      console.log(error)
      res.json('500').render("500")
    }
  }

const blockUser = async (req,res) => {
  try {
    const userId = req.body.userId
    const blockedUser = await User.findOne({_id:userId})

    if(blockedUser.is_block==0){
      await User.updateOne({_id:userId},{$set:{is_block:1}})
      res.json({success:true})

    }else{
      await User.updateOne({_id:userId},{$set:{is_block:0}})
      res.json({success:true})
    }
  } catch (error) {
    console.log(error);
    res.status("500").render('500')
  }
}


const adminLogout = async (req,res) => {
  try {
    console.log("admin is heere ")
    req.session.admin_id = null
    console.log(req.session.admin_id,"gyghghhgjhgjhgjhg")
    res.redirect("/admin/login")
  } catch (error) {
    console.log("while logouting the admin",error)
  }
}



module.exports={
    loginLoad,
    adminLogin,
    adminLogout,
    adminHome,
    userLoad,
    blockUser,
}