const { createLogger, transports, format } = require("winston");
require("winston-mongodb");
require("dotenv").config();
let dbUsername = process.env.DBUSERNAME;
let dbPassword = process.env.DBPASSWORD;
let dbName = process.env.DBNAME;

let uri = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.jwrkj.mongodb.net/${dbName}?retryWrites=true&w=majority`;
const logger = createLogger({
  transports: [
    new transports.MongoDB({
      level: "error",
      db: uri,
      collection: "logs",
      format: format.combine(format.timestamp(), format.json()),
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    }),
  ],
});

exports.logger = logger;
// logger.error(err) @usage
