function updateDisplay() {
  displayUsername.innerText = user.username;
  displayDeposit.innerText = user.deposit;
  displayWithdraw.innerText = user.withdraw;
  rooms.value = user.room;
  requestPlay.disabled = user.searching;
  online.innerText = onlineSize ?? "";
  searching.innerText = searchingSize ?? "";
  if (token) {
    login.disabled = true;
  }
}

function validate(type) {
  //auth
  if (type === "auth") {
    if (username.value === "" || password.value === "") {
      return {
        fail: true,
        message: "username and password must be filled",
      };
    }
  }
}

function realFigure(figure) {
  const fake = ["five", "ten", "twenty", "fifty"];
  const real = [5, 10, 20, 50];
  let index = fake.findIndex((e) => {
    return e == figure;
  });
  return real[index];
}
function getData(additional = {}) {
  return {
    token,
    user,
    ...additional,
  };
}
function initGame() {
  var config = {
    draggable: true,
    position: "start",
    onDrop: handleMove,
    orientation: user.color,
  };
  board = ChessBoard("gameBoard", config);
}

function handleMove(source, target) {
  let data = { token, user, move: { from: source, to: target } };
  socket.emit("move", data);
}
