const { Server } = require('socket.io');
const { createServer } = require('http');

let users = [];
let votes = {};
let revealed = false;

exports.handler = async (event, context) => {
  const { httpMethod, headers } = event;

  if (httpMethod !== 'POST' && httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (headers['upgrade'] !== 'websocket') {
    return { statusCode: 426, body: 'Upgrade Required' };
  }

  const server = createServer();
  const io = new Server(server);

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

  return new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      resolve({
        statusCode: 200,
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
          'Sec-WebSocket-Accept': 'HSmrc0sMlYUkAGmm5OPpG2HaGWk=',
        },
        body: '',
      });
    });
  });
};
