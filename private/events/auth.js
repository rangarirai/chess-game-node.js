let { register } = require("../database/register");
let { login } = require("../database/login");
function auth(io, socket, requestPlays) {
  socket.on("register", async (data) => {
    let response = await register(data);
    // optional chaining operator
    if (response?.status === "pass") {
      socket.join(response.data.user.room);
    }
    socket.emit("register", { ...response });
  });
  socket.on("login", async (data) => {
    let response = await login(data);
    if (response?.status === "pass") {
      socket.join(response.data.user.room);
      socket.join(`${response.data.token.id}`);
    }
    let clients = io.sockets.adapter.rooms.get(response.data.user.room);
    socket.emit("login", { ...response });
    io.to(response.data.user.room).emit("onlineSize", clients.size);
    io.to(response.data.user.room).emit(
      "searchingSize",
      requestPlays[response.data.user.room]?.length
    );
  });
}

exports.auth = auth;
