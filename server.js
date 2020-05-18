require("dotenv").config();
const express = require("express");
const server = express();
const mongoose = require("mongoose");

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("connected to database"));

server.use(express.json())

//Routes
server.use("/auth", require('./auth/authentication'))


module.exports = server
