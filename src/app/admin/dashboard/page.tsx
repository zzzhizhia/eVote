
'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Settings, Eye, EyeOff, AlertTriangle, Save, PencilLine, ListChecks, Edit3, Trash2, Clock, ToggleLeft, ToggleRight, CheckCircle, XCircle, FileText, MessageSquareText } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext';


const RESULTS_VISIBILITY_KEY = 'eVote_isResultsPublic';
const HOME_PAGE_TITLE_KEY = 'eVote_homePageTitle_';
const HOME_PAGE_DESCRIPTION_KEY = 'eVote_homePageDescription_';
const HOME_PAGE_INTRO_TEXT_KEY = 'eVote_homePageIntroText_'; 
const VOTE_PAGE_INTRO_TEXT_KEY = 'eVote_votePageIntroText_'; 
const POLLS_STORAGE_KEY = 'eVote_polls_list';


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
    }
  }
  return updatedPolls;
};


export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLanguage(); 

  const defaultHomeTitle = t('home.title');
  const defaultHomeDescription = t('home.description');
  const defaultHomeIntro = t('home.defaultIntro');
  const defaultVoteIntro = t('votePage.defaultIntro'); 

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isResultsPublic, setIsResultsPublic] = useState(false);
  const [isLoadingVisibility, setIsLoadingVisibility] = useState(true);

  const [homeTitle, setHomeTitle] = useState('');
  const [homeDescription, setHomeDescription] = useState('');
  const [homeIntroText, setHomeIntroText] = useState('');
  const [voteIntroText, setVoteIntroText] = useState('');
  const [isLoadingHomeTitle, setIsLoadingHomeTitle] = useState(true);
  const [isLoadingHomeDescription, setIsLoadingHomeDescription] = useState(true);
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
       toast({ title: t('toast.errorLoadingSettings'), description: t('toast.errorLoadingSettingsVisibilityDescription'), variant: "destructive" });
    }
    setIsLoadingVisibility(false);
    loadPollsFromStorage();
  }, [router, toast, t]);

   useEffect(() => {
    const currentHomePageTitleKey = `${HOME_PAGE_TITLE_KEY}${locale}`;
    setIsLoadingHomeTitle(true);
    try {
      const storedHomeTitle = localStorage.getItem(currentHomePageTitleKey);
      setHomeTitle(storedHomeTitle || defaultHomeTitle);
    } catch (error) {
        console.error("Error reading home page title from localStorage:", error);
        setHomeTitle(defaultHomeTitle);
        toast({ title: t('toast.errorLoadingHomeTitle'), description: t('toast.errorLoadingHomeTitleDescription'), variant: "destructive"});
    }
    setIsLoadingHomeTitle(false);

    const currentHomePageDescriptionKey = `${HOME_PAGE_DESCRIPTION_KEY}${locale}`;
    setIsLoadingHomeDescription(true);
    try {
        const storedHomeDescription = localStorage.getItem(currentHomePageDescriptionKey);
        setHomeDescription(storedHomeDescription || defaultHomeDescription);
    } catch (error) {
        console.error("Error reading home page description from localStorage:", error);
        setHomeDescription(defaultHomeDescription);
        toast({ title: t('toast.errorLoadingHomeDescription'), description: t('toast.errorLoadingHomeDescriptionDescription'), variant: "destructive"});
    }
    setIsLoadingHomeDescription(false);


    const currentHomePageIntroKey = `${HOME_PAGE_INTRO_TEXT_KEY}${locale}`;
    setIsLoadingHomeIntro(true);
    try {
      const storedHomeIntro = localStorage.getItem(currentHomePageIntroKey);
      setHomeIntroText(storedHomeIntro || defaultHomeIntro);
    } catch (error) {
      console.error("Error reading home intro text from localStorage:", error);
      setHomeIntroText(defaultHomeIntro);
      toast({ title: t('toast.errorLoadingHomeIntro'), description: t('toast.errorLoadingHomeIntroDescription'), variant: "destructive" });
    }
    setIsLoadingHomeIntro(false);

    const currentVotePageIntroKey = `${VOTE_PAGE_INTRO_TEXT_KEY}${locale}`;
    setIsLoadingVoteIntro(true);
    try {
      const storedVoteIntro = localStorage.getItem(currentVotePageIntroKey);
      setVoteIntroText(storedVoteIntro || defaultVoteIntro);
    } catch (error) {
      console.error("Error reading vote intro text from localStorage:", error);
      setVoteIntroText(defaultVoteIntro);
      toast({ title: t('toast.errorLoadingVoteIntro'), description: t('toast.errorLoadingVoteIntroDescription'), variant: "destructive" });
    }
    setIsLoadingVoteIntro(false);
  }, [locale, defaultHomeTitle, defaultHomeDescription, defaultHomeIntro, defaultVoteIntro, t, toast]);


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
      toast({ title: t('toast.errorLoadingPolls'), description: t('toast.errorLoadingPollsDescription'), variant: "destructive" });
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
        title: !currentStatus ? t('toast.pollStatusOpened') : t('toast.pollStatusClosed'),
        description: t('toast.pollStatusChangedDescription', { status: !currentStatus ? t('toast.pollStatus.acceptingVotes') : t('toast.pollStatus.closedForVoting')}),
      });
    } catch (error) {
      console.error("Error toggling poll status:", error);
      toast({ title: t('toast.errorUpdatingPoll'), description: t('toast.errorUpdatingPollDescription'), variant: "destructive" });
    }
  };


  const handleResultsVisibilityToggle = (checked: boolean) => {
    try {
      localStorage.setItem(RESULTS_VISIBILITY_KEY, JSON.stringify(checked));
      setIsResultsPublic(checked);
      toast({ 
        title: t('toast.resultsVisibilityUpdated'), 
        description: t('toast.resultsVisibilityUpdatedDescription', { status: checked ? t('toast.resultsVisibility.public') : t('toast.resultsVisibility.private')}) 
      });
    } catch (error) {
       console.error("Error saving results visibility to localStorage:", error);
       toast({ title: t('toast.errorSavingSettings'), description: t('toast.errorSavingSettingsVisibilityDescription'), variant: "destructive" });
    }
  };

  const handleSaveHomeTitle = () => {
    const currentHomePageTitleKey = `${HOME_PAGE_TITLE_KEY}${locale}`;
    try {
        localStorage.setItem(currentHomePageTitleKey, homeTitle);
        toast({ title: t('toast.homeTitleSaved'), description: t('toast.homeTitleSavedDescription') });
    } catch (error) {
        console.error("Error saving home page title to localStorage:", error);
        toast({ title: t('toast.errorSavingHomeTitle'), description: t('toast.errorSavingHomeTitleDescription'), variant: "destructive" });
    }
  };

  const handleSaveHomeDescription = () => {
    const currentHomePageDescriptionKey = `${HOME_PAGE_DESCRIPTION_KEY}${locale}`;
    try {
        localStorage.setItem(currentHomePageDescriptionKey, homeDescription);
        toast({ title: t('toast.homeDescriptionSaved'), description: t('toast.homeDescriptionSavedDescription') });
    } catch (error) {
        console.error("Error saving home page description to localStorage:", error);
        toast({ title: t('toast.errorSavingHomeDescription'), description: t('toast.errorSavingHomeDescriptionDescription'), variant: "destructive" });
    }
  };

  const handleSaveHomeIntro = () => {
    const currentHomePageIntroKey = `${HOME_PAGE_INTRO_TEXT_KEY}${locale}`;
    try {
      localStorage.setItem(currentHomePageIntroKey, homeIntroText);
      toast({ title: t('toast.homeIntroSaved'), description: t('toast.homeIntroSavedDescription') });
    } catch (error) {
      console.error("Error saving home intro text to localStorage:", error);
      toast({ title: t('toast.errorSavingHomeIntro'), description: t('toast.errorLoadingHomeIntroDescription'), variant: "destructive" });
    }
  };

  const handleSaveVoteIntro = () => {
    const currentVotePageIntroKey = `${VOTE_PAGE_INTRO_TEXT_KEY}${locale}`;
    try {
      localStorage.setItem(currentVotePageIntroKey, voteIntroText);
      toast({ title: t('toast.voteIntroSaved'), description: t('toast.voteIntroSavedDescription') });
    } catch (error) {
      console.error("Error saving vote intro text to localStorage:", error);
      toast({ title: t('toast.errorSavingVoteIntro'), description: t('toast.errorLoadingVoteIntroDescription'), variant: "destructive" });
    }
  };

  const handleDeletePoll = (pollId: string) => {
    try {
      const updatedPolls = polls.filter(p => p.id !== pollId);
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(updatedPolls));
      setPolls(updatedPolls);
      toast({ title: t('toast.pollDeleted'), description: t('toast.pollDeletedDescription') });
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast({ title: t('toast.errorDeletingPoll'), description: t('toast.errorDeletingPollDescription'), variant: "destructive" });
    }
  };
  
  if (!isAdminAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <CardTitle className="text-2xl">{t('admin.dashboard.adminAccessDenied')}</CardTitle>
          </CardHeader>
          <CardContent><p>{t('admin.dashboard.adminAccessDeniedDescription')}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 space-y-8">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="items-center text-center">
          <Settings className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold">{t('admin.dashboard.title')}</CardTitle>
          <CardDescription className="text-lg">{t('admin.dashboard.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 p-6">
          <Button asChild size="lg" className="w-full max-w-xs shadow-md hover:shadow-lg transition-shadow">
            <Link href="/admin/create-poll" className="flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" /> {t('admin.dashboard.createNewPollButton')}
            </Link>
          </Button>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                <ListChecks className="h-5 w-5" /> {t('admin.dashboard.managePollsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-3">
              {isLoadingPolls ? (
                <p className="text-sm text-muted-foreground text-center">{t('admin.dashboard.loadingPolls')}</p>
              ) : polls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">{t('admin.dashboard.noPollsCreated')}</p>
              ) : (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {polls.map((poll) => {
                    let statusTextKey = poll.isOpen ? 'admin.dashboard.pollStatusOpen' : 'admin.dashboard.pollStatusClosed';
                    let statusColor = poll.isOpen ? 'text-green-600' : 'text-red-600';
                    let StatusIcon = poll.isOpen ? CheckCircle : XCircle;
                    let statusTextParam = {};

                    if (poll.isOpen && poll.scheduledCloseTime) {
                      const closeTime = parseISO(poll.scheduledCloseTime);
                      if (new Date() < closeTime) {
                        statusTextKey = 'admin.dashboard.pollStatusScheduled';
                        statusTextParam = { time: format(closeTime, 'MMM d, p') };
                        statusColor = 'text-blue-600';
                        StatusIcon = Clock;
                      }
                    }

                    return (
                      <li key={poll.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-md shadow-sm gap-2">
                        <div className="flex-grow">
                           <span className="text-sm font-medium truncate pr-2 block" title={poll.title}>{poll.title}</span>
                           <div className={`text-xs flex items-center gap-1 ${statusColor}`}>
                             <StatusIcon className="h-3.5 w-3.5" /> {t(statusTextKey, statusTextParam)}
                           </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                          <Switch 
                            checked={poll.isOpen} 
                            onCheckedChange={() => handleTogglePollStatus(poll.id, poll.isOpen)}
                            aria-label={t('admin.dashboard.togglePollStatusAriaLabel', { pollTitle: poll.title })}
                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                          />
                          <Button asChild variant="outline" size="sm" className="h-8">
                            <Link href={`/admin/edit-poll/${poll.id}`} className="flex items-center">
                              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> {t('admin.dashboard.editButton')}
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="h-8">
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {t('admin.dashboard.deleteButton')}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('admin.dashboard.confirmDeleteTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('admin.dashboard.confirmDeleteDescription', { pollTitle: poll.title })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('admin.dashboard.cancelButton')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePoll(poll.id)}>{t('admin.dashboard.deletePollButton')}</AlertDialogAction>
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
              <p>{t('admin.dashboard.managePollsFooter')}</p>
            </CardFooter>
          </Card>


          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center">{t('admin.dashboard.resultsVisibilityTitle')}</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center space-x-3 py-4">
              {isLoadingVisibility ? (
                <p className="text-sm text-muted-foreground">{t('admin.dashboard.loadingSettings')}</p>
              ) : (
                <>
                  <Label htmlFor="results-visibility-switch" className="flex items-center gap-2 cursor-pointer">
                    {isResultsPublic ? <Eye className="h-5 w-5 text-green-500" /> : <EyeOff className="h-5 w-5 text-red-500" />}
                    <span>{isResultsPublic ? t('admin.dashboard.resultsVisibilityPublic') : t('admin.dashboard.resultsVisibilityPrivate')}</span>
                  </Label>
                  <Switch 
                    id="results-visibility-switch" 
                    checked={isResultsPublic} 
                    onCheckedChange={handleResultsVisibilityToggle} 
                    aria-label={t('admin.dashboard.resultsVisibilityToggleAriaLabel', { status: isResultsPublic ? t('admin.dashboard.resultsVisibilityPublic') : t('admin.dashboard.resultsVisibilityPrivate')})} 
                  />
                </>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground text-center pt-3 border-t"><p>{t('admin.dashboard.resultsVisibilityFooter')}</p></CardFooter>
          </Card>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><FileText className="h-5 w-5" /> {t('admin.dashboard.editHomePageTitleCardTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="homeTitleInput">{t('admin.dashboard.homePageTitleLabel')}</Label>
              {isLoadingHomeTitle ? ( <p className="text-sm text-muted-foreground">{t('admin.dashboard.loadingText')}</p> ) : (
                <Input id="homeTitleInput" value={homeTitle} onChange={(e: ChangeEvent<HTMLInputElement>) => setHomeTitle(e.target.value)} placeholder={t('admin.dashboard.homePageTitlePlaceholder')} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4"><Button onClick={handleSaveHomeTitle} className="w-full" disabled={isLoadingHomeTitle}><Save className="mr-2 h-4 w-4" /> {t('admin.dashboard.saveHomePageTitleButton')}</Button></CardFooter>
          </Card>
          
          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><MessageSquareText className="h-5 w-5" /> {t('admin.dashboard.editHomePageDescriptionCardTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="homeDescriptionTextarea">{t('admin.dashboard.homePageDescriptionLabel')}</Label>
              {isLoadingHomeDescription ? ( <p className="text-sm text-muted-foreground">{t('admin.dashboard.loadingText')}</p> ) : (
                <Textarea id="homeDescriptionTextarea" value={homeDescription} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHomeDescription(e.target.value)} placeholder={t('admin.dashboard.homePageDescriptionPlaceholder')} rows={3} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4"><Button onClick={handleSaveHomeDescription} className="w-full" disabled={isLoadingHomeDescription}><Save className="mr-2 h-4 w-4" /> {t('admin.dashboard.saveHomePageDescriptionButton')}</Button></CardFooter>
          </Card>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><PencilLine className="h-5 w-5" /> {t('admin.dashboard.editHomePageIntroTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="homeIntroText">{t('admin.dashboard.introTextLabel')}</Label>
              {isLoadingHomeIntro ? ( <p className="text-sm text-muted-foreground">{t('admin.dashboard.loadingText')}</p> ) : (
                <Textarea id="homeIntroText" value={homeIntroText} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHomeIntroText(e.target.value)} placeholder={defaultHomeIntro} rows={5} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4"><Button onClick={handleSaveHomeIntro} className="w-full" disabled={isLoadingHomeIntro}><Save className="mr-2 h-4 w-4" /> {t('admin.dashboard.saveHomeIntroButton')}</Button></CardFooter>
          </Card>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><PencilLine className="h-5 w-5" /> {t('admin.dashboard.editVotePageIntroTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="voteIntroText">{t('admin.dashboard.introTextLabel')}</Label>
              {isLoadingVoteIntro ? ( <p className="text-sm text-muted-foreground">{t('admin.dashboard.loadingText')}</p> ): (
                <Textarea id="voteIntroText" value={voteIntroText} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setVoteIntroText(e.target.value)} placeholder={defaultVoteIntro} rows={4} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4"><Button onClick={handleSaveVoteIntro} className="w-full" disabled={isLoadingVoteIntro}><Save className="mr-2 h-4 w-4" /> {t('admin.dashboard.saveVoteIntroButton')}</Button></CardFooter>
          </Card>
          
        </CardContent>
      </Card>
    </div>
  );
}

    

    