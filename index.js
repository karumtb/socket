// signaling-server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" } // Allow CORS for all origins (for testing)
});
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user joining a room
  socket.on('join', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Relay signaling messages only within the same room
  socket.on('signal', (data) => {
    const roomId = socket.roomId;
    if (roomId) {
      // Emit to all other clients in the room except sender
      socket.to(roomId).emit('signal', data);
      console.log(`Signal from ${socket.id} relayed to room ${roomId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.roomId) {
      socket.leave(socket.roomId);
    }
  });
});

server.listen(3000, () => {
  console.log('Socket.IO signaling server running on http://localhost:3000');
});

