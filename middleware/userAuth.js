const User = require ('../model/userModel')

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            const userData = await User.findOne({ _id: req.session.user_id });
            if (userData.is_block) {
                req.session.destroy();
                console.log('Redirecting to login due to block status');
                return res.redirect('/login');
            } else {

                return next();
            }
        } else {
            console.log('user illaaaaaaaaaaaa');
            console.log('Attempting to redirect to login');
            return res.redirect('/login');
        }
    } catch (error) {
        console.log('Error in isLogin middleware:', error);
    }
};

const isLogout = async (req,res,next) => {
    try {
        if(req.session.user_id){
            const userData = await User.findById(req.session.user_id)
            if(userData.is_block){
              next()
            }else{
                res.redirect('/')
            }        
        }else{
            next()
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    isLogin,
    isLogout
}