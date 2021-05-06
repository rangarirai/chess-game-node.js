const { User } = require("../models/userModel");
const { realFigure } = require("../helper");
const { logger } = require("../logger");
async function hasEnoughMoney(data) {
  try {
    let user = await User.findOne({ _id: `${data.token.id}` }).exec();
    if (realFigure(data.user.room) < 0) {
      return { status: "fail", message: "invalid amount" };
    }
    if (user.deposit < realFigure(data.user.room)) {
      return { status: "fail", message: "insufficient deposit" };
    }

    return { status: "pass" };
  } catch (error) {
    logger.error(`${error.name}\n ${error.message}\n ${error.stack}\n`);
  }
}
exports.hasEnoughMoney = hasEnoughMoney;
