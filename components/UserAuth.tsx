"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, Users } from 'lucide-react';
import { User } from '@/types/user';

type UserAuthProps = {
  onUserAuth: (user: Omit<User, 'id'>) => void;
};

export default function UserAuth({ onUserAuth }: UserAuthProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Estimator' | 'Observer'>('Estimator');

  useEffect(() => {
    const storedUser = localStorage.getItem('planningPokerUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setName(parsedUser.name);
      setRole(parsedUser.role);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      const user: Omit<User, 'id'> = { name, role };
      onUserAuth(user);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Join Planning Session</h2>
        <div className="mb-4">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div className="mb-6">
          <Label>Role</Label>
          <div className="flex gap-4 mt-2">
            <Button
              type="button"
              onClick={() => setRole('Estimator')}
              variant={role === 'Estimator' ? 'default' : 'outline'}
              className="flex-1"
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Estimator
            </Button>
            <Button
              type="button"
              onClick={() => setRole('Observer')}
              variant={role === 'Observer' ? 'default' : 'outline'}
              className="flex-1"
            >
              <Users className="mr-2 h-4 w-4" />
              Observer
            </Button>
          </div>
        </div>
        <Button type="submit" className="w-full">Join</Button>
      </form>
    </div>
  );
}