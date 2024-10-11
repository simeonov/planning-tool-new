"use client"

import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { User } from '@/types/user';

export const useSocket = (user: User) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: number | null }>({});
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '/api/socket';
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      upgrade: false,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join', user);
    });

    newSocket.on('users', (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    newSocket.on('votes', (updatedVotes: { [key: string]: number | null }) => {
      setVotes(updatedVotes);
    });

    newSocket.on('reveal', (finalVotes: { [key: string]: number | null }) => {
      setVotes(finalVotes);
      setRevealed(true);
    });

    newSocket.on('reset', () => {
      setVotes({});
      setRevealed(false);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const vote = useCallback((value: number) => {
    if (socket) {
      socket.emit('vote', value);
    }
  }, [socket]);

  const reveal = useCallback(() => {
    if (socket) {
      socket.emit('reveal');
    }
  }, [socket]);

  const reset = useCallback(() => {
    if (socket) {
      socket.emit('reset');
    }
  }, [socket]);

  const throwEmoji = useCallback((targetUserId: string, emoji: string, startX: number, startY: number) => {
    if (socket) {
      socket.emit('throwEmoji', { targetUserId, emoji, startX, startY });
    }
  }, [socket]);

  return { socket, users, votes, revealed, vote, reveal, reset, throwEmoji };
};
