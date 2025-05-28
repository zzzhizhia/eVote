
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CandidateCard from '@/components/candidates/CandidateCard';
import { Button } from '@/components/ui/button';
import type { Poll } from '@/lib/types';
import { Send, Info, ListChecks, ChevronRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const POLLS_STORAGE_KEY = 'eVote_polls_list';
const VOTE_PAGE_INTRO_TEXT_KEY = 'eVote_votePageIntroText';
const DEFAULT_VOTE_INTRO = "Review the candidates below and make your selection. Click on a candidate's card to select them, then submit your vote.";

export default function VotePage() {
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [introText, setIntroText] = useState(DEFAULT_VOTE_INTRO);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    // Load intro text
    try {
      const storedIntro = localStorage.getItem(VOTE_PAGE_INTRO_TEXT_KEY);
      if (storedIntro && storedIntro.trim() !== "") {
        setIntroText(storedIntro);
      } else {
        setIntroText(DEFAULT_VOTE_INTRO);
      }
    } catch (error) {
      console.error("Error loading vote page intro from localStorage:", error);
      setIntroText(DEFAULT_VOTE_INTRO);
    }

    // Load poll data
    try {
      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      const polls: Poll[] = storedPollsRaw ? JSON.parse(storedPollsRaw) : [];
      setAllPolls(polls);

      if (polls.length === 1) {
        setSelectedPoll(polls[0]); // If only one poll, select it by default
      } else if (polls.length === 0) {
        setSelectedPoll(null);
      }
      // If multiple polls, selectedPoll remains null, and user will choose from a list
    } catch (error) {
      console.error("Error loading polls from localStorage:", error);
      setAllPolls([]);
      setSelectedPoll(null);
      toast({
        title: "Error Loading Polls",
        description: "Could not load poll data. Please try again later.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  const handleSelectPoll = (poll: Poll) => {
    setSelectedPoll(poll);
    setSelectedCandidateId(null); // Reset candidate selection when a new poll is chosen
  };

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(prevId => (prevId === candidateId ? null : candidateId));
  };

  const handleSubmitVote = () => {
    if (!selectedCandidateId || !selectedPoll) {
      toast({
        title: "Selection Required",
        description: "Please select a poll and a candidate.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      let pollsFromStorage: Poll[] = storedPollsRaw ? JSON.parse(storedPollsRaw) : [];
      
      const pollIndex = pollsFromStorage.findIndex(p => p.id === selectedPoll.id);

      if (pollIndex === -1) {
        toast({
          title: "Error Recording Vote",
          description: "Selected poll not found. Your vote could not be saved.",
          variant: "destructive",
        });
        return;
      }

      const updatedPoll = { ...pollsFromStorage[pollIndex] };
      if (!updatedPoll.votes) {
        updatedPoll.votes = {};
      }
      updatedPoll.votes[selectedCandidateId] = (updatedPoll.votes[selectedCandidateId] || 0) + 1;
      
      pollsFromStorage[pollIndex] = updatedPoll;
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(pollsFromStorage));

      const candidateVotedFor = selectedPoll.candidates.find(c => c.id === selectedCandidateId);
      toast({
        title: "Vote Submitted!",
        description: `Your vote for ${candidateVotedFor?.name} in the poll "${selectedPoll.title}" has been recorded.`,
      });
      // Pass selected poll ID to results page if needed, or results page can be generic
      router.push(`/results?pollId=${selectedPoll.id}`);

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

  if (allPolls.length === 0) {
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

  if (!selectedPoll) {
    // Show list of polls to choose from
    return (
      <div className="flex flex-col items-center space-y-8 py-8">
        <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-primary">
            Select a Poll to Vote
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl whitespace-pre-line">
            {introText.replace("Review the candidates below", "Choose a poll from the list below, then review its candidates")}
            </p>
        </div>
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
                <ListChecks /> Available Polls
            </CardTitle>
            <CardDescription>Click on a poll to see its candidates and cast your vote.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {allPolls.map(poll => (
              <Button
                key={poll.id}
                variant="outline"
                className="w-full justify-between p-6 text-left h-auto shadow-sm hover:shadow-md"
                onClick={() => handleSelectPoll(poll)}
              >
                <div className="flex flex-col">
                    <span className="text-lg font-semibold text-foreground">{poll.title}</span>
                    <span className="text-sm text-muted-foreground">{poll.candidates.length} candidate(s)</span>
                </div>
                <ChevronRight className="h-5 w-5 text-primary" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show candidates for the selectedPoll
  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          {selectedPoll.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl whitespace-pre-line">
          {introText}
        </p>
         {allPolls.length > 1 && (
            <Button variant="link" onClick={() => setSelectedPoll(null)} className="text-sm">
                &larr; Back to Poll List
            </Button>
        )}
      </div>
      
      {selectedPoll.candidates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full">
          {selectedPoll.candidates.map((candidate) => (
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

      {selectedPoll.candidates.length > 0 && (
        <Button 
          size="lg" 
          onClick={handleSubmitVote} 
          disabled={!selectedCandidateId}
          className="mt-6 shadow-lg hover:shadow-xl transition-shadow min-w-[200px]"
        >
          <Send className="mr-2 h-5 w-5" />
          Submit Your Vote
        </Button>
      )}
    </div>
  );
}
