import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@/types/user';

let users: User[] = [];
let votes: { [key: string]: number | null } = {};
let revealed = false;
let clients: NextApiResponse[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);

    sendUpdate(res);

    req.on('close', () => {
      clients = clients.filter(client => client !== res);
    });
  } else if (req.method === 'POST') {
    const { action, userId, value, user } = req.body;

    switch (action) {
      case 'join':
        const newUser = user as User;
        const existingUserIndex = users.findIndex(u => u.id === newUser.id);
        if (existingUserIndex !== -1) {
          users[existingUserIndex] = newUser;
        } else {
          users.push(newUser);
          votes[newUser.id] = null;
        }
        break;
      case 'vote':
        votes[userId] = value;
        break;
      case 'reveal':
        revealed = true;
        break;
      case 'reset':
        votes = Object.fromEntries(Object.keys(votes).map(key => [key, null]));
        revealed = false;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    broadcastUpdate();
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function sendUpdate(res: NextApiResponse) {
  res.write(`data: ${JSON.stringify({ users, votes, revealed })}\n\n`);
}

function broadcastUpdate() {
  clients.forEach(client => sendUpdate(client));
}
