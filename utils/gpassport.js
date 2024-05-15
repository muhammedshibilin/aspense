const passport = require('passport')
const googleStrategy = require("passport-google-oauth2").Strategy
const User = require('../model/userModel')
const env = require('dotenv')


passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})
passport.use(new googleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://aspense.online/auth/google/callback",
    passReqToCallback: true
},
    async (request, accessToken, refreshToken, profile, done) => {
        try {
            const newUser = new User({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.email
            });

            await newUser.save()


            return done(null, profile)
        } catch (e) {
            console.log(e,"error occured while saving to database");
        }
    }
))