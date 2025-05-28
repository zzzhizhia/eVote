
'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Settings, Eye, EyeOff, AlertTriangle, Save, PencilLine, ListChecks, Edit3, Trash2, Clock, ToggleLeft, ToggleRight, CheckCircle, XCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import type { Poll } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/contexts/LanguageContext'; // Added for future translations


const RESULTS_VISIBILITY_KEY = 'eVote_isResultsPublic';
const HOME_PAGE_INTRO_TEXT_KEY = 'eVote_homePageIntroText_'; // Locale will be appended
const VOTE_PAGE_INTRO_TEXT_KEY = 'eVote_votePageIntroText_'; // Locale will be appended
const POLLS_STORAGE_KEY = 'eVote_polls_list';

// Default intros will now come from translation files or be translated directly
// const DEFAULT_HOME_INTRO = "We are pleased to announce that the next presidential election will be held soon. This is your opportunity to choose the leader who will best represent your interests. Prepare to learn about the candidates and make an informed decision.";
// const DEFAULT_VOTE_INTRO = "Review the candidates below and make your selection. Click on a candidate's card to select them, then submit your vote.";


// Function to update polls in localStorage if their scheduled close time has passed
const checkAndUpdatePollStatuses = (polls: Poll[]): Poll[] => {
  const now = new Date();
  let pollsUpdated = false;
  const updatedPolls = polls.map(poll => {
    if (poll.isOpen && poll.scheduledCloseTime) {
      const closeTime = parseISO(poll.scheduledCloseTime);
      if (now >= closeTime) {
        pollsUpdated = true;
        return { ...poll, isOpen: false };
      }
    }
    return poll;
  });

  if (pollsUpdated) {
    try {
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(updatedPolls));
    } catch (error) {
        console.error("Error auto-updating poll statuses in localStorage:", error);
        // Potentially toast an error to admin if critical
    }
  }
  return updatedPolls;
};


