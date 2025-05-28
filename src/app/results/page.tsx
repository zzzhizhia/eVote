
'use client';

import { useEffect, useState, useMemo } from 'react';
import TickerTape from '@/components/results/TickerTape';
import type { Poll, PollCandidate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Users, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const POLLS_STORAGE_KEY = 'eVote_polls_list';

interface ChartData {
  name: string;
  votes: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ResultsPage() {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState<PollCandidate | null>(null);

  useEffect(() => {
    try {
      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      if (storedPollsRaw) {
        const storedPolls: Poll[] = JSON.parse(storedPollsRaw);
        if (storedPolls.length > 0) {
          const currentPoll = storedPolls[storedPolls.length - 1]; // Use the latest poll
          setActivePoll(currentPoll);

          let currentTotalVotes = 0;
          let maxVotes = -1;
          let currentWinnerId: string | null = null;

          if (currentPoll.votes) {
            for (const candidateId in currentPoll.votes) {
              const voteCount = currentPoll.votes[candidateId];
              currentTotalVotes += voteCount;
              if (voteCount > maxVotes) {
                maxVotes = voteCount;
                currentWinnerId = candidateId;
              }
            }
          }
          setTotalVotes(currentTotalVotes);
          if (currentWinnerId) {
            setWinner(currentPoll.candidates.find(c => c.id === currentWinnerId) || null);
          } else if (currentPoll.candidates.length > 0 && currentTotalVotes === 0) {
            // If no votes yet, or all votes are 0, there's no clear winner
            setWinner(null);
          }

        } else {
          setActivePoll(null);
        }
      } else {
        setActivePoll(null);
      }
    } catch (error) {
      console.error("Error loading poll results from localStorage:", error);
      setActivePoll(null);
      // Consider adding a toast message here
    }
    setIsLoading(false);
  }, []);

  const chartData: ChartData[] = useMemo(() => {
    if (!activePoll || !activePoll.votes) return [];
    return activePoll.candidates.map(candidate => ({
      name: candidate.name,
      votes: activePoll.votes?.[candidate.id] || 0,
    })).sort((a, b) => b.votes - a.votes);
  }, [activePoll]);


  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  if (!activePoll) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] py-12">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-3">
              <Info className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">No Poll Results</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              There are currently no poll results available. Please create a poll and cast some votes.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-10 py-8">
      <h1 className="text-4xl font-bold tracking-tight text-center text-primary">
        Results: {activePoll.title}
      </h1>
      
      {activePoll.candidates.length > 0 && <TickerTape candidates={activePoll.candidates} />}

      {winner && totalVotes > 0 && (
        <Card className="w-full max-w-md text-center bg-gradient-to-r from-primary/10 to-accent/10 shadow-xl">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <Award className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl">Election Winner!</CardTitle>
            <CardDescription className="text-lg">Congratulations to</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{winner.name}</p>
            <p className="text-xl text-muted-foreground mt-1">with {activePoll.votes?.[winner.id] || 0} votes</p>
          </CardContent>
        </Card>
      )}
      
      {totalVotes === 0 && activePoll.candidates.length > 0 && (
         <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Awaiting Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No votes have been cast in this poll yet. Be the first!</p>
          </CardContent>
        </Card>
      )}


      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" />
            Vote Distribution
          </CardTitle>
          <CardDescription>Total Votes Cast for "{activePoll.title}": {totalVotes}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {activePoll.candidates.length > 0 ? (
            activePoll.candidates.map(candidate => {
              const candidateVotes = activePoll.votes?.[candidate.id] || 0;
              const percentage = totalVotes > 0 ? (candidateVotes / totalVotes) * 100 : 0;
              return (
                <div key={candidate.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-lg font-medium">{candidate.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {candidateVotes} votes ({percentage.toFixed(1)}%)
                    </p>
                  </div>
                  <Progress value={percentage} aria-label={`${candidate.name} vote percentage`} className="h-3 [&>div]:bg-primary" />
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center py-4">No candidates found for this poll.</p>
          )}
        </CardContent>
      </Card>

      {chartData.length > 0 && (
         <Card className="w-full max-w-4xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Votes Overview Chart</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
                          labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
                        <Bar dataKey="votes" name="Votes">
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
