const mongoose = require('mongoose')
const dotenv = require('dotenv').config()


module.exports = {
    connectDB:() => {


        mongoose.set('bufferCommands', true);  

        mongoose.connect(process.env.mongo,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false 
        }).then(()=> {
            console.log("db connected");
        }).catch(error => {
            console.log(error);
        })
    }
}