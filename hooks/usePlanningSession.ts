'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/user';
import io, { Socket } from 'socket.io-client';

let socket: Socket;

export const usePlanningSession = (user: User) => {
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: number | null }>({});
  const [revealed, setRevealed] = useState(false);

  const socketInitializer = async () => {
    await fetch('/api/socket');
    socket = io();

    socket.on('connect', () => {
      console.log('Connected to server');
      socket.emit('join', user);
    });

    socket.on('users', (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    socket.on('votes', (updatedVotes: { [key: string]: number | null }) => {
      setVotes(updatedVotes);
    });

    socket.on('revealed', (isRevealed: boolean) => {
      setRevealed(isRevealed);
    });

    socket.on('emojiThrow', (data) => {
      const event = new CustomEvent('emojiThrow', { detail: data });
      window.dispatchEvent(event);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  };

  useEffect(() => {
    socketInitializer();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const vote = useCallback((value: number) => {
    socket.emit('vote', { userId: user.id, value });
  }, [user.id]);

  const reveal = useCallback(() => {
    socket.emit('reveal');
  }, []);

  const reset = useCallback(() => {
    socket.emit('reset');
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    if (socket) {
      socket.emit('join', updatedUser);
    }
  }, []);

  const throwEmoji = useCallback(
    (targetUserId: string, emoji: string, startX: number, startY: number) => {
      socket.emit('throwEmoji', { targetUserId, emoji, startX, startY });
    },
    []
  );

  return { users, votes, revealed, vote, reveal, reset, updateUser, throwEmoji };
};
