const jwtKey = process.env.JWT_KEY;
const jwt = require("jsonwebtoken");
const { logger } = require("./logger");
function tokenIsValid(socket) {
  socket.use(([event, ...args], next) => {
    if (event === "login" || event === "register") {
      return next();
    }
    if (!args[0].token) {
      return socket.emit("error", "please login");
    }

    let payload = isValid(args[0].token);
    if (!payload) {
      return socket.emit("error", "please login, token not valid");
    }
    args[0].token = payload;
    next();
  });
}
function createToken(payload) {
  let token = jwt.sign(payload, jwtKey);
  return token;
}
exports.tokenIsValid = tokenIsValid;
exports.createToken = createToken;

function isValid(token) {
  try {
    let payload = jwt.verify(token, jwtKey);
    return payload;
  } catch (error) {
    logger.error(`${error.name}\n ${error.message}\n ${error.stack}\n`);
  }
}
