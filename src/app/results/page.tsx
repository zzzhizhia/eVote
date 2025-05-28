'use client';

import { useEffect, useState } from 'react';
import TickerTape from '@/components/results/TickerTape';
import { MOCK_CANDIDATES } from '@/lib/mockdata';
import type { Candidate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface VoteResults {
  [candidateId: string]: number;
}

interface ChartData {
  name: string;
  votes: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];


export default function ResultsPage() {
  const [results, setResults] = useState<VoteResults | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState<Candidate | null>(null);

  useEffect(() => {
    setCandidates(MOCK_CANDIDATES);
    const storedVotes = localStorage.getItem('eVote_allVotes');
    if (storedVotes) {
      const parsedVotes: VoteResults = JSON.parse(storedVotes);
      setResults(parsedVotes);

      let currentTotalVotes = 0;
      let maxVotes = -1;
      let currentWinnerId: string | null = null;

      for (const candidateId in parsedVotes) {
        currentTotalVotes += parsedVotes[candidateId];
        if (parsedVotes[candidateId] > maxVotes) {
          maxVotes = parsedVotes[candidateId];
          currentWinnerId = candidateId;
        }
      }
      setTotalVotes(currentTotalVotes);
      if (currentWinnerId) {
        setWinner(MOCK_CANDIDATES.find(c => c.id === currentWinnerId) || null);
      }

    }
  }, []);

  const chartData: ChartData[] = candidates.map(candidate => ({
    name: candidate.name,
    votes: results?.[candidate.id] || 0,
  })).sort((a, b) => b.votes - a.votes);


  return (
    <div className="flex flex-col items-center space-y-10 py-8">
      <h1 className="text-4xl font-bold tracking-tight text-center text-primary">
        Election Results
      </h1>
      
      <TickerTape candidates={candidates} />

      {winner && (
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
            <p className="text-xl text-muted-foreground mt-1">with {results?.[winner.id] || 0} votes</p>
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" />
            Vote Distribution
          </CardTitle>
          <CardDescription>Total Votes Cast: {totalVotes}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {results ? (
            candidates.map(candidate => {
              const candidateVotes = results[candidate.id] || 0;
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
            <p className="text-muted-foreground text-center py-4">No results available yet. Votes are being tallied.</p>
          )}
        </CardContent>
      </Card>

      {chartData.length > 0 && results && (
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
