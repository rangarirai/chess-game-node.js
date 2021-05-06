register.addEventListener("click", (e) => {
  e.preventDefault();
  let result = validate("auth");
  if (result && result.fail) {
    return alert(result.message);
  }
  socket.emit("register", {
    username: username.value,
    password: password.value,
  });
});
login.addEventListener("click", (e) => {
  e.preventDefault();
  let result = validate("auth");
  if (result && result.fail) {
    return alert(result.message);
  }
  socket.emit("login", {
    username: username.value,
    password: password.value,
  });
});
rooms.addEventListener("change", () => {
  socket.emit("joinRoom", getData({ room: rooms.value }));
});
requestPlay.addEventListener("click", () => {
  socket.emit("requestPlay", getData());
});
fromWithdraw.addEventListener("click", (e) => {
  e.preventDefault();
  let res = confirm(
    `deposit $${realFigure(rooms.value)} from withdraw account`
  );
  if (res) {
    socket.emit("toWithdraw", getData({ amount: realFigure(rooms.value) }));
  }
});
fromPaypal.addEventListener("click", (e) => {
  e.preventDefault();
  let res = confirm(`deposit $${realFigure(rooms.value)} from paypal account`);
  if (res) {
    socket.emit("toPaypal", getData({ amount: realFigure(rooms.value) }));
  }
});
