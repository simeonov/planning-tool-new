"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/types/user';
import io, { Socket } from 'socket.io-client';

export const usePlanningSession = (user: User) => {
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: number | null }>({});
  const [revealed, setRevealed] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const socketInitializer = async () => {
    await fetch('/api/socket');
    socketRef.current = io();

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      socketRef.current?.emit('join', user);
    });

    socketRef.current.on('users', (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    socketRef.current.on('votes', (updatedVotes: { [key: string]: number | null }) => {
      setVotes(updatedVotes);
    });

    socketRef.current.on('revealed', (isRevealed: boolean) => {
      setRevealed(isRevealed);
    });

    socketRef.current.on('emojiThrow', ({ targetUserId, emoji, startX, startY }) => {
      const event = new CustomEvent('emojiThrow', { detail: { targetUserId, emoji, startX, startY } });
      window.dispatchEvent(event);
    });
  };

  useEffect(() => {
    socketInitializer();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const vote = useCallback((value: number) => {
    if (socketRef.current) {
      socketRef.current.emit('vote', { userId: user.id, value });
    }
  }, [user.id]);

  const reveal = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('reveal');
    }
  }, []);

  const reset = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('reset');
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    if (socketRef.current) {
      socketRef.current.emit('join', updatedUser);
    }
  }, []);

  const throwEmoji = useCallback((targetUserId: string, emoji: string, startX: number, startY: number) => {
    if (socketRef.current) {
      socketRef.current.emit('throwEmoji', { targetUserId, emoji, startX, startY });
    }
  }, []);

  return { users, votes, revealed, vote, reveal, reset, updateUser, throwEmoji };
};
