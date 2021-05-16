//imports
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const { auth } = require("./events/auth");
const { room } = require("./events/room");
const { play } = require("./events/play");
const { handleDisconnect } = require("./events/disconnect");
const { processPayment, deposit, withdraw } = require("./events/payments");
const { tokenIsValid } = require("./manageToken");
const { cancel } = require("./templates/cancel");
const { logger } = require("./logger");

//register to process uncaughtexceptions and unhandledrejections
process.on("uncaughtException", function (error, origin) {
  // Handle the error safely
  logger.error(`${error.name}\n ${error.message}\n ${error.stack}\n`);
  console.log(`${error.stack}`);
});
process.on("unhandledRejection", function (error, promise) {
  // Handle the error safely
  logger.error(`${error.name}\n ${error.message}\n ${error.stack}\n`);
  console.log(`${error.stack}`);
});

//initiate
let app = express();
app.use(express.static("public"));
let localPortString = `${process.env.LOCALHOSTURL}`;
let localPort = +`${process.env.LOCALHOSTURL}`.slice(
  localPortString.length - 4
);
let port = process.env.PORT || localPort;
let dbUsername = process.env.DBUSERNAME;
let dbPassword = process.env.DBPASSWORD;
let dbName = process.env.DBNAME;

let uri = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.jwrkj.mongodb.net/${dbName}?retryWrites=true&w=majority`;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("server connected to db");
  app.get("/cancel", (req, res) => {
    res.send(cancel({ link: process.env.HOSTURL }));
  });
  app.get("/success/:total", (req, res) => {
    processPayment(req, res);
  });

  let http = require("http").Server(app);
  http.listen(port, function () {
    console.log("listening on *: ", port);
  });
  let io = require("socket.io")(http);

  //global letiable
  let requestPlays = {
    one: [],
    five: [],
    ten: [],
    twenty: [],
    fifty: [],
  };

  //io connect
  io.on("connection", (socket) => {
    tokenIsValid(socket);
    //register to authEvents
    auth(io, socket, requestPlays);
    //register to roomEvents
    room(io, socket, requestPlays);
    //register to playEvents
    play(io, socket, requestPlays);
    //handleDisconnents, ie clean the data of the socket disconnecting
    //that would cause errors in the app
    handleDisconnect(io, socket, requestPlays);

    //register to payments events
    deposit(socket);
  });
});
