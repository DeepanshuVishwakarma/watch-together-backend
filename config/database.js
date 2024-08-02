const mongoose = require("mongoose");
require("dotenv").config();

MONGODB_URL =
  "mongodb://deepanshu:root@ac-9qz1yh2-shard-00-00.awzjbbs.mongodb.net:27017,ac-9qz1yh2-shard-00-01.awzjbbs.mongodb.net:27017,ac-9qz1yh2-shard-00-02.awzjbbs.mongodb.net:27017/watchtogether?ssl=true&replicaSet=atlas-ovje04-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

exports.connect = () => {
  mongoose
    .connect(MONGODB_URL)
    .then(() => {
      console.log("db connected successfully");
    })
    .catch((err) => {
      console.log("db connection failed");
      console.log(err);
      process.exit(1);
    });
};
