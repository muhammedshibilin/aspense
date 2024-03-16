const mongoDb = require("./config/mongoAuth")
const express = require('express');
const path = require('path');
const session = require('express-session')
const noCache = require('nocache')


const app = express();

app.use(session({
    secret:"my-session-secret",
    resave:false,
    saveUninitialized:true
}))
app.use(noCache())



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
  

app.listen(7000, () => {
    console.log(`Server is running on http://localhost:7000`);
});

module.exports = app;
