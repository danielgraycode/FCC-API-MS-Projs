require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const crypto = require("crypto");

const cors = require("cors");

const mongoose = require("mongoose"),
  schema = mongoose.Schema;

mongoose.connect(process.env.DB_URI || "mongodb://localhost/exercise-track");

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//Setup mongoose
var UserSchema = new mongoose.Schema({
  _id: String,
  username: String,
  log: [{ description: String, duration: Number, date: String }],
});

var User = mongoose.model("User", UserSchema);

//Create new user
app.post("/api/exercise/new-user", function (req, res) {
  let username = req.body.username;
  let usertoadd = new User({
    _id: crypto.randomBytes(8).toString("hex"),
    username: username,
    count: 0,
  });
  usertoadd.save(function (err, newuser) {
    if (err) return res.status(500).json({ error: error });
    res.json({ username: newuser.username, _id: newuser._id });
  });
});

app.post("/api/exercise/add", async function (req, res) {
  const userId = req.body.userId;
  const description = req.body.description;
  const duration = Number(req.body.duration);
  let date;

  if (!req.body.date || req.body.date === "") {
    date = Date.now();
  } else {
    date = req.body.date;
  }

  //Show them the nice formatted date
  let userDate = new Date(date).toDateString();
  let userFound = await User.findById(userId);
  if (userFound) {
    //Push the exercise to the log array
    userFound.log.push({ description, duration, date });
    //Save the updated user
    userFound.save(function (err, user) {
      if (err) return res.status(500).error({ error: err });

      res.json({
        username: user.username,
        description: description,
        duration: duration,
        _id: user._id,
        date: userDate,
      });
    });
  }
});

app.get("/api/exercise/log", async function (req, res) {
  // pull query params off the URL
  const userId = req.query.userId;
  const fromDate = req.query.from;
  const toDate = req.query.to;
  const limit = req.query.limit;

  var user = await User.findById(userId).sort("-date");
  if (user._id) {
    let userVal = {
      _id: user._id,
      username: user.username,
    };
    let logs = user.log.filter((log) => {
      if (fromDate) {
        let fd = new Date(fromDate);
        userVal.from = fd.toString().split(" ").slice(0, 4).join(" ");
        if (toDate) {
          let td = new Date(toDate);
          userVal.to = td.toString().split(" ").slice(0, 4).join(" ");
          return log.date >= fd && log.date <= td;
        }
        return log.date >= fd;
      } else if (toDate) {
        let td = new Date(toDate);
        userVal.to = td.totring().split(" ").slice(0, 4).join(" ");
        return log.date <= td;
      }
      return true;
    });
    if (limit) {
      logs = logs.slice(0, limit);
    }
    let fixedLog = logs.map((log) => {
      console.log(log);
      return {
        date: new Date(log.date).toDateString(),
        description: log.description,
        duration: log.duration,
      };
    });

    userVal.count = logs.length;
    userVal.log = fixedLog;

    res.send(userVal);
  } else {
    res.send("unknown userId");
  }
});

//Return all users
app.get("/api/exercise/users", function (req, res) {
  User.find().exec(function (err, data) {
    if (err) return res.status(500).json({ error: err });
    res.json(data);
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res.status(errCode).type("txt").send(errMessage);
});

const listener = app.listen("8765", () => {
  console.log("Your app is listening on port " + listener.address().port);
});
