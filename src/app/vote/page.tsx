
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CandidateCard from '@/components/candidates/CandidateCard';
import { Button } from '@/components/ui/button';
import type { Poll } from '@/lib/types';
import { Send, Info, ListChecks, ChevronRight, Lock, Unlock, UserCheck, ShieldAlert } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';

const POLLS_STORAGE_KEY = 'eVote_polls_list';
const VOTE_PAGE_INTRO_TEXT_KEY = 'eVote_votePageIntroText';
const CLIENT_POLL_VOTES_KEY = 'eVote_clientPollVotes'; // Stores { [pollId]: count }
const DEFAULT_VOTE_INTRO = "Review the candidates below and make your selection. Click on a candidate's card to select them, then submit your vote.";

// Function to update polls in localStorage if their scheduled close time has passed
const checkAndUpdatePollStatusesClient = (polls: Poll[]): { updatedPolls: Poll[], wasChanged: boolean } => {
  const now = new Date();
  let wasChanged = false;
  const updatedPolls = polls.map(poll => {
    if (poll.isOpen && poll.scheduledCloseTime) {
      const closeTime = parseISO(poll.scheduledCloseTime); // Use parseISO for robust date parsing
      if (now >= closeTime) {
        wasChanged = true;
        return { ...poll, isOpen: false };
      }
    }
    return poll;
  });

  if (wasChanged) {
    try {
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(updatedPolls));
    } catch (error) {
        console.error("Error auto-updating poll statuses in localStorage (vote page):", error);
    }
  }
  return { updatedPolls, wasChanged };
};

const getClientPollVotes = (): { [pollId: string]: number } => {
  try {
    const storedClientVotes = localStorage.getItem(CLIENT_POLL_VOTES_KEY);
    return storedClientVotes ? JSON.parse(storedClientVotes) : {};
  } catch (error) {
    console.error("Error reading client poll votes from localStorage:", error);
    return {};
  }
};

const saveClientPollVote = (pollId: string) => {
  try {
    const clientVotes = getClientPollVotes();
    clientVotes[pollId] = (clientVotes[pollId] || 0) + 1;
    localStorage.setItem(CLIENT_POLL_VOTES_KEY, JSON.stringify(clientVotes));
  } catch (error) {
    console.error("Error saving client poll vote to localStorage:", error);
  }
};


