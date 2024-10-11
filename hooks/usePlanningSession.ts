"use client"

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/user';

export const usePlanningSession = (user: User) => {
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: number | null }>({});
  const [revealed, setRevealed] = useState(false);

  const fetchData = useCallback(async () => {
    const response = await fetch('/api/planning-session');
    const data = await response.json();
    setUsers(data.users);
    setVotes(data.votes);
    setRevealed(data.revealed);
  }, []);

  useEffect(() => {
    const joinSession = async () => {
      await fetch('/api/planning-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', user }),
      });
      fetchData();
    };

    joinSession();
    const interval = setInterval(fetchData, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [fetchData, user]);

  const vote = useCallback(async (value: number) => {
    await fetch('/api/planning-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', userId: user.id, value }),
    });
    fetchData();
  }, [user.id, fetchData]);

  const reveal = useCallback(async () => {
    await fetch('/api/planning-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reveal' }),
    });
    fetchData();
  }, [fetchData]);

  const reset = useCallback(async () => {
    await fetch('/api/planning-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    });
    fetchData();
  }, [fetchData]);

  return { users, votes, revealed, vote, reveal, reset };
};