const { User } = require("../models/userModel");
const { formatUser } = require("../helper");
const { createToken } = require("../manageToken");
const {logger} = require("../logger")

async function login(data) {
  try {
    let user = await User.findOne({ username: `${data.username}` }).exec();
    if (!user) {
      return { status: "fail", message: "wrong username or password" };
    }
    if (user.password !== data.password) {
      return { status: "fail", message: "wrong username or password" };
    }

    let token = createToken({ id: user._id });
    let returnData = {
      token,
      user: formatUser(user),
    };
    return { status: "pass", data: returnData };
  } catch (error) {
    logger.error(`${error.name}\n ${error.message}\n ${error.stack}\n`);
  }
}

exports.login = login;
