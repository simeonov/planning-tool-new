"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/types/user';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const usePlanningSession = (user: User) => {
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: number | null }>({});
  const [revealed, setRevealed] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const sendEvent = useCallback(async (type: string, payload: any) => {
    if (IS_PRODUCTION) {
      const response = await fetch('/.netlify/functions/socketio', {
        method: 'POST',
        body: JSON.stringify({ type, payload }),
      });
      return await response.json();
    } else {
      return new Promise((resolve) => {
        socketRef.current?.emit(type, payload, resolve);
      });
    }
  }, []);

  useEffect(() => {
    if (!IS_PRODUCTION) {
      socketRef.current = io(SOCKET_URL);

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

      socketRef.current.on('emojiThrow', (data) => {
        const event = new CustomEvent('emojiThrow', { detail: data });
        window.dispatchEvent(event);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  const joinSession = useCallback(async () => {
    const data = await sendEvent('join', user);
    if (IS_PRODUCTION) {
      setUsers(data.users);
      setVotes(data.votes);
      setRevealed(data.revealed);
    }
  }, [user, sendEvent]);

  useEffect(() => {
    joinSession();
    if (IS_PRODUCTION) {
      const intervalId = setInterval(joinSession, 5000);
      return () => clearInterval(intervalId);
    }
  }, [joinSession]);

  const vote = useCallback(async (value: number) => {
    const data = await sendEvent('vote', { userId: user.id, value });
    if (IS_PRODUCTION) {
      setVotes(data.votes);
    }
  }, [user.id, sendEvent]);

  const reveal = useCallback(async () => {
    const data = await sendEvent('reveal', {});
    if (IS_PRODUCTION) {
      setRevealed(data.revealed);
      setVotes(data.votes);
    }
  }, [sendEvent]);

  const reset = useCallback(async () => {
    const data = await sendEvent('reset', {});
    if (IS_PRODUCTION) {
      setVotes(data.votes);
      setRevealed(data.revealed);
    }
  }, [sendEvent]);

  const updateUser = useCallback(async (updatedUser: User) => {
    const data = await sendEvent('join', updatedUser);
    if (IS_PRODUCTION) {
      setUsers(data.users);
    }
  }, [sendEvent]);

  const throwEmoji = useCallback(async (targetUserId: string, emoji: string, startX: number, startY: number) => {
    const data = await sendEvent('throwEmoji', { targetUserId, emoji, startX, startY });
    if (IS_PRODUCTION && data.emojiThrow) {
      const event = new CustomEvent('emojiThrow', { detail: data.emojiThrow });
      window.dispatchEvent(event);
    }
  }, [sendEvent]);

  return { users, votes, revealed, vote, reveal, reset, updateUser, throwEmoji };
};
