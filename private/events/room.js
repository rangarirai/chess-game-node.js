const { update } = require("../database/update");
const { removeSearching } = require("../helper");
function room(io, socket, requestPlays) {
  socket.on("joinRoom", async (data) => {
    removeSearching(requestPlays, data);
    let rooms = ["five", "ten", "twenty", "fifty"];
    rooms.forEach((room) => {
      socket.leave(room);
    });
    socket.join(data.room);
    let newUser = { ...data.user, room: data.room, searching: false };
    let result = await update("room", { token: data.token, user: newUser });
    //shorter way of saying
    //(result && result.status === "fail")
    // optional chaining operator
    if (result?.status === "fail") {
      return socket.emit("error", result.message);
    }
    socket.emit("updateUser", newUser);
    let clients = io.sockets.adapter.rooms.get(data.room);
    io.to(data.room).emit("onlineSize", clients.size);
  });
}

exports.room = room;
