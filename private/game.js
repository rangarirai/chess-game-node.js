const { Chess } = require("chess.js");
const { realFigure } = require("./helper");
const { update } = require("./database/update");
let games = {};
let gamesDetails = {};
function create(id) {
  let game = new Chess();
  games[id] = game;
  return games;
}

function setGameDetails(id, details) {
  gamesDetails[id] = details;
  return gamesDetails;
}
function move(socket, token, gameId, move) {
  //TODO: check if user is didn't change gameid and opponent id.
  //TODO: i could recreate a token when game starts with gameid and opponentid
  if (!games[gameId] || !gamesDetails[gameId]) {
    return { status: "fail", message: "game not available" };
  }
  if (gamesDetails[gameId][token.id].slice(0, 1) !== games[gameId].turn()) {
    socket.emit("newPosition", games[gameId].fen());
    return { status: "fail", message: "it's not your turn" };
  }

  let result = games[gameId].move(move);
  if (result === null) {
    socket.emit("newPosition", games[gameId].fen());
    return { status: "fail", message: "invalid move" };
  }

  gamesDetails[gameId].fen = games[gameId].fen();
  //TODO: save game to database
  // update(gamesDetails[gameId]);

  if (games[gameId].game_over()) {
    gamesDetails[gameId].time.stop();
    let gameTemp = games[gameId];
    let gameDetailsTemp = gamesDetails[gameId];

    delete games[gameId];
    delete gamesDetails[gameId];

    if (gameTemp.in_checkmate()) {
      let amount = realFigure(gameDetailsTemp.room);
      let loses = gameDetailsTemp.players.find((player) => {
        return player !== token.id;
      });

      return {
        status: "checkmate",
        message: `${gameDetailsTemp[token.id]} wins`,
        position: gameTemp.fen(),
        players: [
          { id: token.id, amount },
          { id: loses, amount: -amount },
        ],
      };
    }
    return {
      status: "draw",
      message: `game over by${statement(gameTemp)}`,
      position: gameTemp.fen(),
    };
  }
  let oppId = gamesDetails[gameId].players.find((player) => {
    return player !== token.id;
  });
  gamesDetails[gameId].time.stop();
  gamesDetails[gameId].time.start(
    oppId,
    gameId,
    realFigure,
    games,
    gamesDetails
  );

  return { status: "success", position: games[gameId].fen() };
}

exports.create = create;
exports.setGameDetails = setGameDetails;
exports.move = move;

function statement(game) {
  return game.insufficient_material()
    ? "insufficient material"
    : game.in_threefold_repetition()
    ? "threefold repetition"
    : game.in_stalemate()
    ? "stalemate"
    : game.in_draw()
    ? "draw"
    : "dont know";
}
