
'use client';

import { useEffect, useState, type ChangeEvent, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Settings, Eye, EyeOff, AlertTriangle, Save, PencilLine, ListChecks, Edit3, Trash2, Clock, CheckCircle, XCircle, FileText, MessageSquareText, Loader2, LogOut } from 'lucide-react';
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

interface CustomTexts {
  homePageTitle?: string;
  homePageDescription?: string;
  homePageIntroText?: string;
  votePageIntroText?: string;
}

const checkAndUpdatePollStatuses = (polls: Poll[]): { updatedPolls: Poll[], wasChanged: boolean } => {
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
  return { updatedPolls, wasChanged };
};


export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLanguage(); 

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [isResultsPublic, setIsResultsPublic] = useState(false);
  const [isLoadingVisibility, setIsLoadingVisibility] = useState(true);

  const [customTexts, setCustomTexts] = useState<CustomTexts>({});
  const [isLoadingCustomTexts, setIsLoadingCustomTexts] = useState(true);
  
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  const [homeTitleInput, setHomeTitleInput] = useState('');
  const [homeDescriptionInput, setHomeDescriptionInput] = useState('');
  const [homeIntroTextInput, setHomeIntroTextInput] = useState('');
  const [voteIntroTextInput, setVoteIntroTextInput] = useState('');

  const [isSavingVisibility, setIsSavingVisibility] = useState(false);
  const [isSavingCustomTexts, setIsSavingCustomTexts] = useState<{[key: string]: boolean}>({});


  const defaultLocalizedTexts = useMemo(() => ({
    homePageTitle: t('home.title'),
    homePageDescription: t('home.description'),
    homePageIntroText: t('home.defaultIntro'),
    votePageIntroText: t('votePage.defaultIntro'),
  }), [t]);

  const fetchAdminStatusAndData = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      const userRes = await fetch('/api/user');
      if (!userRes.ok) throw new Error('Failed to fetch user status');
      const userData = await userRes.json();

      if (!userData.isAdmin) {
        router.push('/admin');
        return;
      }
      setIsAdminAuthenticated(true);

      setIsLoadingVisibility(true);
      setIsLoadingCustomTexts(true);
      const settingsRes = await fetch('/api/settings');
      if (!settingsRes.ok) {
        let errorDetails = `Status: ${settingsRes.status}`;
        try {
          const errorData = await settingsRes.json();
          errorDetails += `, Message: ${errorData.message || 'Unknown server error'}`;
        } catch (e) {
          try {
            const textError = await settingsRes.text();
            errorDetails += `, Body: ${textError.substring(0, 200)}`;
          } catch (textE) {
            errorDetails += `, Body: Could not read error body.`;
          }
        }
        throw new Error(`Failed to fetch settings for admin dashboard. ${errorDetails}`);
      }
      const settingsData = await settingsRes.json();
      
      setIsResultsPublic(settingsData.resultsVisibility || false);
      
      const currentLocaleCustomTexts = settingsData.customTexts?.[locale] || {};
      setCustomTexts(settingsData.customTexts || {});
      
      setHomeTitleInput(currentLocaleCustomTexts.homePageTitle || defaultLocalizedTexts.homePageTitle);
      setHomeDescriptionInput(currentLocaleCustomTexts.homePageDescription || defaultLocalizedTexts.homePageDescription);
      setHomeIntroTextInput(currentLocaleCustomTexts.homePageIntroText || defaultLocalizedTexts.homePageIntroText);
      setVoteIntroTextInput(currentLocaleCustomTexts.votePageIntroText || defaultLocalizedTexts.votePageIntroText);

      setIsLoadingVisibility(false);
      setIsLoadingCustomTexts(false);

      loadPolls();

    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast({ title: t('toast.errorLoadingData'), description: (error as Error).message || t('toast.errorLoadingDataDescription'), variant: "destructive" });
    } finally {
      setIsAuthLoading(false);
    }
  }, [router, toast, t, locale, defaultLocalizedTexts]); 

  useEffect(() => {
    fetchAdminStatusAndData();
  }, [fetchAdminStatusAndData]);

   useEffect(() => {
    if (isAdminAuthenticated && !isLoadingCustomTexts) {
        const currentLocaleCustomTexts = customTexts[locale as keyof typeof customTexts] || {};
        setHomeTitleInput(currentLocaleCustomTexts.homePageTitle || defaultLocalizedTexts.homePageTitle);
        setHomeDescriptionInput(currentLocaleCustomTexts.homePageDescription || defaultLocalizedTexts.homePageDescription);
        setHomeIntroTextInput(currentLocaleCustomTexts.homePageIntroText || defaultLocalizedTexts.homePageIntroText);
        setVoteIntroTextInput(currentLocaleCustomTexts.votePageIntroText || defaultLocalizedTexts.votePageIntroText);
    }
  }, [locale, isAdminAuthenticated, isLoadingCustomTexts, customTexts, defaultLocalizedTexts]);


  const loadPolls = async () => {
    setIsLoadingPolls(true);
    try {
      const res = await fetch('/api/polls');
      if (!res.ok) throw new Error('Failed to fetch polls');
      let fetchedPolls: Poll[] = await res.json();
      
      const { updatedPolls, wasChanged } = checkAndUpdatePollStatuses(fetchedPolls);
      setPolls(updatedPolls);

      if (wasChanged) {
        for (const poll of updatedPolls) {
          if (!poll.isOpen && fetchedPolls.find(p => p.id === poll.id)?.isOpen) {
            // Find the original poll to get its full data for the PUT request
            const originalPoll = fetchedPolls.find(p => p.id === poll.id);
            if (originalPoll) {
                const pollToClose = { ...originalPoll, isOpen: false };
                 await fetch(`/api/polls/${poll.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pollToClose), 
                 });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading polls:", error);
      setPolls([]);
      toast({ title: t('toast.errorLoadingPolls'), description: (error as Error).message || t('toast.errorLoadingPollsDescription'), variant: "destructive" });
    }
    setIsLoadingPolls(false);
  };
  
  const handleTogglePollStatus = async (pollToToggle: Poll, newIsOpenState: boolean) => {
    const originalPolls = [...polls]; // Shallow copy for rollback
    const optimisticUpdatedPoll = { ...pollToToggle, isOpen: newIsOpenState };

    // Optimistic UI update
    setPolls(prevPolls =>
      prevPolls.map(p => (p.id === pollToToggle.id ? optimisticUpdatedPoll : p))
    );

    try {
      const res = await fetch(`/api/polls/${pollToToggle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Send the full poll object with the updated isOpen status
        body: JSON.stringify(optimisticUpdatedPoll),
      });

      if (!res.ok) {
        setPolls(originalPolls); // Rollback UI on API error
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update poll status on server');
      }
      
      // API call was successful, data is already reflected optimistically
      toast({
        title: newIsOpenState ? t('toast.pollStatusOpened') : t('toast.pollStatusClosed'),
        description: t('toast.pollStatusChangedDescription', { status: newIsOpenState ? t('toast.pollStatus.acceptingVotes') : t('toast.pollStatus.closedForVoting')}),
      });
    } catch (error) {
      // Ensure rollback if not already done (e.g. network error before res.ok check)
      // or if error occurred after a potential partial success (though less likely here)
      setPolls(originalPolls); 
      console.error("Error toggling poll status:", error);
      toast({ title: t('toast.errorUpdatingPoll'), description: (error as Error).message || t('toast.errorUpdatingPollDescription'), variant: "destructive" });
    }
  };


  const handleResultsVisibilityToggle = async (checked: boolean) => {
    setIsSavingVisibility(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'resultsVisibility', value: checked }),
      });
      if (!res.ok) throw new Error('Failed to update results visibility');
      
      setIsResultsPublic(checked);
      toast({ 
        title: t('toast.resultsVisibilityUpdated'), 
        description: t('toast.resultsVisibilityUpdatedDescription', { status: checked ? t('toast.resultsVisibility.public') : t('toast.resultsVisibility.private')}) 
      });
    } catch (error) {
       console.error("Error saving results visibility:", error);
       toast({ title: t('toast.errorSavingSettings'), description: (error as Error).message || t('toast.errorSavingSettingsVisibilityDescription'), variant: "destructive" });
    }
    setIsSavingVisibility(false);
  };

  const handleSaveCustomText = async (
    fieldKey: 'homePageTitle' | 'homePageDescription' | 'homePageIntroText' | 'votePageIntroText', 
    value: string,
    successToastTitleKey: string, 
    successToastDescKey: string, 
    errorToastTitleKey: string, 
    errorToastDescKey: string
  ) => {
    setIsSavingCustomTexts(prev => ({...prev, [fieldKey]: true}));
    try {
      const updatedCustomTexts = {
        ...customTexts,
        [locale]: {
          ...(customTexts[locale as keyof typeof customTexts] || {}),
          [fieldKey]: value,
        }
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'customTexts', value: updatedCustomTexts }),
      });
      if (!res.ok) throw new Error('Failed to save custom texts');

      setCustomTexts(updatedCustomTexts);
      if (fieldKey === 'homePageTitle') setHomeTitleInput(value);
      else if (fieldKey === 'homePageDescription') setHomeDescriptionInput(value);
      else if (fieldKey === 'homePageIntroText') setHomeIntroTextInput(value);
      else if (fieldKey === 'votePageIntroText') setVoteIntroTextInput(value);
      
      toast({ title: t(successToastTitleKey), description: t(successToastDescKey) });
    } catch (error) {
      console.error(`Error saving ${fieldKey}:`, error);
      toast({ title: t(errorToastTitleKey), description: (error as Error).message || t(errorToastDescKey), variant: "destructive" });
    }
    setIsSavingCustomTexts(prev => ({...prev, [fieldKey]: false}));
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      const res = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete poll');
      
      setPolls(prevPolls => prevPolls.filter(p => p.id !== pollId));
      toast({ title: t('toast.pollDeleted'), description: t('toast.pollDeletedDescription') });
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast({ title: t('toast.errorDeletingPoll'), description: (error as Error).message || t('toast.errorDeletingPollDescription'), variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      toast({ title: t('toast.loggedOut') });
      router.push('/admin');
    } catch (error) {
      toast({ title: t('toast.logoutError'), variant: 'destructive' });
    }
  };
  
  if (isAuthLoading || !isAdminAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const CurrentIcon = ({ isLoading }: { isLoading: boolean }) => 
    isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />;


  return (
    <div className="flex flex-col items-center py-10 space-y-8">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="items-center text-center relative">
          <Settings className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold">{t('admin.dashboard.title')}</CardTitle>
          <CardDescription className="text-lg">{t('admin.dashboard.description')}</CardDescription>
           <Button onClick={handleLogout} variant="outline" size="sm" className="absolute top-4 right-4">
            <LogOut className="mr-2 h-4 w-4" /> {t('admin.dashboard.logoutButton')}
          </Button>
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
                            onCheckedChange={(newCheckedState) => handleTogglePollStatus(poll, newCheckedState)}
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
                onClick={() => handleSaveCustomText('homePageTitle', homeTitleInput, 'toast.homeTitleSaved', 'toast.homeTitleSavedDescription', 'toast.errorSavingHomeTitle', 'toast.errorSavingHomeTitleDescription')} 
                className="w-full" 
                disabled={isLoadingCustomTexts || isSavingCustomTexts['homePageTitle']}>
                 <CurrentIcon isLoading={isSavingCustomTexts['homePageTitle'] || false} /> {t('admin.dashboard.saveHomePageTitleButton')}
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
                onClick={() => handleSaveCustomText('homePageDescription', homeDescriptionInput, 'toast.homeDescriptionSaved', 'toast.homeDescriptionSavedDescription', 'toast.errorSavingHomeDescription', 'toast.errorSavingHomeDescriptionDescription')} 
                className="w-full" 
                disabled={isLoadingCustomTexts || isSavingCustomTexts['homePageDescription']}>
                <CurrentIcon isLoading={isSavingCustomTexts['homePageDescription'] || false} /> {t('admin.dashboard.saveHomePageDescriptionButton')}
              </Button>
            </CardFooter>
          </Card>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><PencilLine className="h-5 w-5" /> {t('admin.dashboard.editHomePageIntroTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="homeIntroText">{t('admin.dashboard.introTextLabel')}</Label>
              {isLoadingCustomTexts ? (  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />  ) : (
                <Textarea id="homeIntroText" value={homeIntroTextInput} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHomeIntroTextInput(e.target.value)} placeholder={defaultLocalizedTexts.homePageIntroText} rows={5} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                onClick={() => handleSaveCustomText('homePageIntroText', homeIntroTextInput, 'toast.homeIntroSaved', 'toast.homeIntroSavedDescription', 'toast.errorSavingHomeIntro', 'toast.errorSavingHomeIntroDescription')} 
                className="w-full" 
                disabled={isLoadingCustomTexts || isSavingCustomTexts['homePageIntroText']}>
                <CurrentIcon isLoading={isSavingCustomTexts['homePageIntroText'] || false} /> {t('admin.dashboard.saveHomeIntroButton')}
              </Button>
            </CardFooter>
          </Card>

          <Card className="w-full max-w-md shadow-md">
            <CardHeader><CardTitle className="text-xl text-center flex items-center justify-center gap-2"><PencilLine className="h-5 w-5" /> {t('admin.dashboard.editVotePageIntroTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 py-4">
              <Label htmlFor="voteIntroText">{t('admin.dashboard.introTextLabel')}</Label>
              {isLoadingCustomTexts ? ( <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> ): (
                <Textarea id="voteIntroText" value={voteIntroTextInput} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setVoteIntroTextInput(e.target.value)} placeholder={defaultLocalizedTexts.votePageIntroText} rows={4} className="text-sm" />
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button 
                onClick={() => handleSaveCustomText('votePageIntroText', voteIntroTextInput, 'toast.voteIntroSaved', 'toast.voteIntroSavedDescription', 'toast.errorSavingVoteIntro', 'toast.errorSavingVoteIntroDescription')} 
                className="w-full" 
                disabled={isLoadingCustomTexts || isSavingCustomTexts['votePageIntroText']}>
                <CurrentIcon isLoading={isSavingCustomTexts['votePageIntroText'] || false} /> {t('admin.dashboard.saveVoteIntroButton')}
              </Button>
            </CardFooter>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
