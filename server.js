const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

let users = [];
let votes = {};
let revealed = false;

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', (user) => {
    users = users.filter(u => u.id !== user.id);
    users.push(user);
    if (!(user.id in votes)) {
      votes[user.id] = null;
    }
    io.emit('users', users);
    io.emit('votes', votes);
    io.emit('revealed', revealed);
  });

  socket.on('vote', ({ userId, value }) => {
    votes[userId] = value;
    io.emit('votes', votes);
  });

  socket.on('reveal', () => {
    revealed = true;
    io.emit('revealed', revealed);
    io.emit('votes', votes);
  });

  socket.on('reset', () => {
    votes = Object.fromEntries(Object.keys(votes).map(key => [key, null]));
    revealed = false;
    io.emit('votes', votes);
    io.emit('revealed', revealed);
  });

  socket.on('throwEmoji', ({ targetUserId, emoji, startX, startY }) => {
    io.emit('emojiThrow', { targetUserId, emoji, startX, startY });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    users = users.filter(user => user.id !== socket.id);
    delete votes[socket.id];
    io.emit('users', users);
    io.emit('votes', votes);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
