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
var userSchema = new schema({
  _id: String,
  username: String,
  count: Number,
  log: [{ description: String, duration: Number, date: String }],
});
let User = mongoose.model("user", userSchema);

//Create new user
app.post("/api/exercise/new-user", function (req, res) {
  let username = req.body.username;
  let usertoadd = new User({
    _id: crypto.randomBytes(8).toString("hex"),
    username: username,
    count: 0,
  });
  usertoadd.save(function (err, data) {
    if (err)
      return res
        .status(500)
        .json({ error: "An error occured creating the accoount" });
    res.json({ username: data.username, _id: data._id });
  });
});

//Add exercise
app.post("/api/exercise/add", function (req, res) {
  //Get the details from the body
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;

  let workoutToAdd = {
    description: description,
    duration: duration,
    date: date,
  };

  User.findById({ _id: userId }, function (err, idFound) {
    if (err) return res.status(500).json({ erorr: err });
    idFound.log.push(workoutToAdd);
    idFound.count = idFound.count + 1;
    idFound.save(function (err, data) {
      if (err) return res.status(500).json({ erorr: err });
      //Return the data saved to the database to the user
      res.json({
        username: idFound.username,
        description: description,
        duration: duration,
        date: date,
        _id: data._id,
      });
    });
  });
});

//Get exercise log
app.get("/api/exercise/log", function (req, res) {
  //REQUIRED
  let userid = req.query.userId;
  //OPTIONAL
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  //Only return all workouts when all the optional parameters are empty
  if (from == undefined || to == undefined || limit == undefined) {
    getAllExercises(req, res, userid);
  }
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

//Return all exercise logs to the user
function getAllExercises(req, res, userid) {
  User.findById(userid, function (err, data) {
    if (err) return res.status(500).json({ error: err });
    //Return all the exercises
    res.json(data);
  });
}
