
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CandidateCard from '@/components/candidates/CandidateCard';
import { Button } from '@/components/ui/button';
import type { Poll } from '@/lib/types';
import { Send, Info, ListChecks, ChevronRight, Lock, Unlock, UserCheck, ShieldAlert, CheckSquare, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext'; 

const CLIENT_POLL_VOTES_KEY = 'eVote_clientPollVotes'; 

interface CustomTextsForLocale {
  votePageIntroText?: string;
}

const checkPollStatusClient = (poll: Poll): Poll => {
  const now = new Date();
  if (poll.isOpen && poll.scheduledCloseTime) {
    const closeTime = parseISO(poll.scheduledCloseTime); 
    if (now >= closeTime) {
      return { ...poll, isOpen: false };
    }
  }
  return poll;
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
  const defaultVotePageIntroText = useMemo(() => t('votePage.defaultIntro'), [t]);

  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [introText, setIntroText] = useState('');
  const [clientVotes, setClientVotes] = useState<{ [pollId: string]: number }>({});
  const router = useRouter();
  const { toast } = useToast();

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const currentLocaleCustomTexts: CustomTextsForLocale = settingsData.customTexts?.[locale] || {};
        setIntroText(currentLocaleCustomTexts.votePageIntroText || defaultVotePageIntroText);
      } else {
        let errorDetails = `Status: ${settingsRes.status}`;
        try {
          const errorData = await settingsRes.json();
          errorDetails += `, Message: ${errorData.message || 'Unknown server error'}`;
        } catch (e) { 
          try { const textError = await settingsRes.text(); errorDetails += `, Body: ${textError.substring(0,200)}`; } catch (textE) {/*ignore*/}
        }
        console.error("Error fetching settings for vote page:", errorDetails);
        setIntroText(defaultVotePageIntroText);
      }

      const pollsRes = await fetch('/api/polls');
      if (!pollsRes.ok) {
          let errorDetails = `Failed to fetch polls. Status: ${pollsRes.status}`;
          try {
              const errorData = await pollsRes.json();
              errorDetails += `, Message: ${errorData.message || 'Unknown server error'}`;
          } catch(e) { /* ignore if response is not json */ }
          throw new Error(errorDetails);
      }
      let fetchedPolls: Poll[] = await pollsRes.json();
      
      const upToDatePolls = fetchedPolls.map(checkPollStatusClient);
      setAllPolls(upToDatePolls);
      setClientVotes(getClientPollVotes());

    } catch (error) {
      console.error("Error loading vote page data:", error);
      setAllPolls([]); // Clear polls on error
      setIntroText(defaultVotePageIntroText); // Reset intro text
      toast({ title: t('toast.errorLoadingData'), description: (error as Error).message || t('toast.errorLoadingDataDescription'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [locale, defaultVotePageIntroText, t, toast]); // Removed selectedPoll from dependencies

  useEffect(() => {
    loadPageData();
  }, [loadPageData]); 

  // Effect to manage selectedPoll based on allPolls and isLoading state
  useEffect(() => {
    // Wait for initial data load to complete before trying to manage selectedPoll
    if (isLoading) {
      return;
    }

    if (allPolls.length === 0) {
      if (selectedPoll !== null) { // Only update if state needs to change
        setSelectedPoll(null);
        setSelectedCandidateIds([]);
      }
      return;
    }

    // If a poll is already selected by the user, try to find its updated version in allPolls
    if (selectedPoll) {
      const currentSelectedPollInList = allPolls.find(p => p.id === selectedPoll.id);
      if (currentSelectedPollInList) {
        // Update to the new reference from allPolls ONLY if data has meaningfully changed (e.g., status)
        // This helps prevent unnecessary re-renders if only the array reference changed but poll data is same.
        // A more robust check might compare more fields or use a library for deep comparison if needed.
        if (selectedPoll.isOpen !== currentSelectedPollInList.isOpen || 
            JSON.stringify(selectedPoll.candidates) !== JSON.stringify(currentSelectedPollInList.candidates) ||
            selectedPoll.title !== currentSelectedPollInList.title) {
           setSelectedPoll(currentSelectedPollInList);
        }
        return; // Valid selection exists, no further auto-selection needed
      }
      // If selectedPoll.id is not in allPolls (e.g. deleted), fall through to select a default or null
    }
    
    // Auto-selection logic: If no poll is selected OR the selected poll became invalid
    if (allPolls.length === 1) {
      // If only one poll exists, auto-select it if no poll is currently selected or if the current selection is invalid
      if (!selectedPoll || !allPolls.find(p => p.id === selectedPoll.id)) {
        setSelectedPoll(allPolls[0]);
        setSelectedCandidateIds([]); 
      }
    } else {
      // Multiple polls, or a selected poll became invalid and there isn't a single poll to default to.
      // This ensures user is taken to poll list if their current selection is gone.
      if (selectedPoll && !allPolls.find(p => p.id === selectedPoll.id)) {
        setSelectedPoll(null);
        setSelectedCandidateIds([]);
      }
      // If selectedPoll is already null and allPolls.length > 1, nothing to do here, user will see list.
    }
  }, [allPolls, isLoading, selectedPoll]); // selectedPoll is needed to react to its invalidation or user selection

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

  const handleSubmitVote = async () => {
    if (selectedCandidateIds.length === 0 || !selectedPoll) {
      toast({ title: t('toast.selectionRequired'), description: t('toast.selectionRequiredDescription'), variant: "destructive" });
      return;
    }
    
    const currentPollState = checkPollStatusClient(selectedPoll);
    if (!currentPollState.isOpen) {
      toast({ title: t('toast.pollClosed'), description: t('toast.pollClosedDescription'), variant: "destructive" });
      setAllPolls(prevPolls => prevPolls.map(p => p.id === currentPollState.id ? currentPollState : p)); // Refresh allPolls
      setSelectedPoll(currentPollState); // Update UI if status changed
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
      const response = await fetch(`/api/polls/${selectedPoll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: selectedCandidateIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403 && errorData.message === 'Poll is closed') {
            toast({ title: t('toast.pollJustClosed'), description: t('toast.pollJustClosedDescription'), variant: "destructive" });
            loadPageData(); 
            return;
        }
        throw new Error(errorData.message || 'Failed to submit vote');
      }
      
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
      console.error("Error saving vote:", error);
      const message = error instanceof Error ? error.message : t('toast.errorSavingVoteDescription');
      toast({ title: t('toast.errorSavingVote'), description: message, variant: "destructive" });
    }
  };
  

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground mt-4">{t('votePage.loadingPollData')}</p>
      </div>
    );
  }

  if (allPolls.length === 0 && !isLoading) { // Ensure not to show "No Active Polls" while still loading
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
            <p className="text-lg text-muted-foreground max-w-2xl whitespace-pre-line">{introText || t('votePage.pollList.introText')}</p>
        </div>
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader><CardTitle className="text-2xl flex items-center gap-2"><ListChecks /> {t('votePage.availablePollsTitle')}</CardTitle><CardDescription>{t('votePage.availablePollsDescription')}</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {allPolls.map(poll => {
                const currentPollChecked = checkPollStatusClient(poll); 
                let statusTextKey = currentPollChecked.isOpen ? 'votePage.pollList.statusOpen' : 'votePage.pollList.statusClosed';
                let statusColor = currentPollChecked.isOpen ? 'text-green-600' : 'text-red-600';
                let StatusIcon = currentPollChecked.isOpen ? Unlock : Lock;
                let statusTextParam = {};

                if (currentPollChecked.isOpen && currentPollChecked.scheduledCloseTime) {
                    const closeTime = parseISO(currentPollChecked.scheduledCloseTime);
                     if (new Date() < closeTime) {
                        statusTextKey = 'votePage.pollList.statusOpenUntil';
                        statusTextParam = { time: format(closeTime, 'MMM d, p') };
                     } else { 
                        statusTextKey = 'votePage.pollList.statusClosed'; 
                        StatusIcon = Lock; statusColor = 'text-red-600';
                     }
                } else if (!currentPollChecked.isOpen && currentPollChecked.scheduledCloseTime) {
                    statusTextKey = 'votePage.pollList.statusClosedAt';
                    statusTextParam = { time: format(parseISO(currentPollChecked.scheduledCloseTime), 'MMM d, p') };
                }
                
                let limitText = "";
                if(currentPollChecked.voteLimitEnabled){
                    const votesAlreadyCast = clientVotes[currentPollChecked.id] || 0;
                    const maxAllowed = currentPollChecked.maxVotesPerClient || 1;
                    if(votesAlreadyCast >= maxAllowed) {
                        limitText = t('votePage.pollList.voteLimitReached', { maxAllowed: maxAllowed.toString() });
                    } else {
                        limitText = t('votePage.pollList.votesRemaining', { remaining: (maxAllowed - votesAlreadyCast).toString(), maxAllowed: maxAllowed.toString() });
                    }
                }
                const pollTypeKey = currentPollChecked.isMultiSelect ? 'votePage.pollList.pollTypeMultiSelect' : 'votePage.pollList.pollTypeSingleSelect';
                const pollTypeParams = currentPollChecked.isMultiSelect ? { maxSelections: (currentPollChecked.maxSelections || 1).toString() } : {};


              return (
                <Button
                  key={currentPollChecked.id}
                  variant="outline"
                  className="w-full justify-between p-6 text-left h-auto shadow-sm hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center"
                  onClick={() => handleSelectPoll(currentPollChecked)}
                >
                  <div className="flex-grow mb-2 sm:mb-0">
                      <span className="text-lg font-semibold text-foreground">{currentPollChecked.title}</span>
                       <div className={`text-xs flex items-center gap-1 ${statusColor}`}>
                          <StatusIcon className="h-3.5 w-3.5" /> {t(statusTextKey, statusTextParam)}
                      </div>
                      <span className="text-xs text-muted-foreground block">{t('votePage.pollList.candidateCount', { count: currentPollChecked.candidates.length.toString() })} - {t(pollTypeKey, pollTypeParams)}</span>
                      {currentPollChecked.voteLimitEnabled && limitText && <span className="text-xs text-blue-600 block">{limitText}</span>}
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
  let voteLimitReachedForSelectedPoll = false;

  if (selectedPoll.voteLimitEnabled) {
    votesCastByClientForSelectedPoll = clientVotes[selectedPoll.id] || 0;
    maxVotesForSelectedPoll = selectedPoll.maxVotesPerClient || 1;
    if (votesCastByClientForSelectedPoll >= maxVotesForSelectedPoll) {
      voteLimitReachedForSelectedPoll = true;
    }
  }
  const canSubmitVote = selectedCandidateIds.length > 0 && selectedPoll.isOpen && (!selectedPoll.voteLimitEnabled || !voteLimitReachedForSelectedPoll);


  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-primary">{selectedPoll.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl whitespace-pre-line">{introText}</p>
         {allPolls.length > 1 && (
            <Button variant="link" onClick={() => { setSelectedPoll(null); setSelectedCandidateIds([]); }} className="text-sm">{t('votePage.backToPollList')}</Button>
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
        <Card className={`w-full max-w-lg text-center shadow-md ${voteLimitReachedForSelectedPoll ? 'bg-amber-50 border-amber-400 dark:bg-amber-900/30 dark:border-amber-700' : 'bg-blue-50 border-blue-400 dark:bg-blue-900/30 dark:border-blue-700'}`}>
            <CardHeader>
                <CardTitle className={`flex items-center justify-center gap-2 text-lg ${voteLimitReachedForSelectedPoll ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
                   {voteLimitReachedForSelectedPoll ? <ShieldAlert className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />} 
                   {voteLimitReachedForSelectedPoll ? t('votePage.voteLimitReachedTitle') : t('votePage.voteLimitStatusTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className={`text-sm ${voteLimitReachedForSelectedPoll ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {t('votePage.voteLimitDescription', { maxVotes: maxVotesForSelectedPoll.toString() })}
                </p>
                <p className={`text-sm font-semibold ${voteLimitReachedForSelectedPoll ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
                    {t('votePage.voteLimitStatus', {
                        votesCast: votesCastByClientForSelectedPoll.toString(),
                        remainingText: voteLimitReachedForSelectedPoll ? t('votePage.voteLimitStatusReached') : t('votePage.voteLimitStatusRemaining', { remainingCount: (maxVotesForSelectedPoll - votesCastByClientForSelectedPoll).toString() })
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
            let cardDisabled = !selectedPoll.isOpen || (selectedPoll.voteLimitEnabled && voteLimitReachedForSelectedPoll);
            if (selectedPoll.isMultiSelect && 
                !isSelected && 
                selectedCandidateIds.length >= (selectedPoll.maxSelections || 1) &&
                selectedPoll.isOpen && 
                !(selectedPoll.voteLimitEnabled && voteLimitReachedForSelectedPoll) 
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

    