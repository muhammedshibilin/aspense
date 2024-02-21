const mongoose = require('mongoose')

module.exports = {
    connectDB:() => {


        mongoose.set('bufferCommands', true);  

        mongoose.connect("mongodb://127.0.0.1:27017/db_aspens",{
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