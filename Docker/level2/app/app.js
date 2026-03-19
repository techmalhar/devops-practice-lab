const express = require("express");
const mongoose = require("mongoose");

const app = express();

mongoose.connect("mongodb://mongo:27017/test");

app.get("/", (req, res) => {
  res.send("Hello from Level 3 🚀");
});

app.listen(3000, () => {
  console.log("App running on port 3000");
});
