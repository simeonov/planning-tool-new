"use client"

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/user';

const SOCKET_URL = '/.netlify/functions/socketio';

export const usePlanningSession = (user: User) => {
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: number | null }>({});
  const [revealed, setRevealed] = useState(false);

  const sendEvent = useCallback(async (type: string, payload: any) => {
    const response = await fetch(SOCKET_URL, {
      method: 'POST',
      body: JSON.stringify({ type, payload }),
    });
    const data = await response.json();
    return data;
  }, []);

  const joinSession = useCallback(async () => {
    const data = await sendEvent('join', user);
    setUsers(data.users);
    setVotes(data.votes);
    setRevealed(data.revealed);
  }, [user, sendEvent]);

  useEffect(() => {
    joinSession();
    // Set up polling for updates
    const intervalId = setInterval(joinSession, 5000);
    return () => clearInterval(intervalId);
  }, [joinSession]);

  const vote = useCallback(async (value: number) => {
    const data = await sendEvent('vote', { userId: user.id, value });
    setVotes(data.votes);
  }, [user.id, sendEvent]);

  const reveal = useCallback(async () => {
    const data = await sendEvent('reveal', {});
    setRevealed(data.revealed);
    setVotes(data.votes);
  }, [sendEvent]);

  const reset = useCallback(async () => {
    const data = await sendEvent('reset', {});
    setVotes(data.votes);
    setRevealed(data.revealed);
  }, [sendEvent]);

  const updateUser = useCallback(async (updatedUser: User) => {
    const data = await sendEvent('join', updatedUser);
    setUsers(data.users);
  }, [sendEvent]);

  const throwEmoji = useCallback(async (targetUserId: string, emoji: string, startX: number, startY: number) => {
    const data = await sendEvent('throwEmoji', { targetUserId, emoji, startX, startY });
    if (data.emojiThrow) {
      const event = new CustomEvent('emojiThrow', { detail: data.emojiThrow });
      window.dispatchEvent(event);
    }
  }, [sendEvent]);

  return { users, votes, revealed, vote, reveal, reset, updateUser, throwEmoji };
};
