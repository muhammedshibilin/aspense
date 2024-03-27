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


  const userLoad = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6; // Adjust the limit as needed
        const skip = (page - 1) * limit;

        // Check for a search query
        const searchQuery = req.query.search;
        let query = {};
        if (searchQuery && searchQuery.trim().length >= 1) { // Adjust the minimum length as needed
            // Use regex to search for the search query in the name and email fields
            // Ensure the search query is trimmed and sanitized properly
            const sanitizedQuery = searchQuery.trim();
            query.$or = [
                { name: { $regex: sanitizedQuery, $options: 'i' } },
                { email: { $regex: sanitizedQuery, $options: 'i' } }
            ];
        }

        // Find the total number of users
        const totalUsers = await User.countDocuments(query);
        // Calculate the total number of pages
        const totalPages = Math.ceil(totalUsers / limit);

        // Query the users with pagination and search
        const userData = await User.find(query).skip(skip).limit(limit);

        res.render('userManagment', {
            users: userData,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.log(error);
        res.status(500).render("500");
    }
};


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


const orderLoad = async (req,res) => {
  try {
   res.render("order") 
  } catch (error) {
    console.log(error)
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
    orderLoad
}