export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLanguage(); // Using useLanguage hook

  // Default intros based on current language
  const DEFAULT_HOME_INTRO = t('home.defaultIntro');
  const DEFAULT_VOTE_INTRO = t('vote.defaultIntro', {candidateName: ''}); // Assuming vote.defaultIntro is a key, provide dummy replacement

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isResultsPublic, setIsResultsPublic] = useState(false);
  const [isLoadingVisibility, setIsLoadingVisibility] = useState(true);

  const [homeIntroText, setHomeIntroText] = useState('');
  const [voteIntroText, setVoteIntroText] = useState('');
  const [isLoadingHomeIntro, setIsLoadingHomeIntro] = useState(true);
  const [isLoadingVoteIntro, setIsLoadingVoteIntro] = useState(true);

  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated') === 'true';
    setIsAdminAuthenticated(authStatus);
    if (!authStatus) {
      router.push('/admin');
      return; 
    }

    try {
      const storedVisibility = localStorage.getItem(RESULTS_VISIBILITY_KEY);
      if (storedVisibility !== null) {
        setIsResultsPublic(JSON.parse(storedVisibility));
      } else {
        setIsResultsPublic(false); 
        localStorage.setItem(RESULTS_VISIBILITY_KEY, JSON.stringify(false));
      }
    } catch (error) {
      console.error("Error reading results visibility from localStorage:", error);
      setIsResultsPublic(false);
       toast({ title: "Error Loading Settings", description: "Could not load results visibility. Defaulting to private.", variant: "destructive" });
    }
    setIsLoadingVisibility(false);
    loadPollsFromStorage();
  }, [router, toast]);

   useEffect(() => {
    // Load Home page intro text based on locale
    const currentHomePageIntroKey = `${HOME_PAGE_INTRO_TEXT_KEY}${locale}`;
    setIsLoadingHomeIntro(true);
    try {
      const storedHomeIntro = localStorage.getItem(currentHomePageIntroKey);
      setHomeIntroText(storedHomeIntro || DEFAULT_HOME_INTRO);
    } catch (error) {
      console.error("Error reading home intro text from localStorage:", error);
      setHomeIntroText(DEFAULT_HOME_INTRO);
      toast({ title: "Error Loading Home Intro", description: "Could not load home page introductory text.", variant: "destructive" });
    }
    setIsLoadingHomeIntro(false);

    // Load Vote page intro text based on locale
    const currentVotePageIntroKey = `${VOTE_PAGE_INTRO_TEXT_KEY}${locale}`;
    setIsLoadingVoteIntro(true);
    try {
      const storedVoteIntro = localStorage.getItem(currentVotePageIntroKey);
      setVoteIntroText(storedVoteIntro || DEFAULT_VOTE_INTRO);
    } catch (error) {
      console.error("Error reading vote intro text from localStorage:", error);
      setVoteIntroText(DEFAULT_VOTE_INTRO);
      toast({ title: "Error Loading Vote Intro", description: "Could not load vote page introductory text.", variant: "destructive" });
    }
    setIsLoadingVoteIntro(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, DEFAULT_HOME_INTRO, DEFAULT_VOTE_INTRO]);


  const loadPollsFromStorage = () => {
    setIsLoadingPolls(true);
    try {
      const storedPollsRaw = localStorage.getItem(POLLS_STORAGE_KEY);
      let existingPolls: Poll[] = storedPollsRaw ? JSON.parse(storedPollsRaw) : [];
      existingPolls = checkAndUpdatePollStatuses(existingPolls); 
      setPolls(existingPolls);
    } catch (error) {
      console.error("Error reading polls from localStorage:", error);
      setPolls([]);
      toast({ title: "Error Loading Polls", description: "Could not load existing polls.", variant: "destructive" });
    }
    setIsLoadingPolls(false);
  };
  
  const handleTogglePollStatus = (pollId: string, currentStatus: boolean) => {
    try {
      const updatedPolls = polls.map(p => 
        p.id === pollId ? { ...p, isOpen: !currentStatus } : p
      );
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(updatedPolls));
      setPolls(updatedPolls); 
      toast({
        title: `Poll ${!currentStatus ? 'Opened' : 'Closed'}`,
        description: `The poll is now ${!currentStatus ? 'accepting votes' : 'closed for voting'}.`,
      });
    } catch (error) {
      console.error("Error toggling poll status:", error);
      toast({ title: "Error Updating Poll", description: "Could not update poll status.", variant: "destructive" });
    }
  };


  const handleResultsVisibilityToggle = (checked: boolean) => {
    try {
      localStorage.setItem(RESULTS_VISIBILITY_KEY, JSON.stringify(checked));
      setIsResultsPublic(checked);
      toast({ title: `Results Visibility Updated`, description: `Poll results are now ${checked ? 'PUBLIC' : 'PRIVATE'}.` });
    } catch (error) {
       console.error("Error saving results visibility to localStorage:", error);
       toast({ title: "Error Saving Settings", description: "Could not save results visibility setting.", variant: "destructive" });
    }
  };

  const handleSaveHomeIntro = () => {
    const currentHomePageIntroKey = `${HOME_PAGE_INTRO_TEXT_KEY}${locale}`;
    try {
      localStorage.setItem(currentHomePageIntroKey, homeIntroText);
      toast({ title: "Home Page Intro Saved", description: "The introductory text for the home page has been updated." });
    } catch (error) {
      console.error("Error saving home intro text to localStorage:", error);
      toast({ title: "Error Saving Home Intro", description: "Could not save home page introductory text.", variant: "destructive" });
    }
  };

  const handleSaveVoteIntro = () => {
    const currentVotePageIntroKey = `${VOTE_PAGE_INTRO_TEXT_KEY}${locale}`;
    try {
      localStorage.setItem(currentVotePageIntroKey, voteIntroText);
      toast({ title: "Vote Page Intro Saved", description: "The introductory text for the vote page has been updated." });
    } catch (error) {
      console.error("Error saving vote intro text to localStorage:", error);
      toast({ title: "Error Saving Vote Intro", description: "Could not save vote page introductory text.", variant: "destructive" });
    }
  };

  const handleDeletePoll = (pollId: string) => {
    try {
      const updatedPolls = polls.filter(p => p.id !== pollId);
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(updatedPolls));
      setPolls(updatedPolls);
      toast({ title: "Poll Deleted", description: "The poll has been successfully deleted." });
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast({ title: "Error Deleting Poll", description: "Could not delete the poll.", variant: "destructive" });
    }
  };
  
  if (!isAdminAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent><p>You are not authorized to view this page. Redirecting to login...</p></CardContent>
        </Card>
      </div>
    );
  }

  // Placeholder for translations - replace these with t('key') once keys are added to JSON files
  const dashboardTitle = "Admin Dashboard"; 
  const dashboardDescription = "Manage your eVote application settings and content.";
  const createNewPollButton = "Create New Poll";
  const managePollsTitle = "Manage Polls";
  const loadingPollsText = "Loading polls...";
  const noPollsYetText = "No polls created yet.";
  const editButtonText = "Edit";
  const deleteButtonText = "Delete";
  const confirmDeleteTitle = "Are you sure?";
  const confirmDeleteDescription = "This action cannot be undone. This will permanently delete the poll \"{{pollTitle}}\" and all its associated data.";
  const cancelButtonText = "Cancel";
  const deletePollButtonText = "Delete Poll";
  const managePollsFooter = "Toggle poll status, edit details, or delete polls.";
  const resultsVisibilityTitle = "Results Visibility";
  const loadingSettingsText = "Loading setting...";
  const publicText = "Public";
  const privateText = "Private";
  const resultsVisibilityFooter = "Controls whether non-admin users can view poll results.";
  const editHomePageIntroTitle = "Edit Home Page Introduction";
  const introTextLabel = "Introductory Text";
  const loadingTextLabel = "Loading text...";
  const saveHomeIntroButton = "Save Home Intro";
  const editVotePageIntroTitle = "Edit Vote Page Introduction";
  const saveVoteIntroButton = "Save Vote Intro";


  return (
    <div className="flex flex-col items-center py-10 space-y-8">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="items-center text-center">
          <Settings className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold">{dashboardTitle}</CardTitle>
          <CardDescription className="text-lg">{dashboardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 p-6">
          <Button asChild size="lg" className="w-full max-w-xs shadow-md hover:shadow-lg transition-shadow">
            <Link href="/admin/create-poll" className="flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" /> {createNewPollButton}
            </Link>
          </Button>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                <ListChecks className="h-5 w-5" /> {managePollsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-3">
              {isLoadingPolls ? (
                <p className="text-sm text-muted-foreground text-center">{loadingPollsText}</p>
              ) : polls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">{noPollsYetText}</p>
              ) : (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {polls.map((poll) => {
                    let statusText = poll.isOpen ? 'Open' : 'Closed';
                    let statusColor = poll.isOpen ? 'text-green-600' : 'text-red-600';
                    let StatusIcon = poll.isOpen ? CheckCircle : XCircle;

                    if (poll.isOpen && poll.scheduledCloseTime) {
                      const closeTime = parseISO(poll.scheduledCloseTime);
                      if (new Date() < closeTime) {
                        statusText = `Scheduled: ${format(closeTime, 'MMM d, p')}`;
                        statusColor = 'text-blue-600';
                        StatusIcon = Clock;
                      }
                    }

                    return (
                      <li key={poll.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-md shadow-sm gap-2">
                        <div className="flex-grow">
                           <span className="text-sm font-medium truncate pr-2 block" title={poll.title}>{poll.title}</span>
                           <div className={`text-xs flex items-center gap-1 ${statusColor}`}>
                             <StatusIcon className="h-3.5 w-3.5" /> {statusText}
                           </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                          <Switch 
                            checked={poll.isOpen} 
                            onCheckedChange={() => handleTogglePollStatus(poll.id, poll.isOpen)}
                            aria-label={`Toggle status for poll ${poll.title}`}
                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                          />
                          <Button asChild variant="outline" size="sm" className="h-8">
                            <Link href={`/admin/edit-poll/${poll.id}`} className="flex items-center">
                              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> {editButtonText}
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="h-8">
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {deleteButtonText}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{confirmDeleteTitle}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {confirmDeleteDescription.replace("{{pollTitle}}", poll.title)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{cancelButtonText}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePoll(poll.id)}>{deletePollButtonText}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
             <CardFooter className="text-xs text-muted-foreground text-center pt-3 border-t">
              <p>{managePollsFooter}</p>
            </CardFooter>
          </Card>


          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center">{resultsVisibilityTitle}</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center space-x-3 py-4">
              {isLoadingVisibility ? (
                <p className="text-sm text-muted-foreground">{loadingSettingsText}</p>
              ) : (
                <>
                  <Label htmlFor="results-visibility-switch" className="flex items-center gap-2 cursor-pointer">
                    {isResultsPublic ? <Eye className="h-5 w-5 text-green-500" /> : <EyeOff className="h-5 w-5 text-red-500" />}
                    <span>{isResultsPublic ? publicText : privateText}</span>
                  </Label>
                  <Switch id="results-visibility-switch" checked={isResultsPublic} onCheckedChange={handleResultsVisibilityToggle} aria-label={`Toggle results visibility, currently ${isResultsPublic ? publicText : privateText}`} />
                </>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground text-center pt-3 border-t"><p>{resultsVisibilityFooter}</p></CardFooter>
          </Card>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><PencilLine className="h-5 w-5" /> {editHomePageIntroTitle}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="homeIntroText">{introTextLabel}</Label>
              {isLoadingHomeIntro ? ( <p className="text-sm text-muted-foreground">{loadingTextLabel}</p> ) : (
                <Textarea id="homeIntroText" value={homeIntroText} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHomeIntroText(e.target.value)} placeholder={DEFAULT_HOME_INTRO} rows={5} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4"><Button onClick={handleSaveHomeIntro} className="w-full" disabled={isLoadingHomeIntro}><Save className="mr-2 h-4 w-4" /> {saveHomeIntroButton}</Button></CardFooter>
          </Card>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><PencilLine className="h-5 w-5" /> {editVotePageIntroTitle}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="voteIntroText">{introTextLabel}</Label>
              {isLoadingVoteIntro ? ( <p className="text-sm text-muted-foreground">{loadingTextLabel}</p> ): (
                <Textarea id="voteIntroText" value={voteIntroText} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setVoteIntroText(e.target.value)} placeholder={DEFAULT_VOTE_INTRO} rows={4} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4"><Button onClick={handleSaveVoteIntro} className="w-full" disabled={isLoadingVoteIntro}><Save className="mr-2 h-4 w-4" /> {saveVoteIntroButton}</Button></CardFooter>
          </Card>
          
        </CardContent>
      </Card>
    </div>
  );
}
