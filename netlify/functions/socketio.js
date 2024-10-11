const { Server } = require('socket.io');
const { createServer } = require('http');

let users = [];
let votes = {};
let revealed = false;

exports.handler = async (event, context) => {
  const { httpMethod } = event;

  if (httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Parse the stringified event body
  const { type, payload } = JSON.parse(event.body);

  switch (type) {
    case 'connection':
      console.log('New client connected');
      return { statusCode: 200, body: JSON.stringify({ message: 'Connected' }) };

    case 'join':
      users = users.filter(u => u.id !== payload.id);
      users.push(payload);
      votes[payload.id] = null;
      return {
        statusCode: 200,
        body: JSON.stringify({ users, votes, revealed })
      };

    case 'vote':
      votes[payload.userId] = payload.value;
      return {
        statusCode: 200,
        body: JSON.stringify({ votes })
      };

    case 'reveal':
      revealed = true;
      return {
        statusCode: 200,
        body: JSON.stringify({ revealed, votes })
      };

    case 'reset':
      votes = Object.fromEntries(Object.keys(votes).map(key => [key, null]));
      revealed = false;
      return {
        statusCode: 200,
        body: JSON.stringify({ votes, revealed })
      };

    case 'throwEmoji':
      return {
        statusCode: 200,
        body: JSON.stringify({
          emojiThrow: {
            targetUserId: payload.targetUserId,
            emoji: payload.emoji,
            startX: payload.startX,
            startY: payload.startY
          }
        })
      };

    case 'disconnect':
      console.log('Client disconnected');
      users = users.filter(user => user.id !== payload.id);
      delete votes[payload.id];
      return {
        statusCode: 200,
        body: JSON.stringify({ users, votes })
      };

    default:
      return { statusCode: 400, body: 'Invalid event type' };
  }
};
