import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@/types/user';

let users: User[] = [];
let votes: { [key: string]: number | null } = {};
let revealed = false;

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!(res.socket as any).server.io) {
    console.log('Socket is initializing');
    const io = new SocketIOServer((res.socket as any).server);
    (res.socket as any).server.io = io;

    io.on('connection', (socket) => {
      console.log('New client connected');

      socket.on('join', (user: User, callback) => {
        users = users.filter(u => u.id !== user.id);

        // Add the new or updated user
        users.push(user);

        // Ensure there's a vote entry for this user
        if (!(user.id in votes)) {
          votes[user.id] = null;
        }

        io.emit('users', users);
        io.emit('votes', votes);
        callback({ users, votes, revealed });
      });

      socket.on('vote', ({ userId, value }, callback) => {
        votes[userId] = value;
        io.emit('votes', votes);
        callback({ votes });
      });

      socket.on('reveal', (callback) => {
        revealed = true;
        io.emit('revealed', revealed);
        io.emit('votes', votes);
        callback({ revealed, votes });
      });

      socket.on('reset', (callback) => {
        votes = Object.fromEntries(Object.keys(votes).map(key => [key, null]));
        revealed = false;
        io.emit('votes', votes);
        io.emit('revealed', revealed);
        callback({ votes, revealed });
      });

      socket.on('throwEmoji', ({ targetUserId, emoji, startX, startY }, callback) => {
        io.emit('emojiThrow', { targetUserId, emoji, startX, startY });
        callback({ emojiThrow: { targetUserId, emoji, startX, startY } });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
        users = users.filter(user => user.id !== socket.id);
        delete votes[socket.id];
        io.emit('users', users);
        io.emit('votes', votes);
      });
    });
  }
  res.end();
};

export default SocketHandler;