export default function VotePage() {
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [introText, setIntroText] = useState(DEFAULT_VOTE_INTRO);
  const [clientVotes, setClientVotes] = useState<{ [pollId: string]: number }>({});
  const router = useRouter();
  const { toast } = useToast();

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const storedIntro = localStorage.getItem(VOTE_PAGE_INTRO_TEXT_KEY);
      setIntroText((storedIntro && storedIntro.trim() !== "") ? storedIntro : DEFAULT_VOTE_INTRO);

      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      let polls: Poll[] = storedPollsRaw ? JSON.parse(storedPollsRaw) : [];
      
      const { updatedPolls, wasChanged } = checkAndUpdatePollStatusesClient(polls);
      setAllPolls(updatedPolls);
      setClientVotes(getClientPollVotes());

      if (updatedPolls.length === 1 && !selectedPoll) { // Avoid resetting selectedPoll if one is already chosen from a list
        setSelectedPoll(updatedPolls[0]);
      } else if (updatedPolls.length === 0) {
        setSelectedPoll(null);
      }
      
      if (wasChanged && selectedPoll) {
          const refreshedSelectedPoll = updatedPolls.find(p => p.id === selectedPoll.id);
          if (refreshedSelectedPoll) {
              setSelectedPoll(refreshedSelectedPoll);
          } else {
              setSelectedPoll(null); 
          }
      }

    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      setAllPolls([]);
      setSelectedPoll(null);
      toast({ title: "Error Loading Data", description: "Could not load data. Please try again later.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast, selectedPoll]); 

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
  };

  const handleSelectPoll = (poll: Poll) => {
    setSelectedPoll(poll);
    setSelectedCandidateId(null); 
  };

  const handleSubmitVote = () => {
    if (!selectedCandidateId || !selectedPoll) {
      toast({ title: "Selection Required", description: "Please select a poll and a candidate.", variant: "destructive" });
      return;
    }
    if (!selectedPoll.isOpen) {
      toast({ title: "Poll Closed", description: "This poll is no longer accepting votes.", variant: "destructive" });
      return;
    }

    if (selectedPoll.voteLimitEnabled) {
      const votesCastByClient = clientVotes[selectedPoll.id] || 0;
      const maxVotes = selectedPoll.maxVotesPerClient || 1;
      if (votesCastByClient >= maxVotes) {
        toast({ title: "Vote Limit Reached", description: `You have already cast the maximum of ${maxVotes} vote(s) for this poll.`, variant: "destructive" });
        return;
      }
    }
    
    try {
      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      let pollsFromStorage: Poll[] = storedPollsRaw ? JSON.parse(storedPollsRaw) : [];
      const pollIndex = pollsFromStorage.findIndex(p => p.id === selectedPoll.id);

      if (pollIndex === -1) {
        toast({ title: "Error Recording Vote", description: "Selected poll not found.", variant: "destructive" });
        return;
      }
      
      const currentPollState = pollsFromStorage[pollIndex];
      if (!currentPollState.isOpen) {
          toast({ title: "Poll Just Closed", description: "This poll is no longer accepting votes.", variant: "destructive" });
          loadData(); 
          return;
      }

      const updatedPoll = { ...currentPollState };
      if (!updatedPoll.votes) updatedPoll.votes = {};
      updatedPoll.votes[selectedCandidateId] = (updatedPoll.votes[selectedCandidateId] || 0) + 1;
      
      pollsFromStorage[pollIndex] = updatedPoll;
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(pollsFromStorage));

      if (selectedPoll.voteLimitEnabled) {
        saveClientPollVote(selectedPoll.id);
        setClientVotes(getClientPollVotes()); // Refresh client votes state
      }

      const candidateVotedFor = selectedPoll.candidates.find(c => c.id === selectedCandidateId);
      toast({ title: "Vote Submitted!", description: `Your vote for ${candidateVotedFor?.name} in "${selectedPoll.title}" has been recorded.` });
      router.push(`/results?pollId=${selectedPoll.id}`);

    } catch (error) {
      console.error("Error saving vote to localStorage:", error);
      toast({ title: "Error Saving Vote", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="text-center py-10"><p className="text-lg text-muted-foreground">Loading poll data...</p></div>;
  }

  if (allPolls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] py-12">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader><div className="flex justify-center mb-3"><Info className="h-12 w-12 text-primary" /></div><CardTitle className="text-2xl">No Active Polls</CardTitle></CardHeader>
          <CardContent><CardDescription className="text-base">There are currently no active polls available for voting. Please check back later.</CardDescription></CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedPoll) {
    return (
      <div className="flex flex-col items-center space-y-8 py-8">
        <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-primary">Select a Poll to Vote</h1>
            <p className="text-lg text-muted-foreground max-w-2xl whitespace-pre-line">{introText.replace("Review the candidates below", "Choose a poll from the list below, then review its candidates")}</p>
        </div>
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader><CardTitle className="text-2xl flex items-center gap-2"><ListChecks /> Available Polls</CardTitle><CardDescription>Click on a poll to see its candidates and cast your vote.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {allPolls.map(poll => {
                let statusText = poll.isOpen ? 'Open for voting' : 'Closed';
                let statusColor = poll.isOpen ? 'text-green-600' : 'text-red-600';
                let StatusIcon = poll.isOpen ? Unlock : Lock;

                if (poll.isOpen && poll.scheduledCloseTime) {
                    const closeTime = parseISO(poll.scheduledCloseTime);
                     if (new Date() < closeTime) {
                        statusText = `Open until ${format(closeTime, 'MMM d, p')}`;
                     } else { 
                        statusText = 'Closed'; StatusIcon = Lock; statusColor = 'text-red-600';
                     }
                } else if (!poll.isOpen && poll.scheduledCloseTime) {
                    statusText = `Closed at ${format(parseISO(poll.scheduledCloseTime), 'MMM d, p')}`;
                }
                
                let limitText = "";
                if(poll.voteLimitEnabled){
                    const votesAlreadyCast = clientVotes[poll.id] || 0;
                    const maxAllowed = poll.maxVotesPerClient || 1;
                    if(votesAlreadyCast >= maxAllowed) {
                        limitText = `(Vote limit reached: ${maxAllowed})`;
                    } else {
                        limitText = `(${maxAllowed - votesAlreadyCast} of ${maxAllowed} votes remaining)`;
                    }
                }


              return (
                <Button
                  key={poll.id}
                  variant="outline"
                  className="w-full justify-between p-6 text-left h-auto shadow-sm hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center"
                  onClick={() => handleSelectPoll(poll)}
                >
                  <div className="flex-grow mb-2 sm:mb-0">
                      <span className="text-lg font-semibold text-foreground">{poll.title}</span>
                      <div className={`text-xs flex items-center gap-1 ${statusColor}`}>
                          <StatusIcon className="h-3.5 w-3.5" /> {statusText}
                      </div>
                      <span className="text-sm text-muted-foreground block">{poll.candidates.length} candidate(s)</span>
                      {poll.voteLimitEnabled && limitText && <span className="text-xs text-blue-600 block">{limitText}</span>}
                  </div>
                  <ChevronRight className="h-5 w-5 text-primary flex-shrink-0 self-center" />
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show candidates for the selectedPoll
  let votesCastByClientForSelectedPoll = 0;
  let maxVotesForSelectedPoll = 1;
  let voteLimitReached = false;

  if (selectedPoll.voteLimitEnabled) {
    votesCastByClientForSelectedPoll = clientVotes[selectedPoll.id] || 0;
    maxVotesForSelectedPoll = selectedPoll.maxVotesPerClient || 1;
    if (votesCastByClientForSelectedPoll >= maxVotesForSelectedPoll) {
      voteLimitReached = true;
    }
  }
  const canSubmitVote = selectedCandidateId && selectedPoll.isOpen && (!selectedPoll.voteLimitEnabled || !voteLimitReached);


  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-primary">{selectedPoll.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl whitespace-pre-line">{introText}</p>
         {allPolls.length > 1 && (
            <Button variant="link" onClick={() => { setSelectedPoll(null); loadData(); }} className="text-sm">&larr; Back to Poll List</Button>
        )}
      </div>
      
      {!selectedPoll.isOpen && (
        <Card className="w-full max-w-md text-center bg-destructive/10 border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center justify-center gap-2">
                    <Lock className="h-6 w-6"/> Poll Closed
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive-foreground">This poll is currently closed and not accepting new votes.</p>
                {selectedPoll.scheduledCloseTime && <p className="text-sm text-muted-foreground mt-1">Closed at: {format(parseISO(selectedPoll.scheduledCloseTime), 'PPpp')}</p>}
            </CardContent>
        </Card>
      )}

      {selectedPoll.voteLimitEnabled && selectedPoll.isOpen && (
        <Card className={`w-full max-w-lg text-center shadow-md ${voteLimitReached ? 'bg-amber-50 border-amber-400' : 'bg-blue-50 border-blue-400'}`}>
            <CardHeader>
                <CardTitle className={`flex items-center justify-center gap-2 text-lg ${voteLimitReached ? 'text-amber-700' : 'text-blue-700'}`}>
                   {voteLimitReached ? <ShieldAlert className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />} 
                   Vote Limit Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className={`text-sm ${voteLimitReached ? 'text-amber-600' : 'text-blue-600'}`}>
                    This poll allows a maximum of {maxVotesForSelectedPoll} vote(s) per client.
                </p>
                <p className={`text-sm font-semibold ${voteLimitReached ? 'text-amber-700' : 'text-blue-700'}`}>
                    You have cast {votesCastByClientForSelectedPoll} vote(s). 
                    {voteLimitReached ? " You cannot cast more votes." : ` You have ${maxVotesForSelectedPoll - votesCastByClientForSelectedPoll} vote(s) remaining.`}
                </p>
                 <p className="text-xs text-muted-foreground mt-2">Note: This limit is browser-based and can be bypassed.</p>
            </CardContent>
        </Card>
      )}


      {selectedPoll.candidates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full">
          {selectedPoll.candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onSelect={handleSelectCandidate}
              isSelected={selectedCandidateId === candidate.id}
              disabled={!selectedPoll.isOpen || (selectedPoll.voteLimitEnabled && voteLimitReached && selectedCandidateId !== candidate.id)}
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
          disabled={!canSubmitVote}
          className="mt-6 shadow-lg hover:shadow-xl transition-shadow min-w-[200px]"
        >
          <Send className="mr-2 h-5 w-5" />
          Submit Your Vote
        </Button>
      )}
    </div>
  );
}
