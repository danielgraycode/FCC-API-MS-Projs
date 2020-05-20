"use strict";
require("dotenv").config();
var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var Schema = mongoose.Schema;
var crypto = require("crypto");
var dns = require("dns");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = 8765;

mongoose.connect(process.env.DB_URI);
var urlSchema = new Schema({
  original_url: String,
  short_url: String,
});
var URL = mongoose.model("URL", urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl/new", function (req, res) {
  //Check the URL is valid
  let hostname = req.body.url.split("/");
  dns.lookup(hostname[2], function (error) {
    //If hostname is invalid
    if (error) {
      res.json({ error: "Invalid URL" });
    } else {
      //Make the new url object
      let newurl = new URL({
        original_url: req.body.url,
        short_url: crypto.randomBytes(8).toString("hex"),
      });
      //Save the new url to the database
      newurl.save(function (error, data) {
        if (error) return console.log(error);
        //Show the user the url they shortened and the short url path
        res.json({
          original_url: data.original_url,
          short_url: data.short_url,
        });
      });
    }
  });
});

app.get("/api/shorturl/:shorturl*", function (req, res) {
  //Get the short url
  let short_url = req.params.shorturl;
  //Query database
  URL.find({ short_url: short_url }, function (error, data) {
    if (error) return console.erorr(error);
    //If URL found redirect, otherwise return an error
    if (data) {
      res.redirect(data[0].original_url);
    } else {
      res.status(404).json({ error: "Invalid URL" });
    }
  });
});

app.listen(port, function () {
  console.log("Node.js listening ...");
});
