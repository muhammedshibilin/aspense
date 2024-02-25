const mongoDb = require("./config/mongoAuth")
const express = require('express');
const path = require('path');
const session = require('express-session')


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




const PORT = process.env.PORT || 7000;


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
