const express = require("express"),
  app = express();
cors = require("cors");

app.use(cors({ optionSuccessStatus: 200 })); // some legacy browsers choke on 204
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

// your first API endpoint...
app.get("/api/whoami", function (req, res) {
  res.json({
    ipaddress: req.headers.host,
    language: req.headers["accept-language"],
    software: req.headers["user-agent"],
  });
});

// listen for requests :)
var listener = app.listen("8765", function () {
  console.log("Your app is listening on port " + listener.address().port);
});
