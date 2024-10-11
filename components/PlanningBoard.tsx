"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import EmojiSelector from "@/components/EmojiSelector"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Settings, Users, UserCircle, TrendingUp } from 'lucide-react';
import UserSettings from './UserSettings';
import { usePlanningSession } from '@/hooks/usePlanningSession';
import { User } from '@/types/user';
import { useToast } from '@/hooks/use-toast';

type PlanningBoardProps = {
  user: User;
  onUserUpdate: (user: User) => void;
};

type EmojiThrow = {
  emoji: string;
  targetUserId: string;
  startX: number;
  startY: number;
};

export default function PlanningBoard({ user, onUserUpdate }: PlanningBoardProps) {
  const { users, votes, revealed, vote, reveal, reset, updateUser, throwEmoji } = usePlanningSession(user);
  const [showSettings, setShowSettings] = useState(false);
  const [currentVote, setCurrentVote] = useState<number | null>(null);
  const { toast } = useToast();
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!revealed) {
      setCurrentVote(null);
    }
  }, [revealed]);

  const createEmojiAnimation = useCallback((targetUserId: string, emoji: string, startX: number, startY: number) => {
    const targetElement = document.getElementById(`user-${targetUserId}`);
    if (!targetElement || !boardRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const boardRect = boardRef.current.getBoundingClientRect();

    const emojiElement = document.createElement('div');
    emojiElement.textContent = emoji;
    emojiElement.style.position = 'absolute';
    emojiElement.style.left = `${startX}px`;
    emojiElement.style.top = `${startY}px`;
    emojiElement.style.fontSize = '2rem';
    emojiElement.style.transition = 'all 1s cubic-bezier(0.25, 0.1, 0.25, 1)';
    emojiElement.style.zIndex = '9999';

    boardRef.current.appendChild(emojiElement);

    // Trigger reflow
    emojiElement.offsetHeight;

    emojiElement.style.transform = `translate(${targetRect.left + targetRect.width / 2 - startX - boardRect.left}px, ${targetRect.top + targetRect.height / 2 - startY - boardRect.top}px) scale(1)`;
    emojiElement.style.opacity = '0';

    setTimeout(() => {
      if (boardRef.current && boardRef.current.contains(emojiElement)) {
        boardRef.current.removeChild(emojiElement);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const handleEmojiThrow = (event: CustomEvent<EmojiThrow>) => {
      const { targetUserId, emoji, startX, startY } = event.detail;
      createEmojiAnimation(targetUserId, emoji, startX, startY);
    };

    window.addEventListener('emojiThrow' as any, handleEmojiThrow);

    return () => {
      window.removeEventListener('emojiThrow' as any, handleEmojiThrow);
    };
  }, [createEmojiAnimation]);

  useEffect(() => {
    // Update currentVote when votes change
    setCurrentVote(votes[user.id] || null);
  }, [votes, user.id]);

  const handleVote = (value: number) => {
    setCurrentVote(value);
    vote(value);
  };

  const handleReveal = () => {
    reveal();
  };

  const handleReset = () => {
    reset();
    setCurrentVote(null);
  };

  const handleUserUpdate = (updatedUser: User) => {
    const newUser = { ...user, ...updatedUser };
    onUserUpdate(newUser);
    updateUser(newUser);
    setShowSettings(false);
  };

  const handleEmojiSelect = (targetUserId: string) => (emoji: string) => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const startX = Math.random() * rect.width;
      const startY = Math.random() * rect.height;

      throwEmoji(targetUserId, emoji, startX, startY);
    }
  };

  const estimators = users.filter(u => u.role === 'Estimator');
  const observers = users.filter(u => u.role === 'Observer');

  const allVoted = estimators.every(estimator => votes[estimator.id] !== null);

  const summary = calculateSummary(votes, users);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen" ref={boardRef}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Poker Planning App</h1>
        <Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
          <Settings className="h-4 w-4"/>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <UserCircle className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-semibold text-gray-800">Estimators</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {estimators.map((estimator) => (
                  <Card key={estimator.id} className={`p-4 ${votes[estimator.id] !== null ? 'bg-green-50 border-green-200' : ''}`} id={`user-${estimator.id}`}>
                    <CardContent className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${estimator.name}`} />
                        <AvatarFallback>{estimator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <p className="font-semibold text-gray-700">{estimator.name}</p>
                        <p className="text-sm text-gray-500">{votes[estimator.id] !== null ? 'Voted' : 'Not voted'}</p>
                      </div>
                      {estimator.id !== user.id && (
                        <EmojiSelector onEmojiSelect={handleEmojiSelect(estimator.id)} />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {user.role === 'Estimator' && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Your Vote</h3>
                <div className="flex flex-wrap gap-4">
                  {[1, 2, 3, 5, 8, 13].map((value) => (
                    <Button
                      key={value}
                      variant={currentVote === value ? 'default' : 'outline'}
                      onClick={() => handleVote(value)}
                      disabled={revealed}
                      className="w-16 h-16 text-xl font-bold"
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === 'Observer' && (
            <Card>
              <CardContent className="p-6 flex space-x-4">
                <Button onClick={handleReveal} disabled={!allVoted || revealed} className="flex-1">
                  Reveal Votes
                </Button>
                <Button onClick={handleReset} className="flex-1">
                  Start New Vote
                </Button>
              </CardContent>
            </Card>
          )}

          {revealed && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(votes).map(([userId, value]) => {
                    const voter = users.find(u => u.id === userId);
                    if (!voter || voter.role !== 'Estimator') return null;
                    return (
                      <Card key={userId} className="p-4">
                        <CardContent className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${voter?.name}`}/>
                              <AvatarFallback>{voter?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-gray-700">{voter?.name}</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">{value}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-6 w-6 text-green-500"/>
                <h2 className="text-2xl font-semibold text-gray-800">Observers</h2>
              </div>
              <div className="space-y-4">
                {observers.map((observer) => (
                  <Card key={observer.id} className="p-4">
                    <CardContent className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${observer.name}`}/>
                        <AvatarFallback>{observer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-gray-700">{observer.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {revealed && summary && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-500"/>
                  <h2 className="text-2xl font-semibold text-gray-800">Summary</h2>
                </div>
                <div className="space-y-2">
                  <p><strong>Lowest Vote:</strong> {summary.lowest} ({summary.lowestVoters.join(', ')})</p>
                  <p><strong>Highest Vote:</strong> {summary.highest} ({summary.highestVoters.join(', ')})</p>
                  <p><strong>Average Vote:</strong> {summary.average.toFixed(1)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showSettings && (
        <UserSettings
          user={user}
          onUpdate={handleUserUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function calculateSummary(votes: { [key: string]: number | null }, users: User[]) {
  const validVotes = Object.entries(votes)
    .filter(([userId, vote]) =>
      vote !== null && users.find(u => u.id === userId)?.role === 'Estimator'
    ) as [string, number][];

  if (validVotes.length === 0) return null;

  const voteValues = validVotes.map(([, vote]) => vote);
  const filteredVoteValues = voteValues.filter((vote): vote is number => vote !== null);
  const lowest = Math.min(...filteredVoteValues);
  const highest = Math.max(...filteredVoteValues);
  const average = filteredVoteValues.reduce((sum, value) => sum + value, 0) / filteredVoteValues.length;

  const lowestVoters = validVotes
    .filter(([, vote]) => vote === lowest)
    .map(([userId]) => users.find(u => u.id === userId)?.name || 'Unknown')
    .filter((name): name is string => name !== 'Unknown');

  const highestVoters = validVotes
    .filter(([, vote]) => vote === highest)
    .map(([userId]) => users.find(u => u.id === userId)?.name || 'Unknown')
    .filter((name): name is string => name !== 'Unknown');

  return { lowest, highest, average, lowestVoters, highestVoters };
}
