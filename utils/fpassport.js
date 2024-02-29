const passport = require('passport')
const facebookStrategy = require("passport-facebook").Strategy

passport.serializeUser((user,cb)=> {
    cb(null,user)
})
passport.deserializeUser((obj,cb)=> {
    cb(null,obj)
})

passport.use( new facebookStrategy({
    clientID:"1081260976312180",
    clientSecret:"4d63211dedb98bd818679ecbae5a0fa1",
    callbackURL:'http://localhost:7000/auth/facebook/callback'
},
(accessToken,refreshToken,profile,done) => {
  
    return done(null,profile)
}
))