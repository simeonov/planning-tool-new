"use client"

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Settings } from 'lucide-react';
import UserSettings from './UserSettings';
import { usePlanningSession } from '@/hooks/usePlanningSession';
import { User } from '@/types/user';

type PlanningBoardProps = {
  user: User;
  onUserUpdate: (user: User) => void;
};

export default function PlanningBoard({ user, onUserUpdate }: PlanningBoardProps) {
  const { users, votes, revealed, vote, reveal, reset } = usePlanningSession(user);
  const [showSettings, setShowSettings] = useState(false);
  const [currentVote, setCurrentVote] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!revealed) {
      setCurrentVote(null);
    }
  }, [revealed]);

  const handleVote = (value: number) => {
    setCurrentVote(value);
    vote(value);
  };

  const handleReveal = () => {
    reveal();
    const summary = calculateSummary(votes);
    if (summary) {
      toast({
        title: "Votes Revealed",
        description: `Lowest: ${summary.lowest}, Highest: ${summary.highest}, Average: ${summary.average.toFixed(1)}`,
      });
    }
  };

  const handleReset = () => {
    reset();
    setCurrentVote(null);
  };

  const estimators = users.filter(u => u.role === 'Estimator');
  const observers = users.filter(u => u.role === 'Observer');

  const allVoted = estimators.every(estimator => votes[estimator.id] !== null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Planning Poker</h1>
        <Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <div className="col-span-3">
          <h2 className="text-2xl font-semibold mb-4">Estimators</h2>
          <div className="grid grid-cols-3 gap-4">
            {estimators.map((estimator) => (
              <Card key={estimator.id} className={`p-4 ${votes[estimator.id] !== null ? 'bg-green-100' : ''}`}>
                <CardContent className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${estimator.name}`} />
                    <AvatarFallback>{estimator.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{estimator.name}</p>
                    <p>{votes[estimator.id] !== null ? 'Voted' : 'Not voted'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {user.role === 'Estimator' && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Your Vote</h3>
              <div className="flex space-x-4">
                {[1, 2, 3, 5, 8, 13].map((value) => (
                  <Button
                    key={value}
                    variant={currentVote === value ? 'default' : 'outline'}
                    onClick={() => handleVote(value)}
                    disabled={revealed}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {user.role === 'Observer' && (
            <div className="mt-8">
              <Button onClick={handleReveal} disabled={!allVoted || revealed}>Reveal Votes</Button>
              <Button onClick={handleReset} className="ml-4">Start New Vote</Button>
            </div>
          )}

          {revealed && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Results</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(votes).map(([userId, value]) => {
                  const voter = users.find(u => u.id === userId);
                  if (!voter || voter.role !== 'Estimator') return null;
                  return (
                    <Card key={userId} className="p-4">
                      <CardContent className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${voter?.name}`} />
                            <AvatarFallback>{voter?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <p className="font-semibold">{voter?.name}</p>
                        </div>
                        <p className="text-2xl font-bold">{value}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Observers</h2>
          <div className="space-y-4">
            {observers.map((observer) => (
              <Card key={observer.id} className="p-4">
                <CardContent className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${observer.name}`} />
                    <AvatarFallback>{observer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold">{observer.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {showSettings && (
        <UserSettings
          user={user}
          onUpdate={(updatedUser) => {
            onUserUpdate(updatedUser);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function calculateSummary(votes: { [key: string]: number | null }) {
  const validVotes = Object.values(votes).filter((v): v is number => v !== null);
  if (validVotes.length === 0) return null;

  const lowest = Math.min(...validVotes);
  const highest = Math.max(...validVotes);
  const average = validVotes.reduce((sum, value) => sum + value, 0) / validVotes.length;

  return { lowest, highest, average };
}
