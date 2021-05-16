function formatUser(user) {
  return {
    id: user._id,
    username: user.username,
    deposit: user.deposit,
    withdraw: user.withdraw,
    color: user.color,
    room: user.room,
    searching: false,
    playing: user.playing,
    opponent: user.opponent,
    gameId: user.gameId,
  };
}
function removeSearching(requestPlays, data) {
  for (const room in requestPlays) {
    let index = requestPlays[room].findIndex((user) => {
      return (user.token.id = data.token.id);
    });
    if (index !== -1) {
      requestPlays[room].splice(index, 1);
    }
  }
}
function realFigure(figure) {
  const fake = ["one", "five", "ten", "twenty", "fifty"];
  const real = [1, 5, 10, 20, 50];
  let index = fake.findIndex((e) => {
    return e == figure;
  });
  return real[index];
}
exports.formatUser = formatUser;
exports.removeSearching = removeSearching;
exports.realFigure = realFigure;
