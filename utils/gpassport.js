const passport = require('passport')
const googleStrategy = require("passport-google-oauth2").Strategy
const googleUser = require('../model/googleModel')
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
    callbackURL: "http://localhost:7000/auth/google/callback",
    passReqToCallback: true
},
    async (request, accessToken, refreshToken, profile, done) => {
        try {
            const newGoogleUser = new googleUser({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.email

            });

            await newGoogleUser.save()


            return done(null, profile)
        } catch (e) {
            console.log(e, "error occured while saving to database");
        }
    }
))