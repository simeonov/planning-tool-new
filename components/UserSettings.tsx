"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, Users } from 'lucide-react';
import { User } from '@/types/user';

type UserSettingsProps = {
  user: User;
  onUpdate: (user: User) => void;
  onClose: () => void;
};

export default function UserSettings({ user, onUpdate, onClose }: UserSettingsProps) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = { ...user, name, role };
    localStorage.setItem('planningPokerUser', JSON.stringify(updatedUser));
    onUpdate(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-6">User Settings</h2>
        <form onSubmit={handleSubmit}>
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
}