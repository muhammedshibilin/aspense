const mongoDb = require("./config/mongoAuth")
const express = require('express');
const path = require('path');
const session = require('express-session')
const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy

const app = express();

app.use(session({
    secret:"my-session-secret",
    resave:false,
    saveUninitialized:true
}))




const user_route = require('./routes/userRoute');
const admin_route = require('./routes/adminRoute');

mongoDb.connectDB()




app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use(express.static(path.join(__dirname, 'public')));
app.use('/', user_route);
app.use('/admin', admin_route);


app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET'
  }));
  
app.use(passport.initialize());
app.use(passport.session());

// passport.serializeUser(function (user, cb) {
//     cb(null, user);
//   });
  
//   passport.deserializeUser(function (obj, cb) {
//     cb(null, obj);
//   });
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
        });

    passport.use(new FacebookStrategy({
        clientID:"1081260976312180",
        clientSecret:"4d63211dedb98bd818679ecbae5a0fa1" ,
        callbackURL: "http://localhost:7000/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'email']
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Checking  the user  db
                let user = await FacebookUser.findOne({ facebookId: profile.id });
                if (!user) {
                    // If the user does not exist, create a new user
                    user = new FacebookUser({
                        facebookId: profile.id,
                        displayName: profile.displayName,
                        email: profile.emails ? profile.emails[0].value : null
                    });
                    // Save the user to the database
                    await user.save();
                }
                // Pass the user object to the next middleware
                return done(null, user);
            } catch (error) {
                // If an error occurs, pass it to the error handler
                return done(error);
            }
        }
    ));

app.listen(7000, () => {
    console.log(`Server is running on http://localhost:7000`);
});

module.exports = app;
