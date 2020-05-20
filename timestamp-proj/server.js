// server.js
// where your node app starts

// init project
var express = require("express");
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
app.use(cors({ optionSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

//Route for if no date_string specified
app.get("/api/timestamp", function (req, res) {
  let dateToReturn = new Date();
  res.json({ unix: dateToReturn.getTime(), utc: dateToReturn.toUTCString() });
});

app.get("/api/timestamp/:date_string*", function (req, res) {
  let date_string = req.params.date_string;
  let dateToReturn;

  dateToReturn = new Date(Number(date_string));
  //If we can't get a date, than the date given is a string
  if (!dateToReturn.getDate()) {
    let parsedDate = Date.parse(date_string);
    dateToReturn = new Date(parsedDate);
  }

  //If we still cant get a date, the string given is invalid
  if (!dateToReturn.getTime()) {
    //Return error message
    res.json({ error: "Invalid Date" });
  } else {
    //Date is valid, so we can return the date
    res.json({ unix: dateToReturn.getTime(), utc: dateToReturn.toUTCString() });
  }
});

// listen for requests :)
var listener = app.listen("8765", function () {
  console.log("Your app is listening on port " + listener.address().port);
});
