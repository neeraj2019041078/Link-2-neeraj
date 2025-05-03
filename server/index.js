const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const rooms = {}; 

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);


  socket.on("create-room", (roomId) => {
    rooms[roomId] = [socket.id];
    socket.join(roomId);
    console.log(`Room ${roomId} created by ${socket.id}`);
  });

  
  socket.on("join-room", (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    }
  });

  // Guest initiates call
  socket.on("call-admin", (roomId) => {
    const participants = rooms[roomId] || [];
    const adminSocketId = participants[0]; // First one is always admin
    if (adminSocketId) {
      io.to(adminSocketId).emit("incoming-call", { from: socket.id });
      console.log(`Guest ${socket.id} calling Admin ${adminSocketId}`);
    }
  });


  socket.on("offer", ({ target, sdp }) => {
    io.to(target).emit("offer", { from: socket.id, sdp });
  });

  
  socket.on("answer", ({ target, sdp }) => {
    io.to(target).emit("answer", { from: socket.id, sdp });
  });

  
  socket.on("ice-candidate", ({ target, candidate }) => {
    io.to(target).emit("ice-candidate", { candidate });
  });


  socket.on("end-call", ({ target }) => {
    io.to(target).emit("call-ended");
  });

 
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 1200;
server.listen(PORT,"0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
