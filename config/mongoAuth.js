const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const emoji = require("node-emoji");

module.exports = {
  connectDB: () => {
    mongoose.set("bufferCommands", true);

    mongoose
      .connect(process.env.mongo, {})
      .then(() => {
        console.log(
          "Server is running on https://2c14-103-170-228-58.ngrok-free.app" + emoji.get("rocket")
        );
      })
      .catch((e) => {
        console.log("server having some trouble....!" + emoji.get("sad"));
        console.log(e);
      });
  },
};
