const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);

  socket.on('join', (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const numClients = room ? room.size : 0;

    if (numClients >= 2) {
      socket.emit('room_full');
      console.log(`❌ Room ${roomId} full. Disconnecting ${socket.id}`);
      socket.disconnect();
      return;
    }

    socket.join(roomId);
    socket.roomId = roomId;

    console.log(`👤 User ${socket.id} joined room ${roomId}`);

    if (io.sockets.adapter.rooms.get(roomId).size === 2) {
      console.log(`✅ Room ${roomId} is ready`);
      io.to(roomId).emit('ready');
    }
  });

  socket.on('signal', (data) => {
    const roomId = socket.roomId;
    if (roomId) {
      socket.to(roomId).emit('signal', data);
      console.log(`📡 Signal relayed in room ${roomId} from ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId) {
      socket.leave(roomId);
      console.log(`🔌 User ${socket.id} left room ${roomId}`);
      const room = io.sockets.adapter.rooms.get(roomId);
      if (!room || room.size === 0) {
        console.log(`🧹 Room ${roomId} is now empty and can be cleaned up`);
      }
    }
  });
});

server.listen(3000, () => {
  console.log('🚀 Socket.IO signaling server running on http://localhost:3000');
});
