import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!res.socket || !(res.socket as any).server) {
    res.status(500).json({ error: 'Server socket not available' });
    return;
  }

  if ((res.socket as any).server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Socket is initializing');
  const io = new Server((res.socket as any).server);
  (res.socket as any).server.io = io;

  const users: { id: string; name: string; role: 'Estimator' | 'Observer' }[] = [];
  const votes: { [key: string]: number | null } = {};

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (user) => {
      const newUser = { ...user, id: socket.id };
      users.push(newUser);
      io.emit('users', users);
    });

    socket.on('vote', (value) => {
      votes[socket.id] = value;
      io.emit('votes', votes);
    });

    socket.on('reveal', () => {
      const summary = calculateSummary(votes);
      if (summary) {
        io.emit('reveal', votes, summary);
      }
    });

    socket.on('reset', () => {
      Object.keys(votes).forEach(key => votes[key] = null);
      io.emit('reset');
      io.emit('votes', votes);
    });

    socket.on('disconnect', () => {
      const index = users.findIndex((u) => u.id === socket.id);
      if (index !== -1) {
        users.splice(index, 1);
        delete votes[socket.id];
        io.emit('users', users);
        io.emit('votes', votes);
      }
    });
  });

  res.end();
};

function calculateSummary(votes: { [key: string]: number | null }) {
  const validVotes = Object.values(votes).filter((v): v is number => v !== null);
  if (validVotes.length === 0) return null;

  const lowest = Math.min(...validVotes);
  const highest = Math.max(...validVotes);
  const average = validVotes.reduce((sum, value) => sum + value, 0) / validVotes.length;

  return { lowest, highest, average };
}

export default SocketHandler;
