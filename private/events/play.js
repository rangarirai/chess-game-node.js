const { create, setGameDetails, move } = require("../game");
const { update } = require("../database/update");
const { hasEnoughMoney } = require("../database/check");
const { realFigure } = require("../helper");

function play(io, socket, requestPlays) {
  socket.on("requestPlay", async (data) => {
    let has = await hasEnoughMoney(data);
    if (has?.status == "fail") {
      return socket.emit("error", has.message);
    }
    let isRequesting = requestPlays[data.user.room].find((user) => {
      return user.token.id == data.token.id;
    });
    if (isRequesting) {
      return socket.emit("error", "you are already searching");
    }
    socket.join(data.token.id);
    socket.emit("updateUser", { ...data.user, searching: true });
    requestPlays[data.user.room].push({
      socket,
      user: data.user,
      token: data.token,
    });
    io.to(data.user.room).emit(
      "searchingSize",
      requestPlays[data.user.room].length
    );

    approveRequest(io, socket, requestPlays, data.user.room);
  });
  socket.on("move", async (data) => {
    if (!data.user.playing) {
      return socket.emit("error", "please request to play");
    }
    socket.join(data.token.id);

    let res = move(socket, data.token, data.user.gameId, data.move);
    if (res?.status === "fail") {
      return socket.emit("error", res.message);
    }
    if (res?.status === "success") {
      socket.broadcast.to(data.user.opponent).emit("newPosition", res.position);
      socket.emit("newPosition", res.position);
    }
    if (res?.status === "checkmate") {
      socket.broadcast.to(data.user.opponent).emit("newPosition", res.position);
      socket.emit("newPosition", res.position);
      socket.broadcast.to(data.user.opponent).emit("gameOver", res.message);
      socket.emit("gameOver", res.message);
      let resUpdate = await update("gameOver", res.players);
      resUpdate.forEach((user) => {
        if (user.id == data.token.id) {
          socket.emit("updateUser", user);
        } else {
          socket.broadcast.to(data.user.opponent).emit("updateUser", user);
        }
      });
    }
    if (res?.status === "draw") {
      socket.broadcast.to(data.user.opponent).emit("newPosition", res.position);
      socket.broadcast.to(data.user.opponent).emit("gameOver", res.message);
      socket.emit("gameOver", res.message);
    }
  });
}
exports.play = play;

async function approveRequest(io, socket, requestPlays, room) {
  let index = getIndex(socket, requestPlays, room);
  if (isOdd(index)) {
    let match = requestPlays[room].splice(index - 1, 2);
    io.to(room).emit("searchingSize", requestPlays[room].length);
    let gameId = `${match[0].token.id}${match[1].token.id}`;
    let match0Color = assignColor(0, match[0].user.color, match[1].user.color);
    let match1Color = assignColor(1, match[1].user.color, match[0].user.color);
    //create game
    let gamesRef = create(gameId);
    let gamesDetailsRef = setGameDetails(gameId, {
      [match[0].token.id]: match0Color,
      [match[1].token.id]: match1Color,
      room,
      fen: null,
      players: [match[0].token.id, match[1].token.id],
      time: {
        players: [match[0].token.id, match[1].token.id],
        clock: null,
        abort: 0,
        [match[0].token.id]: 420, //420 sec = 7 mins
        [match[1].token.id]: 420,
        start: function (opponent, gameId, realFigure, games, gamesDetails) {
          this.clock = setInterval(async () => {
            this[opponent] = this[opponent] - 1;
            if (this.abort !== 2 && this[opponent] <= 400) {
              await this.killGame(
                "abort",
                opponent,
                gameId,
                realFigure,
                games,
                gamesDetails
              );
            }

            this.players.forEach((playerId) => {
              io.to(playerId).emit("time", [
                { id: match[0].token.id, time: this[match[0].token.id] },
                { id: match[1].token.id, time: this[match[1].token.id] },
              ]);
            });
            if (this[opponent] <= 0) {
              await this.killGame(
                "timeOut",
                opponent,
                gameId,
                realFigure,
                games,
                gamesDetails
              );
            }
          }, 1000);
        },
        stop: function () {
          clearInterval(this.clock);
          if (this.abort !== 2) {
            this.abort = this.abort + 1;
          }
        },
        killGame: async function (
          type,
          opponent,
          gameId,
          realFigure,
          games,
          gamesDetails
        ) {
          this.stop();
          let gameTemp = games[gameId];
          let gameDetailsTemp = gamesDetails[gameId];
          delete games[gameId];
          delete gamesDetails[gameId];
          let gameOverData = null;
          if (type === "abort") {
            gameOverData = {
              message: `game aborted`,
            };
            this.players.forEach((playerId) => {
              io.to(playerId).emit("gameOver", gameOverData.message);
            });
          }
          if (type === "timeOut") {
            let amount = realFigure(gameDetailsTemp.room);
            let wins = gameDetailsTemp.players.find((player) => {
              return player !== opponent;
            });
            gameOverData = {
              message: `${gameDetailsTemp[wins]} wins`,
              players: [
                { id: wins, amount },
                { id: opponent, amount: -amount },
              ],
            };
            this.players.forEach((playerId) => {
              io.to(playerId).emit("gameOver", gameOverData.message);
            });
            let resUpdate = await update("gameOver", gameOverData.players);
            resUpdate.forEach((user) => {
              io.to(`${user.id}`).emit("updateUser", user);
            });
          }
        },
      },
    });
    let oppIdNew =
      match0Color == "white"
        ? match[0].token.id
        : match1Color == "white"
        ? match[1].token.id
        : "";

    await update("color", [
      {
        token: match[0].token,
        color: match0Color,
        gameId,
        opponent: match[1].token.id,
      },
      {
        token: match[1].token,
        color: match1Color,
        gameId,
        opponent: match[0].token.id,
      },
    ]);

    //give the client the id of your opponent
    match[0].socket.emit("requestPlayApproved", {
      gameId,
      opponent: match[1].token.id,
      color: match0Color,
    });
    match[1].socket.emit("requestPlayApproved", {
      gameId,
      opponent: match[0].token.id,
      color: match1Color,
    });

    gamesDetailsRef[gameId].time.start(
      oppIdNew,
      gameId,
      realFigure,
      gamesRef,
      gamesDetailsRef
    );
  }
}
function isOdd(num) {
  return num % 2;
}
function getIndex(socket, requestPlays, room) {
  let index = requestPlays[room].findIndex((socketRef) => {
    return socket.id === socketRef.socket.id;
  });
  return index;
}
function assignColor(index, prevColor, opponentPrevColor) {
  if (prevColor !== "" && opponentPrevColor !== "") {
    if (prevColor !== opponentPrevColor) {
      return opponentPrevColor;
    }
  }
  if (index === 1) {
    return "white";
  }
  return "black";
}
