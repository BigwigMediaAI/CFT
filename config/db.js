const mongoose = require("mongoose");
require("dotenv").config();

const connect = () => {
  const MongoURL = process.env.MongoURL; // from .env
  const DB = process.env.DB; // "CFT"

  mongoose
    .connect(`${MongoURL}/${DB}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("🚀 DataBase Connected"))
    .catch((reason) => {
      console.log(`💩 Unable to connect to DataBase \n${reason}`);
    });
};

module.exports = { connect };
