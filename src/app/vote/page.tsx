
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CandidateCard from '@/components/candidates/CandidateCard';
import { Button } from '@/components/ui/button';
import type { Poll, PollCandidate } from '@/lib/types';
import { Send, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const POLLS_STORAGE_KEY = 'eVote_polls_list';
const VOTE_PAGE_INTRO_TEXT_KEY = 'eVote_votePageIntroText';
const DEFAULT_VOTE_INTRO = "Review the candidates below and make your selection. Click on a candidate's card to select them, then submit your vote.";

export default function VotePage() {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [introText, setIntroText] = useState(DEFAULT_VOTE_INTRO);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Load intro text
    try {
      const storedIntro = localStorage.getItem(VOTE_PAGE_INTRO_TEXT_KEY);
      if (storedIntro && storedIntro.trim() !== "") {
        setIntroText(storedIntro);
      } else {
        setIntroText(DEFAULT_VOTE_INTRO); // Fallback to default
      }
    } catch (error) {
      console.error("Error loading vote page intro from localStorage:", error);
      setIntroText(DEFAULT_VOTE_INTRO); // Fallback on error
    }

    // Load poll data
    try {
      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      if (storedPollsRaw) {
        const storedPolls: Poll[] = JSON.parse(storedPollsRaw);
        if (storedPolls.length > 0) {
          setActivePoll(storedPolls[storedPolls.length - 1]);
        } else {
          setActivePoll(null);
        }
      } else {
        setActivePoll(null);
      }
    } catch (error) {
      console.error("Error loading polls from localStorage:", error);
      setActivePoll(null);
      toast({
        title: "Error Loading Polls",
        description: "Could not load poll data. Please try again later.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(prevId => (prevId === candidateId ? null : candidateId));
  };

  const handleSubmitVote = () => {
    if (!selectedCandidateId || !activePoll) {
      toast({
        title: "Selection Required",
        description: "Please select a candidate and ensure a poll is active.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      let allPolls: Poll[] = storedPollsRaw ? JSON.parse(storedPollsRaw) : [];
      
      const pollIndex = allPolls.findIndex(p => p.id === activePoll.id);

      if (pollIndex === -1) {
        toast({
          title: "Error Recording Vote",
          description: "Active poll not found. Your vote could not be saved.",
          variant: "destructive",
        });
        return;
      }

      const updatedPoll = { ...allPolls[pollIndex] };
      if (!updatedPoll.votes) {
        updatedPoll.votes = {};
      }
      updatedPoll.votes[selectedCandidateId] = (updatedPoll.votes[selectedCandidateId] || 0) + 1;
      
      allPolls[pollIndex] = updatedPoll;
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(allPolls));

      const selectedCandidate = activePoll.candidates.find(c => c.id === selectedCandidateId);
      toast({
        title: "Vote Submitted!",
        description: `Your vote for ${selectedCandidate?.name} in the poll "${activePoll.title}" has been recorded.`,
      });
      router.push('/results');

    } catch (error) {
      console.error("Error saving vote to localStorage:", error);
      toast({
        title: "Error Saving Vote",
        description: "An unexpected error occurred while saving your vote.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-muted-foreground">Loading poll data...</p>
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
            <CardTitle className="text-2xl">No Active Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              There are currently no active polls available for voting. Please check back later or contact an administrator.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8 py-8"> {/* Reduced top space to y-8 from y-10 */}
      <div className="text-center space-y-3"> {/* Grouped title and intro text */}
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          {activePoll.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl whitespace-pre-line">
          {introText}
        </p>
      </div>
      
      {activePoll.candidates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full">
          {activePoll.candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onSelect={handleSelectCandidate}
              isSelected={selectedCandidateId === candidate.id}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No candidates available for this poll.</p>
      )}

      {activePoll.candidates.length > 0 && (
        <Button 
          size="lg" 
          onClick={handleSubmitVote} 
          disabled={!selectedCandidateId}
          className="mt-6 shadow-lg hover:shadow-xl transition-shadow min-w-[200px]" // Reduced margin top
        >
          <Send className="mr-2 h-5 w-5" />
          Submit Your Vote
        </Button>
      )}
    </div>
  );
}
