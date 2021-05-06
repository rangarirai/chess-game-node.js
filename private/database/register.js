const { User } = require("../models/userModel");
const { userDefaultFields } = require("../models/userStructure");
const { formatUser } = require("../helper");
const { createToken } = require("../manageToken");
const {logger} = require("../logger")
async function register(data) {
  try {
    let user = await User.findOne({ username: `${data.username}` }).exec();
    if (user) {
      return { status: "fail", message: "username already taken" };
    }
    let newUser = new User({ ...userDefaultFields, ...data });
    let saveUser = await newUser.save();
    if (!saveUser) {
      return { status: "fail", message: "failed to save user" };
    }

    let token = createToken({ id: saveUser._id });
    let returnData = {
      token,
      user: formatUser(saveUser),
    };
    return { status: "pass", data: returnData };
  } catch (error) {
    logger.error(`${error.name}\n ${error.message}\n ${error.stack}\n`);
  }
}

exports.register = register;
