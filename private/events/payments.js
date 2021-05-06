const paypal = require("paypal-rest-sdk");
require("dotenv").config();
const { update } = require("../database/update");
const { success } = require("../templates/success");
const { logger } = require("../logger");

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.SANDBOXPAYPALCLIENTID,
  client_secret: process.env.SANDBOXPAYPALCLIENTSECRET,
});

function deposit(socket) {
  socket.on("toPaypal", (data) => {
    createPayment(socket, data);
  });
  socket.on("toWithdraw", async (data) => {
    let res = await update("localDeposit", data);
    if (res?.status === "fail") {
      return socket.emit("error", res.message);
    }
    socket.emit("updateUser", res);
  });
}
function processPayment(req, res) {
  let payerId = req.query.PayerID;
  let paymentId = req.query.paymentId;
  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: `${req.params.total}`,
        },
      },
    ],
  };
  paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
    if (error) {
      logger.error(`${error.name}\n ${error.message}\n ${error.stack}\n`);
    } else {
      getInfo(payment);
      res.send(
        success({
          link:
            process.env.NODE_ENV == "production"
              ? process.env.HOSTURL
              : process.env.LOCALHOSTURL,
        })
      );
    }
  });
}

exports.processPayment = processPayment;
exports.deposit = deposit;

function createPayment(socket, data) {
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: `${
        process.env.NODE_ENV == "production"
          ? process.env.HOSTURL
          : process.env.LOCALHOSTURL
      }/success/${data.amount}`,
      cancel_url: `${
        process.env.NODE_ENV == "production"
          ? process.env.HOSTURL
          : process.env.LOCALHOSTURL
      }/cancel`,
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: `${data.user.username}`,
              sku: `${data.token.id}`,
              price: `${data.amount}`,
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: `${data.amount}`,
        },
        description: "deposit",
      },
    ],
  };
  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      logger.error(`${error.name}\n ${error.message}\n ${error.stack}\n`);
    } else {
      payment.links.map((link) => {
        if (link.rel === "approval_url") {
          socket.emit("redirect", link.href);
        }
      });
    }
  });
}
async function getInfo(payment) {
  let id = payment.transactions[0].item_list.items[0].sku;
  let username = payment.transactions[0].item_list.items[0].name;
  let email = payment.payer.payer_info.email;
  let deposit = payment.transactions[0].amount.total;
  let transaction = {
    state: payment.state,
    payer: {
      status: payment.payer.status,
      payer_info: {
        email: payment.payer.payer_info.email,
      },
    },
    transactions: [
      {
        amount: {
          total: payment.transactions[0].amount.total,
          currency: payment.transactions[0].amount.currency,
        },
      },
    ],
    create_time: payment.create_time,
    update_time: payment.update_time,
  };

  await update("deposit", { username, id, email, deposit, transaction });
}
