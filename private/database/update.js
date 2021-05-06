const { User } = require("../models/userModel");
const { formatUser } = require("../helper");
const {logger} = require("../logger")

async function update(type, data) {
  try {
    switch (type) {
      case "deposit":
        await deposit(data);
        break;
      case "localDeposit":
        return await localDeposit(data);
      case "color":
        await color(data);
        break;
      case "gameOver":
        return await gameOver(data);
      case "room":
        await room(data);
        break;
      default:
        break;
    }
  } catch (error) {
    logger.error(`${error.name}\n ${error.message}\n ${error.stack}\n`);
  }
}

exports.update = update;

async function deposit(data) {
  await User.findOneAndUpdate(
    { _id: data.id },
    {
      $inc: { deposit: data.deposit },
      ...(data.transaction
        ? { $push: { transactions: data.transaction } }
        : {}),
      ...(data.email ? { paypalAddress: data.email } : {}),
    }
  );
}
async function localDeposit(data) {
  let user = await User.findOne({ _id: `${data.token.id}` }).exec();
  if (data.amount <= 0) {
    return { status: "fail", message: "enter valid amount" };
  }

  if (user.withdraw < data.amount) {
    return { status: "fail", message: "insufficient balance" };
  }
  let result = await User.findOneAndUpdate(
    { _id: data.token.id },
    {
      $inc: { deposit: data.amount, withdraw: -data.amount },
    },
    {
      new: true,
    }
  );
  let resultFormat = formatUser(result);
  return resultFormat;
}

async function color(data) {
  let result = await User.bulkWrite([
    {
      updateOne: {
        filter: { _id: data[0].token.id },
        update: {
          $set: {
            color: data[0].color,
            playing: true,
            gameId: data[0].gameId,
            opponent: data[0].opponent,
          },
        },
      },
    },
    {
      updateOne: {
        filter: { _id: data[1].token.id },
        update: {
          $set: {
            color: data[1].color,
            playing: true,
            gameId: data[1].gameId,
            opponent: data[1].opponent,
          },
        },
      },
    },
  ]);
}
async function room(data) {
  await User.findOneAndUpdate(
    { _id: data.token.id },
    {
      $set: { room: data.user.room },
    }
  );
}
async function gameOver(data) {
  await User.bulkWrite([
    {
      updateOne: {
        filter: { _id: data[0].id },
        update: {
          $inc: {
            deposit: -data[0].amount,
            withdraw: data[0].amount + 0.7 * data[0].amount,
          },
          $set: {
            playing: false,
          },
        },
      },
    },
    {
      updateOne: {
        filter: { _id: data[1].id },
        update: {
          $inc: {
            deposit: data[1].amount,
          },
          $set: {
            playing: false,
          },
        },
      },
    },
  ]);
  let res = await User.find({
    _id: { $in: [data[0].id, data[1].id] },
  });
  let usersRes = res.map((user) => {
    return formatUser(user);
  });
  return usersRes;
}
