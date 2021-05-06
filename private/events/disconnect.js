function handleDisconnect(io, socket, requestPlays) {
  socket.on("disconnecting", () => {
    //update onlinesize
    let rooms = ["five", "ten", "twenty", "fifty"];
    let savedRoom;
    rooms.forEach((room) => {
      if (socket.rooms.has(room)) {
        savedRoom = room;
        let clients = io.sockets.adapter.rooms.get(room);
        io.to(room).emit("onlineSize", clients.size - 1);
      }
    });
    // remove the socket from the requestPlays array
    let delIndex = requestPlays[savedRoom]?.findIndex((el) => {
      return el.socket.id == socket.id;
    });
    if (delIndex !== -1) {
      requestPlays[savedRoom]?.splice(delIndex, 1);
    }
    io.to(savedRoom).emit("searchingSize", requestPlays[savedRoom]?.length);
  });
}

exports.handleDisconnect = handleDisconnect;
