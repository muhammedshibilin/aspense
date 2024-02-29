const passport = require('passport')
const googleStrategy = require("passport-google-oauth2").Strategy


passport.serializeUser((user,done) => {
    done(null,user)
})

passport.deserializeUser((user,done) => {
    done(null,user)
})
passport.use(new googleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL:"http://localhost:7000/auth/google/callback",
    passReqToCallback:true
},
(request,accessToken,refreshToken,profile,done) => {
    return done(null,profile)
}
))