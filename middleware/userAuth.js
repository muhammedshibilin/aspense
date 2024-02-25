const User = require ('../model/userModel')

const isLogin = async (req,res,next) => {
    try {
        if(req.session.user_id){
            console.log(req.session.user_id);


            const userData = await User.findOne({_id:req.session.user_id})
            if(userData.is_block){
                req.session.destroy();
                res.redirect('/login')
            }else{
                next()
            }

        }else{
            res.redirect("/login")
        }
    } catch (error) {
        
    }
}


const isLogout = async (req,res,next) => {
    try {
        if(req.session.user_id){
            const userData = await User.findById(req.session.user_id)
            if(userData.is_block){
              next()
            }        
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    isLogin,
    isLogout
}