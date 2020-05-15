require("dotenv").config();
const express = require("express");
const server = express();
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("connected to database"));

server.use(express.json())

server.listen(PORT, () => console.log(`server started on ${PORT}`));
