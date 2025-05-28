
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CandidateCard from '@/components/candidates/CandidateCard';
import { Button } from '@/components/ui/button';
import type { Poll } from '@/lib/types';
import { Send, Info, ListChecks, ChevronRight, Lock, Unlock, UserCheck, ShieldAlert, CheckSquare } from 'lucide-react'; // Removed Square as CheckSquare handles both
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Removed CardFooter
import { format, parseISO } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext'; 

const POLLS_STORAGE_KEY = 'eVote_polls_list';
const VOTE_PAGE_INTRO_TEXT_KEY = 'eVote_votePageIntroText_'; 
const CLIENT_POLL_VOTES_KEY = 'eVote_clientPollVotes'; 


const checkAndUpdatePollStatusesClient = (polls: Poll[]): { updatedPolls: Poll[], wasChanged: boolean } => {
  const now = new Date();
  let wasChanged = false;
  const updatedPolls = polls.map(poll => {
    if (poll.isOpen && poll.scheduledCloseTime) {
      const closeTime = parseISO(poll.scheduledCloseTime); 
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
  const { t, locale } = useLanguage(); 
  const defaultVoteIntro = t('votePage.defaultIntro'); 

  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [introText, setIntroText] = useState(defaultVoteIntro);
  const [clientVotes, setClientVotes] = useState<{ [pollId: string]: number }>({});
  const router = useRouter();
  const { toast } = useToast();

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const currentVotePageIntroKey = `${VOTE_PAGE_INTRO_TEXT_KEY}${locale}`;
      const storedIntro = localStorage.getItem(currentVotePageIntroKey);
      setIntroText((storedIntro && storedIntro.trim() !== "") ? storedIntro : defaultVoteIntro);

      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      let polls: Poll[] = storedPollsRaw ? JSON.parse(storedPollsRaw) : [];
      
      const { updatedPolls, wasChanged } = checkAndUpdatePollStatusesClient(polls);
      setAllPolls(updatedPolls);
      setClientVotes(getClientPollVotes());

      if (updatedPolls.length === 1 && !selectedPoll) { 
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
      toast({ title: t('toast.errorLoadingData'), description: t('toast.errorLoadingDataDescription'), variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast, selectedPoll, locale, defaultVoteIntro, t]); 

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  useEffect(() => {
    const currentVotePageIntroKey = `${VOTE_PAGE_INTRO_TEXT_KEY}${locale}`;
    const storedIntro = localStorage.getItem(currentVotePageIntroKey);
    if (!storedIntro || storedIntro.trim() === "") {
       setIntroText(defaultVoteIntro);
    }
  }, [defaultVoteIntro, locale]);


  const handleSelectCandidate = (candidateId: string) => {
    if (!selectedPoll) return;

    setSelectedCandidateIds(prevSelectedIds => {
      if (selectedPoll.isMultiSelect) {
        const maxSelections = selectedPoll.maxSelections || 1;
        if (prevSelectedIds.includes(candidateId)) {
          return prevSelectedIds.filter(id => id !== candidateId);
        } else if (prevSelectedIds.length < maxSelections) {
          return [...prevSelectedIds, candidateId];
        } else {
          toast({
            title: t('toast.selectionLimitReached'),
            description: t('toast.selectionLimitReachedDescription', { maxSelections: maxSelections.toString() }),
            variant: "destructive",
          });
          return prevSelectedIds;
        }
      } else {
        return [candidateId];
      }
    });
  };

  const handleSelectPoll = (poll: Poll) => {
    setSelectedPoll(poll);
    setSelectedCandidateIds([]); 
  };

  const handleSubmitVote = () => {
    if (selectedCandidateIds.length === 0 || !selectedPoll) {
      toast({ title: t('toast.selectionRequired'), description: t('toast.selectionRequiredDescription'), variant: "destructive" });
      return;
    }
    if (!selectedPoll.isOpen) {
      toast({ title: t('toast.pollClosed'), description: t('toast.pollClosedDescription'), variant: "destructive" });
      return;
    }

    if (selectedPoll.isMultiSelect && selectedPoll.maxSelections && selectedCandidateIds.length > selectedPoll.maxSelections) {
        toast({ title: t('toast.tooManySelections'), description: t('toast.tooManySelectionsDescription', { maxSelections: (selectedPoll.maxSelections).toString() }), variant: "destructive" });
        return;
    }

    if (selectedPoll.voteLimitEnabled) {
      const votesCastByClient = clientVotes[selectedPoll.id] || 0;
      const maxVotes = selectedPoll.maxVotesPerClient || 1;
      if (votesCastByClient >= maxVotes) {
        toast({ title: t('toast.voteLimitReached'), description: t('toast.voteLimitReachedDescription', { maxVotes: maxVotes.toString() }), variant: "destructive" });
        return;
      }
    }
    
    try {
      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      let pollsFromStorage: Poll[] = storedPollsRaw ? JSON.parse(storedPollsRaw) : [];
      const pollIndex = pollsFromStorage.findIndex(p => p.id === selectedPoll.id);

      if (pollIndex === -1) {
        toast({ title: t('toast.errorRecordingVotePollNotFound'), description: t('toast.errorRecordingVotePollNotFoundDescription'), variant: "destructive" });
        return;
      }
      
      const currentPollState = pollsFromStorage[pollIndex];
      if (!currentPollState.isOpen) {
          toast({ title: t('toast.pollJustClosed'), description: t('toast.pollJustClosedDescription'), variant: "destructive" });
          loadData(); 
          return;
      }

      const updatedPoll = { ...currentPollState };
      if (!updatedPoll.votes) updatedPoll.votes = {};

      selectedCandidateIds.forEach(candidateId => {
        updatedPoll.votes[candidateId] = (updatedPoll.votes[candidateId] || 0) + 1;
      });
      
      pollsFromStorage[pollIndex] = updatedPoll;
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(pollsFromStorage));

      if (selectedPoll.voteLimitEnabled) {
        saveClientPollVote(selectedPoll.id);
        setClientVotes(getClientPollVotes()); 
      }
      
      const votedForNames = selectedPoll.candidates
        .filter(c => selectedCandidateIds.includes(c.id))
        .map(c => c.name)
        .join(', ');
      
      toast({ 
        title: t('toast.voteSubmitted'), 
        description: t('toast.voteSubmittedDescription', { candidateNames: votedForNames, pollTitle: selectedPoll.title }) 
      });
      router.push(`/results?pollId=${selectedPoll.id}`);

    } catch (error) {
      console.error("Error saving vote to localStorage:", error);
      toast({ title: t('toast.errorSavingVote'), description: t('toast.errorSavingPollDescription'), variant: "destructive" });
    }
  };
  

  if (isLoading) {
    return <div className="text-center py-10"><p className="text-lg text-muted-foreground">{t('votePage.loadingPollData')}</p></div>;
  }

  if (allPolls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] py-12">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader><div className="flex justify-center mb-3"><Info className="h-12 w-12 text-primary" /></div><CardTitle className="text-2xl">{t('votePage.noActivePollsTitle')}</CardTitle></CardHeader>
          <CardContent><CardDescription className="text-base">{t('votePage.noActivePollsDescription')}</CardDescription></CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedPoll) {
    return (
      <div className="flex flex-col items-center space-y-8 py-8">
        <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-primary">{t('votePage.selectPollTitle')}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl whitespace-pre-line">{t('votePage.pollList.introText')}</p>
        </div>
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader><CardTitle className="text-2xl flex items-center gap-2"><ListChecks /> {t('votePage.availablePollsTitle')}</CardTitle><CardDescription>{t('votePage.availablePollsDescription')}</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {allPolls.map(poll => {
                let statusTextKey = poll.isOpen ? 'votePage.pollList.statusOpen' : 'votePage.pollList.statusClosed';
                let statusColor = poll.isOpen ? 'text-green-600' : 'text-red-600';
                let StatusIcon = poll.isOpen ? Unlock : Lock;
                let statusTextParam = {};

                if (poll.isOpen && poll.scheduledCloseTime) {
                    const closeTime = parseISO(poll.scheduledCloseTime);
                     if (new Date() < closeTime) {
                        statusTextKey = 'votePage.pollList.statusOpenUntil';
                        statusTextParam = { time: format(closeTime, 'MMM d, p') };
                     } else { 
                        statusTextKey = 'votePage.pollList.statusClosed'; 
                        StatusIcon = Lock; statusColor = 'text-red-600';
                     }
                } else if (!poll.isOpen && poll.scheduledCloseTime) {
                    statusTextKey = 'votePage.pollList.statusClosedAt';
                    statusTextParam = { time: format(parseISO(poll.scheduledCloseTime), 'MMM d, p') };
                }
                
                let limitText = "";
                if(poll.voteLimitEnabled){
                    const votesAlreadyCast = clientVotes[poll.id] || 0;
                    const maxAllowed = poll.maxVotesPerClient || 1;
                    if(votesAlreadyCast >= maxAllowed) {
                        limitText = t('votePage.pollList.voteLimitReached', { maxAllowed: maxAllowed.toString() });
                    } else {
                        limitText = t('votePage.pollList.votesRemaining', { remaining: (maxAllowed - votesAlreadyCast).toString(), maxAllowed: maxAllowed.toString() });
                    }
                }
                const pollTypeKey = poll.isMultiSelect ? 'votePage.pollList.pollTypeMultiSelect' : 'votePage.pollList.pollTypeSingleSelect';
                const pollTypeParams = poll.isMultiSelect ? { maxSelections: (poll.maxSelections || 1).toString() } : {};


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
                          <StatusIcon className="h-3.5 w-3.5" /> {t(statusTextKey, statusTextParam)}
                      </div>
                      <span className="text-xs text-muted-foreground block">{t('votePage.pollList.candidateCount', { count: poll.candidates.length.toString() })} - {t(pollTypeKey, pollTypeParams)}</span>
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
  const canSubmitVote = selectedCandidateIds.length > 0 && selectedPoll.isOpen && (!selectedPoll.voteLimitEnabled || !voteLimitReached);


  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-primary">{selectedPoll.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl whitespace-pre-line">{introText}</p>
         {allPolls.length > 1 && (
            <Button variant="link" onClick={() => { setSelectedPoll(null); setSelectedCandidateIds([]); loadData(); }} className="text-sm">{t('votePage.backToPollList')}</Button>
        )}
      </div>
      
      {!selectedPoll.isOpen && (
        <Card className="w-full max-w-md text-center bg-destructive/10 border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center justify-center gap-2">
                    <Lock className="h-6 w-6"/> {t('votePage.pollClosedTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive-foreground">{t('votePage.pollClosedDescription')}</p>
                {selectedPoll.scheduledCloseTime && <p className="text-sm text-muted-foreground mt-1">{t('votePage.pollClosedAtTime', { time: format(parseISO(selectedPoll.scheduledCloseTime), 'PPpp')})}</p>}
            </CardContent>
        </Card>
      )}

      {selectedPoll.isMultiSelect && selectedPoll.isOpen && (
         <Card className="w-full max-w-lg text-center shadow-md bg-blue-50 border-blue-400 dark:bg-blue-900/30 dark:border-blue-700">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-lg text-blue-700 dark:text-blue-300">
                    <CheckSquare className="h-5 w-5"/> {t('votePage.multiSelectTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                    {t('votePage.multiSelectDescription', { maxSelections: (selectedPoll.maxSelections || 1).toString() })}
                </p>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {t('votePage.multiSelectCurrentlySelected', { count: selectedCandidateIds.length.toString() })}
                </p>
            </CardContent>
        </Card>
      )}

      {selectedPoll.voteLimitEnabled && selectedPoll.isOpen && (
        <Card className={`w-full max-w-lg text-center shadow-md ${voteLimitReached ? 'bg-amber-50 border-amber-400 dark:bg-amber-900/30 dark:border-amber-700' : 'bg-blue-50 border-blue-400 dark:bg-blue-900/30 dark:border-blue-700'}`}>
            <CardHeader>
                <CardTitle className={`flex items-center justify-center gap-2 text-lg ${voteLimitReached ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
                   {voteLimitReached ? <ShieldAlert className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />} 
                   {voteLimitReached ? t('votePage.voteLimitReachedTitle') : t('votePage.voteLimitStatusTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className={`text-sm ${voteLimitReached ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {t('votePage.voteLimitDescription', { maxVotes: maxVotesForSelectedPoll.toString() })}
                </p>
                <p className={`text-sm font-semibold ${voteLimitReached ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
                    {t('votePage.voteLimitStatus', {
                        votesCast: votesCastByClientForSelectedPoll.toString(),
                        remainingText: voteLimitReached ? t('votePage.voteLimitStatusReached') : t('votePage.voteLimitStatusRemaining', { remainingCount: (maxVotesForSelectedPoll - votesCastByClientForSelectedPoll).toString() })
                    })}
                </p>
                 <p className="text-xs text-muted-foreground mt-2">{t('votePage.voteLimitNote')}</p>
            </CardContent>
        </Card>
      )}


      {selectedPoll.candidates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full">
          {selectedPoll.candidates.map((candidate) => {
            const isSelected = selectedCandidateIds.includes(candidate.id);
            let cardDisabled = !selectedPoll.isOpen || (selectedPoll.voteLimitEnabled && voteLimitReached);
            if (selectedPoll.isMultiSelect && 
                !isSelected && 
                selectedCandidateIds.length >= (selectedPoll.maxSelections || 1) &&
                selectedPoll.isOpen && 
                !(selectedPoll.voteLimitEnabled && voteLimitReached) 
                ) {
              cardDisabled = true;
            }

            return (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onSelect={handleSelectCandidate}
                isSelected={isSelected}
                disabled={cardDisabled}
                isMultiSelectPoll={selectedPoll.isMultiSelect}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground">{t('votePage.noCandidatesText')}</p>
      )}

      {selectedPoll.candidates.length > 0 && (
        <Button 
          size="lg" 
          onClick={handleSubmitVote} 
          disabled={!canSubmitVote}
          className="mt-6 shadow-lg hover:shadow-xl transition-shadow min-w-[200px]"
        >
          <Send className="mr-2 h-5 w-5" />
          {t('votePage.submitVoteButton')}
        </Button>
      )}
    </div>
  );
}

    