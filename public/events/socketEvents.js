socket.on("newPosition", (newPosition) => {
  board.position(newPosition);
});
socket.on("login", (response) => {
  if (response.status !== "fail") {
    user = response.data.user;
    token = response.data.token;
    if (user.playing) {
      initGame();
    }
    updateDisplay();
    return;
  }
  alert(response.message);
});
socket.on("register", (response) => {
  if (response.status !== "fail") {
    user = response.data.user;
    token = response.data.token;
    updateDisplay();
    return;
  }
  alert(response.message);
});
socket.on("updateUser", (response) => {
  user = response;
  updateDisplay();
});
socket.on("error", (message) => {
  alert(message);
});
socket.on("gameOver", (message) => {
  alert(message);
});
socket.on("requestPlayApproved", (response) => {
  user.opponent = response.opponent;
  user.gameId = response.gameId;
  user.color = response.color;
  user.searching = false;
  user.playing = true;
  initGame();
  updateDisplay();
});
socket.on("time", (response) => {
  response.forEach((el) => {
    if (el.id == user.id) {
      self.innerText = el.time;
    } else {
      opponent.innerText = el.time;
    }
  });
});

socket.on("redirect", (destination) => {
  window.location.href = destination;
});

socket.on("searchingSize", (size) => {
  searchingSize = size;
  updateDisplay();
});
socket.on("onlineSize", (size) => {
  onlineSize = size;
  updateDisplay();
});
