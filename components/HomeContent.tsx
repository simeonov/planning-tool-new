"use client"

import { useState, useEffect } from 'react';
import UserAuth from '@/components/UserAuth';
import PlanningBoard from '@/components/PlanningBoard';
import { User } from '@/types/user';

export default function HomeContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('planningPokerUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({ ...parsedUser, id: parsedUser.id || Date.now().toString() });
    }
    setLoading(false);
  }, []);

  const handleUserAuth = (newUser: Omit<User, 'id'>) => {
    const userWithId: User = { ...newUser, id: Date.now().toString() };
    setUser(userWithId);
    localStorage.setItem('planningPokerUser', JSON.stringify(userWithId));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <UserAuth onUserAuth={handleUserAuth} />;
  }

  return <PlanningBoard user={user} onUserUpdate={setUser} />;
}