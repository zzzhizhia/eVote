
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import TickerTape from '@/components/results/TickerTape';
import type { Poll, PollCandidate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Users, Info, ShieldAlert, Loader2, ListFilter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseISO, format } from 'date-fns';


interface ChartData {
  name: string;
  votes: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const checkPollStatus = (poll: Poll): Poll => {
  const now = new Date();
  if (poll.isOpen && poll.scheduledCloseTime) {
    const closeTime = parseISO(poll.scheduledCloseTime);
    if (now >= closeTime) {
      return { ...poll, isOpen: false };
    }
  }
  return poll;
};


export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { t } = useLanguage();

  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [canViewResults, setCanViewResults] = useState(false);
  
  const targetPollId = searchParams.get('pollId');

  const fetchResultsVisibilityAndPolls = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check admin status first to potentially bypass visibility setting
      let isAdmin = false;
      try {
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          isAdmin = userData.isAdmin;
        }
      } catch (e) { /* ignore, not admin */ }

      if (isAdmin) {
        setCanViewResults(true);
      } else {
        const settingsRes = await fetch('/api/settings');
        if (!settingsRes.ok) throw new Error('Failed to fetch settings');
        const settingsData = await settingsRes.json();
        setCanViewResults(settingsData.resultsVisibility || false);
      }
      
      // Fetch all polls
      const pollsRes = await fetch('/api/polls');
      if (!pollsRes.ok) throw new Error('Failed to fetch polls');
      const fetchedPolls: Poll[] = await pollsRes.json();
      
      const upToDatePolls = fetchedPolls.map(checkPollStatus);
      setAllPolls(upToDatePolls.sort((a, b) => (new Date(b.id.substring(0,13)) as any) - (new Date(a.id.substring(0,13)) as any))); // Sort by creation desc
        
      let pollToDisplay: Poll | null = null;
      if (targetPollId) {
        pollToDisplay = upToDatePolls.find(p => p.id === targetPollId) || null;
      } else if (upToDatePolls.length > 0) {
        pollToDisplay = upToDatePolls[0]; 
      }
      
      setActivePoll(pollToDisplay);

    } catch (error) {
      console.error("Error loading results page data:", error);
      // Handle errors appropriately, maybe set an error state
      setCanViewResults(false); // Default to not viewable on error
      setAllPolls([]);
      setActivePoll(null);
    }
    setIsLoading(false);
  }, [targetPollId]);

  useEffect(() => {
    fetchResultsVisibilityAndPolls();
  }, [fetchResultsVisibilityAndPolls]);

  const totalVotes = useMemo(() => {
    if (!activePoll || !activePoll.votes) return 0;
    return Object.values(activePoll.votes).reduce((sum, count) => sum + count, 0);
  }, [activePoll]);

  const winner = useMemo(() => {
    if (!activePoll || !activePoll.votes || totalVotes === 0) return null;
    let maxVotes = -1;
    let currentWinnerId: string | null = null;
    let tie = false;

    for (const candidateId in activePoll.votes) {
      const voteCount = activePoll.votes[candidateId];
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        currentWinnerId = candidateId;
        tie = false;
      } else if (voteCount === maxVotes && maxVotes > 0) {
        tie = true;
      }
    }
    if (tie || !currentWinnerId) return null;
    return activePoll.candidates.find(c => c.id === currentWinnerId) || null;
  }, [activePoll, totalVotes]);


  const chartData: ChartData[] = useMemo(() => {
    if (!activePoll || !activePoll.votes || !canViewResults) return [];
    return activePoll.candidates.map(candidate => ({
      name: candidate.name,
      votes: activePoll.votes?.[candidate.id] || 0,
    })).sort((a, b) => b.votes - a.votes);
  }, [activePoll, canViewResults]);

  const handlePollSelect = (pollId: string) => {
    if (pollId) {
      router.push(`/results?pollId=${pollId}`);
    } else {
      router.push('/results'); 
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground mt-4">{t('resultsPage.loading')}</p>
      </div>
    );
  }

  if (!canViewResults && !isLoading) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] py-12">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-3">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">{t('resultsPage.resultsNotPublicTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              {t('resultsPage.resultsNotPublicDescription')}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const pollTitleForDisplay = activePoll ? activePoll.title : (allPolls.length > 0 ? t('resultsPage.noPollSelected') : t('resultsPage.noPollsAvailable'));

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-0">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-center sm:text-left text-primary flex-grow">
          {activePoll ? t('resultsPage.pageTitle', { pollTitle: pollTitleForDisplay || '' }) : pollTitleForDisplay}
        </h1>
        {allPolls.length > 0 && (
          <div className="w-full sm:w-auto min-w-[250px]">
            <Select onValueChange={handlePollSelect} value={activePoll?.id || ""}>
              <SelectTrigger className="w-full shadow-md">
                <ListFilter className="h-4 w-4 mr-2 opacity-70" />
                <SelectValue placeholder={t('resultsPage.selectPollPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {allPolls.map((poll) => (
                  <SelectItem key={poll.id} value={poll.id}>
                    {poll.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!activePoll && allPolls.length > 0 && (
         <Card className="w-full max-w-lg text-center shadow-lg mt-6">
          <CardHeader>
            <div className="flex justify-center mb-3">
              <Info className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t('resultsPage.selectPollPromptTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              {t('resultsPage.selectPollPromptDescription')}
            </CardDescription>
          </CardContent>
        </Card>
      )}
      
      {!activePoll && allPolls.length === 0 && (
         <Card className="w-full max-w-lg text-center shadow-lg mt-6">
          <CardHeader>
            <div className="flex justify-center mb-3">
              <Info className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t('resultsPage.noPollResultsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              {t('resultsPage.noPollResultsGeneralDescription')}
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {activePoll && (
        <>
          {activePoll.candidates.length > 0 && <TickerTape candidates={activePoll.candidates} />}

          {winner && totalVotes > 0 && (
            <Card className="w-full max-w-md text-center bg-gradient-to-r from-primary/10 to-accent/10 shadow-xl">
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <Award className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-3xl">{t('resultsPage.electionWinnerTitle')}</CardTitle>
                <CardDescription className="text-lg">{t('resultsPage.congratulationsTo')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{winner.name}</p>
                <p className="text-xl text-muted-foreground mt-1">{t('resultsPage.withXVotes', { count: (activePoll.votes?.[winner.id] || 0).toString() })}</p>
              </CardContent>
            </Card>
          )}
          
          {!winner && totalVotes > 0 && (
            <Card className="w-full max-w-md text-center shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('resultsPage.resultsUpdateTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('resultsPage.tieOrTallying')}</p>
              </CardContent>
            </Card>
          )}
          
          {totalVotes === 0 && activePoll.candidates.length > 0 && (
             <Card className="w-full max-w-md text-center shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">{t('resultsPage.awaitingVotesTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('resultsPage.awaitingVotesDescription')}</p>
              </CardContent>
            </Card>
          )}

          <Card className="w-full max-w-4xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users className="h-6 w-6 text-primary" />
                {t('resultsPage.voteDistributionTitle')}
              </CardTitle>
              <CardDescription>{t('resultsPage.totalVotesCast', { pollTitle: activePoll.title, count: totalVotes.toString() })}</CardDescription>
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
                          {t('resultsPage.candidateVoteStats', { count: candidateVotes.toString(), percentage: percentage.toFixed(1) })}
                        </p>
                      </div>
                      <Progress value={percentage} aria-label={t('resultsPage.candidateVoteStatsAria', { candidateName: candidate.name, count: candidateVotes.toString(), percentage: percentage.toFixed(1) })} className="h-3 [&>div]:bg-primary" />
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">{t('resultsPage.noCandidatesFound')}</p>
              )}
            </CardContent>
          </Card>

          {chartData.length > 0 && (
             <Card className="w-full max-w-4xl shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">{t('resultsPage.votesOverviewChartTitle')}</CardTitle>
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
                            <Bar dataKey="votes" name={t('header.vote')}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
