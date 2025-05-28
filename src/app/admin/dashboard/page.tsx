
'use client';

import { useEffect, useState, type ChangeEvent, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Settings, Eye, EyeOff, AlertTriangle, Save, PencilLine, ListChecks, Edit3, Trash2, Clock, ToggleLeft, ToggleRight, CheckCircle, XCircle, FileText, MessageSquareText, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import type { Poll } from '@/lib/types';
// Removed CustomTexts import as we'll use individual localStorage items
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

const POLLS_STORAGE_KEY = 'eVote_polls_list';
const RESULTS_VISIBILITY_KEY = 'eVote_resultsPublic';
const getCustomTextKey = (baseKey: string, locale: string) => `eVote_${baseKey}_${locale}`;


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

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isResultsPublic, setIsResultsPublic] = useState(false);
  const [isLoadingVisibility, setIsLoadingVisibility] = useState(true);

  // Local states for input fields
  const [homeTitleInput, setHomeTitleInput] = useState('');
  const [homeDescriptionInput, setHomeDescriptionInput] = useState('');
  const [homeIntroTextInput, setHomeIntroTextInput] = useState('');
  const [voteIntroTextInput, setVoteIntroTextInput] = useState('');
  const [isLoadingCustomTexts, setIsLoadingCustomTexts] = useState(true);
  
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  const [isSavingVisibility, setIsSavingVisibility] = useState(false);
  const [isSavingHomeTitle, setIsSavingHomeTitle] = useState(false);
  const [isSavingHomeDescription, setIsSavingHomeDescription] = useState(false);
  const [isSavingHomeIntro, setIsSavingHomeIntro] = useState(false);
  const [isSavingVoteIntro, setIsSavingVoteIntro] = useState(false);

  const defaultTexts = useMemo(() => ({
    homeTitle: t('home.title'),
    homeDescription: t('home.description'),
    homeIntro: t('home.defaultIntro'),
    voteIntro: t('votePage.defaultIntro'),
  }), [t]);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated') === 'true';
    setIsAdminAuthenticated(authStatus);
    if (!authStatus) {
      router.push('/admin');
      return; 
    }

    // Fetch results visibility from localStorage
    setIsLoadingVisibility(true);
    try {
      const storedVisibility = localStorage.getItem(RESULTS_VISIBILITY_KEY);
      setIsResultsPublic(storedVisibility ? JSON.parse(storedVisibility) : false);
    } catch (error) {
      console.error("Error fetching results visibility from localStorage:", error);
      setIsResultsPublic(false); 
      toast({ title: t('toast.errorLoadingSettings'), description: t('toast.errorLoadingSettingsVisibilityDescription'), variant: "destructive" });
    }
    setIsLoadingVisibility(false);

    loadPollsFromStorage();
  }, [router, toast, t]);

  const fetchAndSetCustomTexts = useCallback(() => {
    setIsLoadingCustomTexts(true);
    try {
      setHomeTitleInput(localStorage.getItem(getCustomTextKey('homePageTitle', locale)) || defaultTexts.homeTitle);
      setHomeDescriptionInput(localStorage.getItem(getCustomTextKey('homePageDescription', locale)) || defaultTexts.homeDescription);
      setHomeIntroTextInput(localStorage.getItem(getCustomTextKey('homePageIntroText', locale)) || defaultTexts.homeIntro);
      setVoteIntroTextInput(localStorage.getItem(getCustomTextKey('votePageIntroText', locale)) || defaultTexts.voteIntro);
    } catch (error) {
      console.error("Error fetching custom texts from localStorage:", error);
      toast({ title: t('toast.errorLoadingTexts'), description: t('toast.errorLoadingTextsDescription'), variant: "destructive" });
      setHomeTitleInput(defaultTexts.homeTitle);
      setHomeDescriptionInput(defaultTexts.homeDescription);
      setHomeIntroTextInput(defaultTexts.homeIntro);
      setVoteIntroTextInput(defaultTexts.voteIntro);
    }
    setIsLoadingCustomTexts(false);
  }, [locale, toast, t, defaultTexts]);

  useEffect(() => {
    if(isAdminAuthenticated) {
      fetchAndSetCustomTexts();
    }
  }, [isAdminAuthenticated, fetchAndSetCustomTexts]);
  
  useEffect(() => {
    if (!isLoadingCustomTexts) { // Re-fetch if locale changes and texts are not currently loading
        fetchAndSetCustomTexts();
    }
  }, [locale, isLoadingCustomTexts, fetchAndSetCustomTexts]);


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

  const handleResultsVisibilityToggle = async (checked: boolean) => {
    setIsSavingVisibility(true);
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
    setIsSavingVisibility(false);
  };

  const handleSaveCustomText = async (
    textKey: 'homePageTitle' | 'homePageDescription' | 'homePageIntroText' | 'votePageIntroText', 
    value: string, 
    setLoadingState: (loading: boolean) => void, 
    successToastTitleKey: string, 
    successToastDescKey: string, 
    errorToastTitleKey: string, 
    errorToastDescKey: string
  ) => {
    setLoadingState(true);
    try {
      localStorage.setItem(getCustomTextKey(textKey, locale), value);
      // Update the corresponding input state locally to reflect the change immediately
      if (textKey === 'homePageTitle') setHomeTitleInput(value);
      else if (textKey === 'homePageDescription') setHomeDescriptionInput(value);
      else if (textKey === 'homePageIntroText') setHomeIntroTextInput(value);
      else if (textKey === 'votePageIntroText') setVoteIntroTextInput(value);
      
      toast({ title: t(successToastTitleKey), description: t(successToastDescKey) });
    } catch (error) {
      console.error(`Error saving ${textKey} to localStorage:`, error);
      toast({ title: t(errorToastTitleKey), description: t(errorToastDescKey), variant: "destructive" });
    }
    setLoadingState(false);
  };

  const handleDeletePoll = (pollId: string) => {
    try {
      const updatedPolls = polls.filter(p => p.id !== pollId);
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(updatedPolls));
      setPolls(updatedPolls);
      toast({ title: t('toast.pollDeleted'), description: t('toast.pollDeletedDescription') });
    } catch (error) {
      console.error("Error deleting poll from localStorage:", error);
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

  const CurrentIcon = ({ isLoading }: { isLoading: boolean }) => 
    isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />;


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
                 <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
                    disabled={isSavingVisibility}
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
              {isLoadingCustomTexts ? ( <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> ) : (
                <Input id="homeTitleInput" value={homeTitleInput} onChange={(e: ChangeEvent<HTMLInputElement>) => setHomeTitleInput(e.target.value)} placeholder={t('admin.dashboard.homePageTitlePlaceholder')} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                onClick={() => handleSaveCustomText('homePageTitle', homeTitleInput, setIsSavingHomeTitle, 'toast.homeTitleSaved', 'toast.homeTitleSavedDescription', 'toast.errorSavingHomeTitle', 'toast.errorSavingHomeTitleDescription')} 
                className="w-full" 
                disabled={isLoadingCustomTexts || isSavingHomeTitle}>
                 <CurrentIcon isLoading={isSavingHomeTitle} /> {t('admin.dashboard.saveHomePageTitleButton')}
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><MessageSquareText className="h-5 w-5" /> {t('admin.dashboard.editHomePageDescriptionCardTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="homeDescriptionTextarea">{t('admin.dashboard.homePageDescriptionLabel')}</Label>
              {isLoadingCustomTexts ? ( <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> ) : (
                <Textarea id="homeDescriptionTextarea" value={homeDescriptionInput} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHomeDescriptionInput(e.target.value)} placeholder={t('admin.dashboard.homePageDescriptionPlaceholder')} rows={3} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                onClick={() => handleSaveCustomText('homePageDescription', homeDescriptionInput, setIsSavingHomeDescription, 'toast.homeDescriptionSaved', 'toast.homeDescriptionSavedDescription', 'toast.errorSavingHomeDescription', 'toast.errorSavingHomeDescriptionDescription')} 
                className="w-full" 
                disabled={isLoadingCustomTexts || isSavingHomeDescription}>
                <CurrentIcon isLoading={isSavingHomeDescription} /> {t('admin.dashboard.saveHomePageDescriptionButton')}
              </Button>
            </CardFooter>
          </Card>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><PencilLine className="h-5 w-5" /> {t('admin.dashboard.editHomePageIntroTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="homeIntroText">{t('admin.dashboard.introTextLabel')}</Label>
              {isLoadingCustomTexts ? (  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />  ) : (
                <Textarea id="homeIntroText" value={homeIntroTextInput} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHomeIntroTextInput(e.target.value)} placeholder={defaultTexts.homeIntro} rows={5} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                onClick={() => handleSaveCustomText('homePageIntroText', homeIntroTextInput, setIsSavingHomeIntro, 'toast.homeIntroSaved', 'toast.homeIntroSavedDescription', 'toast.errorSavingHomeIntro', 'toast.errorLoadingHomeIntroDescription')} 
                className="w-full" 
                disabled={isLoadingCustomTexts || isSavingHomeIntro}>
                <CurrentIcon isLoading={isSavingHomeIntro} /> {t('admin.dashboard.saveHomeIntroButton')}
              </Button>
            </CardFooter>
          </Card>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><PencilLine className="h-5 w-5" /> {t('admin.dashboard.editVotePageIntroTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="voteIntroText">{t('admin.dashboard.introTextLabel')}</Label>
              {isLoadingCustomTexts ? ( <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> ): (
                <Textarea id="voteIntroText" value={voteIntroTextInput} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setVoteIntroTextInput(e.target.value)} placeholder={defaultTexts.voteIntro} rows={4} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                onClick={() => handleSaveCustomText('votePageIntroText', voteIntroTextInput, setIsSavingVoteIntro, 'toast.voteIntroSaved', 'toast.voteIntroSavedDescription', 'toast.errorSavingVoteIntro', 'toast.errorLoadingVoteIntroDescription')} 
                className="w-full" 
                disabled={isLoadingCustomTexts || isSavingVoteIntro}>
                <CurrentIcon isLoading={isSavingVoteIntro} /> {t('admin.dashboard.saveVoteIntroButton')}
              </Button>
            </CardFooter>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
