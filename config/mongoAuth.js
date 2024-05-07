const mongoose = require("mongoose");
const dotenv = require("dotenv");
const emoji = require("node-emoji");

module.exports = {
  connectDB: () => {
    mongoose.set("bufferCommands", true);

    mongoose
      .connect(process.env.mongo, {})
      .then(() => {
        console.log(`Server is running on http://localhost:7000 `+ emoji.get("rocket"))
      })
      .catch((e) => {
        console.log("server having some trouble....!" + emoji.get("sad"));
        console.log(e);
      });
  },
};
